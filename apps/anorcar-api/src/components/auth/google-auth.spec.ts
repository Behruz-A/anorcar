import 'reflect-metadata';
import { JwtService } from '@nestjs/jwt';
import { Mongoose, Types } from 'mongoose';
import type { Request, Response } from 'express';
import { createHash, createHmac } from 'crypto';
import { GoogleAuthService } from './google-auth.service';
import { AuthService } from './auth.service';
import { AuthSessionService } from './auth-session.service';
import { MemberService } from '../member/member.service';
import { GoogleLoginTicket } from '../../libs/dto/auth/google-auth';
import { Member } from '../../libs/dto/member/member';
import { MemberAuthType, MemberStatus, MemberType } from '../../libs/enums/member.enum';
import MemberSchema from '../../schemas/Member.model';

const generate = jest.fn();
const exchange = jest.fn();
const verify = jest.fn();
jest.mock('google-auth-library', () => ({
 OAuth2Client: jest.fn().mockImplementation(() => ({
  generateAuthUrl: (...args: unknown[]) => generate(...args),
  getToken: (...args: unknown[]) => exchange(...args),
  verifyIdToken: (...args: unknown[]) => verify(...args),
 })),
}));

describe('Google OAuth with isolated provider and storage', () => {
 const env = { ...process.env };
 const origin = 'http://localhost:3000';
 const jwt = new JwtService({ secret: 'google-flow-unit-test-secret' });
 const auth = new AuthService(jwt);
 const sessions = new AuthSessionService({} as never, {} as never, auth);
 const startSession = jest.spyOn(sessions, 'startSession').mockResolvedValue();
 const id = new Types.ObjectId();
 let member: Member | null;
 let profile: Record<string, unknown>;
 let tickets: GoogleLoginTicket[];
 const createMember = jest.fn();
 const memberModel = {
  findOne: jest.fn((query: Record<string, unknown>) => ({ exec: async () => {
   if (query.memberStatus && member?.memberStatus !== query.memberStatus) return null;
   return member;
  } })),
  create: createMember,
 };
 const ticketModel = {
  create: jest.fn(async (value: GoogleLoginTicket) => { tickets.push(value); return value; }),
  findOneAndDelete: jest.fn((query: Record<string, unknown>) => ({ exec: async () => {
   const index = tickets.findIndex(t => t.tokenHash === query.tokenHash && t.browserHash === query.browserHash &&
    t.origin === query.origin && t.expiresAt.getTime() > Date.now());
   return index < 0 ? null : tickets.splice(index, 1)[0];
  } })),
 };
 const service = new GoogleAuthService(memberModel as never, ticketModel as never, jwt, auth, sessions);
 const req = (overrides: Partial<Request> = {}) => ({ method: 'POST', headers: { origin, 'x-anorcar-client': 'web' }, ...overrides } as Request);
 const res = () => ({ cookie: jest.fn(), clearCookie: jest.fn(), setHeader: jest.fn(), redirect: jest.fn() }) as unknown as Response;
 type Flow = { state: string; nonce: string; verifier: string; origin: string; locale: string; returnTo: string };
 async function begin(referrer = '/cs', locale = 'en') {
  const response = res();
  await service.start({ origin, locale, referrer }, req(), response);
  const signed = (response.cookie as jest.Mock).mock.calls[0][1] as string;
  const flow = jwt.decode(signed) as Flow;
  return { flow, signed, response };
 }
 async function callback(options: { state?: string; error?: string; code?: unknown; signed?: string; locale?: string } = {}) {
  const begun = await begin('/cs', options.locale);
  profile.nonce = begun.flow.nonce;
  const response = res();
  await service.callback(req({ method: 'GET', headers: { cookie: 'anorcar_google_flow=' + (options.signed ?? begun.signed) },
   query: { state: options.state ?? begun.flow.state, code: options.code ?? 'provider-code', ...(options.error ? { error: options.error } : {}) } as Request['query'] }), response);
  return { ...begun, response };
 }
 async function handoff() {
  const result = await callback();
  const redirect = (result.response.redirect as jest.Mock).mock.calls[0][1] as string;
  const code = new URLSearchParams(new URL(redirect).hash.slice(1)).get('code')!;
  const binding = (result.response.cookie as jest.Mock).mock.calls[0][1] as string;
  return { code, binding };
 }
 const boundReq = (binding: string, target = origin) => req({ headers: { origin: target, 'x-anorcar-client': 'web', cookie: 'anorcar_google_ticket=' + binding } });

 beforeEach(() => {
  jest.clearAllMocks();
  process.env.SECRET_TOKEN = 'fixture-google-flow-key';
  process.env.GOOGLE_CLIENT_ID = 'fixture-client.apps.googleusercontent.com';
  process.env.GOOGLE_CLIENT_SECRET = 'secret-sentinel-never-exposed';
  process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3007/auth/google/callback';
  process.env.CLIENT_ORIGINS = origin;
  member = { _id: id, memberStatus: MemberStatus.ACTIVE, memberType: MemberType.USER, memberNick: 'fixture', googleSubject: 'subject-sentinel' } as Member;
  profile = { sub: 'google-subject', email_verified: true, name: 'Fixture User' };
  tickets = [];
  generate.mockReturnValue('https://accounts.google.com/o/oauth2/v2/auth');
  exchange.mockResolvedValue({ tokens: { id_token: 'private-provider-token' } });
  verify.mockImplementation(async () => ({ getPayload: () => profile }));
  createMember.mockImplementation(async (input: Partial<Member>) => { member = { ...input, _id: id, memberStatus: MemberStatus.ACTIVE } as Member; return member; });
 });
 afterAll(() => { process.env = env; });

 it('uses signed browser state, nonce, PKCE S256 and only identity scopes', async () => {
  const { flow, response, signed } = await begin();
  await expect(auth.verifyToken(signed)).rejects.toThrow();
  const params = generate.mock.calls[0][0];
  expect(params).toMatchObject({ state: flow.state, nonce: flow.nonce, code_challenge_method: 'S256', scope: ['openid', 'email', 'profile'] });
  expect(params.code_challenge).toBe(createHash('sha256').update(flow.verifier).digest('base64url'));
  expect((response.cookie as jest.Mock).mock.calls[0][2]).toMatchObject({ httpOnly: true, sameSite: 'lax', path: '/auth/google', maxAge: 600000 });
 });
 it.each(['//evil.test', '/\\evil.test', '/account/join', '/kr/account/google-callback', '/bad\npath'])('rejects unsafe referrer %s', async referrer => {
  expect((await begin(referrer)).flow.returnTo).toBe('/');
 });
 it('preserves a localized safe return', async () => { expect((await begin('/ru/car', 'ru')).flow.returnTo).toBe('/ru/car'); });
 it('denies untrusted origins and missing client headers before setting a cookie', async () => {
  await expect(service.start({ origin: 'https://evil.test' }, req(), res())).rejects.toThrow();
  await expect(service.start({ origin }, req({ headers: { origin } }), res())).rejects.toThrow();
  expect(generate).not.toHaveBeenCalled();
 });
 it('does not expose missing configuration values', async () => {
  delete process.env.GOOGLE_CLIENT_ID;
  await expect(service.start({ origin }, req(), res())).rejects.toThrow('Google sign-in is unavailable.');
 });
 it.each([{ state: 'wrong-state' }, { signed: 'tampered-signature' }, { error: 'access_denied' }, { code: ['bad', 'array'] }])('rejects invalid/cancelled callbacks %p', async options => {
  const { response } = await callback(options);
  expect(response.redirect).toHaveBeenCalledWith(303, origin + '/account/join?google=error');
  expect(exchange).not.toHaveBeenCalled();
  expect(ticketModel.create).not.toHaveBeenCalled();
 });
 it('rejects an expired signed browser flow', async () => {
  const signed = await jwt.signAsync({ state: 'old', origin }, { secret: createHmac('sha256', process.env.SECRET_TOKEN!).update('anorcar-google-oauth-state').digest('hex'), expiresIn: -1, issuer: 'anorcar', audience: 'google-login' });
  await callback({ signed });
  expect(exchange).not.toHaveBeenCalled();
 });
 it.each(['nonce', 'email_verified', 'sub'])('requires verified %s before using members', async key => {
  verify.mockImplementation(async () => ({ getPayload: () => ({ ...profile, [key]: key === 'email_verified' ? false : '' }) }));
  await callback();
  expect(memberModel.findOne).not.toHaveBeenCalled();
  expect(ticketModel.create).not.toHaveBeenCalled();
 });
 it('verifies ID token audience and code verifier, issues only a hashed browser-bound ticket', async () => {
  const { flow, response } = await callback();
  expect(exchange).toHaveBeenCalledWith({ code: 'provider-code', codeVerifier: flow.verifier });
  expect(verify).toHaveBeenCalledWith({ idToken: 'private-provider-token', audience: process.env.GOOGLE_CLIENT_ID });
  expect(tickets[0].tokenHash).toMatch(/^[a-f0-9]{64}$/);
  expect(tickets[0].browserHash).toMatch(/^[a-f0-9]{64}$/);
  const destination = (response.redirect as jest.Mock).mock.calls[0][1] as string;
  expect(destination).toMatch(/\/account\/google-callback#code=[\w-]{43}$/);
  expect(destination).not.toContain('private-provider-token');
  expect(startSession).not.toHaveBeenCalled();
 });
 it('creates a USER from Google subject without fabricated phone/password or email linking', async () => {
  member = null;
  await callback();
  expect(createMember).toHaveBeenCalledWith(expect.objectContaining({ googleSubject: 'google-subject', memberType: MemberType.USER, memberAuthType: MemberAuthType.GOOGLE }));
  expect(createMember.mock.calls[0][0]).not.toHaveProperty('memberPhone');
  expect(createMember.mock.calls[0][0]).not.toHaveProperty('memberPassword');
  expect(memberModel.findOne).toHaveBeenCalledWith({ googleSubject: 'google-subject' });
 });
 it.each([MemberStatus.BLOCK, MemberStatus.DELETE])('does not authenticate %s accounts', async status => {
  member!.memberStatus = status;
  await callback();
  expect(ticketModel.create).not.toHaveBeenCalled();
 });
 it('sanitizes provider failure and retains locale', async () => {
  exchange.mockRejectedValue(new Error('private-token secret-sentinel-never-exposed'));
  const { response } = await callback({ locale: 'ru' });
  expect(response.redirect).toHaveBeenCalledWith(303, origin + '/ru/account/join?google=error');
 });
 it('requires a matching browser binding and origin without consuming a legitimate ticket', async () => {
  const { code, binding } = await handoff();
  await expect(service.complete(code, boundReq('x'.repeat(43)), res())).rejects.toThrow();
  await expect(service.complete(code, boundReq(binding, 'https://evil.test'), res())).rejects.toThrow();
  expect(tickets).toHaveLength(1);
  expect(startSession).not.toHaveBeenCalled();
 });
 it('atomically consumes the ticket once, reuses sessions and excludes Google subject from JWT', async () => {
  const { code, binding } = await handoff();
  const request = boundReq(binding);
  const response = res();
  const result = await service.complete(code, request, response);
  expect(result.returnTo).toBe('/cs');
  expect(startSession).toHaveBeenCalledWith(member, request, response);
  const claims = await auth.verifyToken(result.accessToken);
  expect(claims).not.toHaveProperty('googleSubject');
  expect(claims.memberType).toBe(MemberType.USER);
  await expect(service.complete(code, request, res())).rejects.toThrow();
  expect(startSession).toHaveBeenCalledTimes(1);
 });
 it('denies expired tickets and members blocked before completion', async () => {
  const { code, binding } = await handoff();
  tickets[0].expiresAt = new Date(0);
  await expect(service.complete(code, boundReq(binding), res())).rejects.toThrow();
  tickets[0].expiresAt = new Date(Date.now() + 60000);
  member!.memberStatus = MemberStatus.BLOCK;
  await expect(service.complete(code, boundReq(binding), res())).rejects.toThrow();
  expect(startSession).not.toHaveBeenCalled();
 });
 it('rejects forged Google auth type through public password signup', async () => {
  const service = new MemberService(memberModel as never, {} as never, auth, {} as never, {} as never);
  await expect(service.signup({ memberNick: 'forged', memberPhone: '01000000000', memberPassword: 'fixture', memberAuthType: MemberAuthType.GOOGLE })).rejects.toThrow();
  expect(createMember).not.toHaveBeenCalled();
 });
 it('handles concurrent first sign-in without creating duplicate Google accounts', async () => {
  memberModel.findOne.mockImplementationOnce(() => ({ exec: async () => null }));
  createMember.mockRejectedValueOnce({ code: 11000 });
  await callback();
  expect(createMember).toHaveBeenCalledTimes(1);
  expect(ticketModel.create).toHaveBeenCalledTimes(1);
 });
 it('keeps phone/password required for regular signup and optional only for Google members', async () => {
  const model = new Mongoose().model('GoogleMemberSchemaFixture', MemberSchema);
  await expect(new model({ memberNick: 'normal' }).validate()).rejects.toThrow();
  await expect(new model({ memberNick: 'google', memberAuthType: MemberAuthType.GOOGLE, googleSubject: 'subject' }).validate()).resolves.toBeUndefined();
  const indexes = MemberSchema.indexes();
  expect(indexes).toContainEqual(expect.arrayContaining([{ googleSubject: 1 }, expect.objectContaining({ unique: true, sparse: true })]));
 });
});
