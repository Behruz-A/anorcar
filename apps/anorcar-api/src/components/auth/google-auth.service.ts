import { BadRequestException, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';
import type { Request, Response, CookieOptions } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { Model } from 'mongoose';
import { clientOrigins, refreshCookieOptions } from '../../libs/config/auth.config';
import { GoogleLoginInput, GoogleLoginResult, GoogleLoginTicket } from '../../libs/dto/auth/google-auth';
import { Member } from '../../libs/dto/member/member';
import { MemberAuthType, MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { AuthService } from './auth.service';
import { AuthSessionService } from './auth-session.service';

const FLOW_COOKIE = 'anorcar_google_flow';
const TICKET_COOKIE = 'anorcar_google_ticket';
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const random = () => randomBytes(32).toString('base64url');
const cookie = (req: Request, name: string) => req.headers.cookie?.split(';').map(value => value.trim()).find(value => value.startsWith(name + '='))?.slice(name.length + 1);

interface GoogleFlow {
 state: string;
 nonce: string;
 verifier: string;
 origin: string;
 locale: string;
 returnTo: string;
}

@Injectable()
export class GoogleAuthService {
 constructor(
  @InjectModel('Member') private readonly memberModel: Model<Member>,
  @InjectModel('GoogleLoginTicket') private readonly ticketModel: Model<GoogleLoginTicket>,
  private readonly jwt: JwtService,
  private readonly auth: AuthService,
  private readonly sessions: AuthSessionService,
 ) {}

 private config() {
  const { GOOGLE_CLIENT_ID: clientId, GOOGLE_CLIENT_SECRET: clientSecret, GOOGLE_REDIRECT_URI: redirectUri } = process.env;
  if (!clientId || !clientSecret || !redirectUri || !process.env.SECRET_TOKEN) throw new ServiceUnavailableException('Google sign-in is unavailable.');
  const redirect = new URL(redirectUri);
  if (redirect.pathname !== '/auth/google/callback' || redirect.search || redirect.hash || redirect.username || redirect.password ||
   (redirect.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production' && redirect.protocol === 'http:' && redirect.hostname === 'localhost')))
   throw new ServiceUnavailableException('Google sign-in is unavailable.');
  const flowSecret = createHmac('sha256', process.env.SECRET_TOKEN).update('anorcar-google-oauth-state').digest('hex');
  return { flowSecret, client: new OAuth2Client({ clientId, clientSecret, redirectUri, transporterOptions: { timeout: 10000, retry: false } }), clientId, secure: redirect.protocol === 'https:' };
 }

 private flowOptions(secure: boolean): CookieOptions {
  return { httpOnly: true, secure, sameSite: 'lax', path: '/auth/google' };
 }

 public async start(input: GoogleLoginInput, req: Request, res: Response): Promise<string> {
  this.sessions.assertBrowserRequest(req);
  if (!clientOrigins().includes(input.origin) || (req.headers.origin && req.headers.origin !== input.origin))
   throw new BadRequestException('Invalid sign-in origin.');
  const { client, secure, flowSecret } = this.config();
  const locale = ['kr', 'ru'].includes(input.locale ?? '') ? input.locale! : 'en';
  const returnTo = input.referrer && /^\/(?!\/)/.test(input.referrer) && input.referrer.length <= 1000 &&
   !/[\\\u0000-\u0020]/.test(input.referrer) && !/^\/(?:en\/|kr\/|ru\/)?account\/(?:join|google-callback)(?:[/?#]|$)/.test(input.referrer)
   ? input.referrer : (locale === 'en' ? '/' : '/' + locale);
  const flow: GoogleFlow = { state: random(), nonce: random(), verifier: random(), origin: input.origin, locale, returnTo };
  const signed = await this.jwt.signAsync(flow, { secret: flowSecret, expiresIn: 600, audience: 'google-login', issuer: 'anorcar' });
  res.cookie(FLOW_COOKIE, signed, { ...this.flowOptions(secure), maxAge: 600000 });
  return client.generateAuthUrl({
   scope: ['openid', 'email', 'profile'], state: flow.state, nonce: flow.nonce,
   code_challenge: createHash('sha256').update(flow.verifier).digest('base64url'),
   code_challenge_method: 'S256' as import('google-auth-library').CodeChallengeMethod,
   prompt: 'select_account',
  });
 }

 public async callback(req: Request, res: Response): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
  let flow: GoogleFlow | undefined;
  try {
   const { client, clientId, secure, flowSecret } = this.config();
   const signed = cookie(req, FLOW_COOKIE);
   res.clearCookie(FLOW_COOKIE, this.flowOptions(secure));
   if (!signed) throw new UnauthorizedException();
   flow = await this.jwt.verifyAsync<GoogleFlow>(signed, { secret: flowSecret, algorithms: ['HS256'], audience: 'google-login', issuer: 'anorcar', maxAge: 600 });
   const state = req.query.state;
   if (!clientOrigins().includes(flow.origin) || typeof state !== 'string' || state.length !== flow.state.length ||
    !timingSafeEqual(Buffer.from(state), Buffer.from(flow.state))) throw new UnauthorizedException();
   if (req.query.error || typeof req.query.code !== 'string' || req.query.code.length > 4096) throw new UnauthorizedException();
   const { tokens } = await client.getToken({ code: req.query.code, codeVerifier: flow.verifier });
   if (!tokens.id_token) throw new UnauthorizedException();
   const verified = await client.verifyIdToken({ idToken: tokens.id_token, audience: clientId });
   const profile = verified.getPayload();
   if (!profile?.sub || profile.sub.length > 255 || !profile.email_verified ||
    (profile as typeof profile & { nonce?: string }).nonce !== flow.nonce) throw new UnauthorizedException();
   const member = await this.findMember(profile.sub, profile.name);
   if (member.memberStatus !== MemberStatus.ACTIVE) throw new UnauthorizedException();
   const code = random();
   const binding = random();
   await this.ticketModel.create({ tokenHash: hash(code), browserHash: hash(binding), memberId: member._id, origin: flow.origin,
    returnTo: flow.returnTo, expiresAt: new Date(Date.now() + 60000) });
   res.cookie(TICKET_COOKIE, binding, { ...refreshCookieOptions(), maxAge: 60000 });
   const prefix = flow.locale === 'en' ? '' : '/' + flow.locale;
   res.redirect(303, flow.origin + prefix + '/account/google-callback#code=' + code);
  } catch {
   // Never expose Google tokens, codes, configuration or provider errors.
   const origin = flow && clientOrigins().includes(flow.origin) ? flow.origin : clientOrigins()[0];
   const prefix = flow && ['kr', 'ru'].includes(flow.locale) ? '/' + flow.locale : '';
   res.redirect(303, origin + prefix + '/account/join?google=error');
  }
 }

 private async findMember(subject: string, name?: string): Promise<Member> {
  const existing = await this.memberModel.findOne({ googleSubject: subject }).exec();
  if (existing) return existing;
  for (let attempt = 0; attempt < 3; attempt++) {
   try {
    return await this.memberModel.create({ googleSubject: subject, memberAuthType: MemberAuthType.GOOGLE,
     memberType: MemberType.USER, memberNick: 'g' + randomBytes(5).toString('hex'), memberFullName: name?.slice(0, 100) });
   } catch (error) {
    if ((error as { code?: number }).code !== 11000) throw error;
    const raced = await this.memberModel.findOne({ googleSubject: subject }).exec();
    if (raced) return raced;
   }
  }
  throw new ServiceUnavailableException('Google sign-in is unavailable.');
 }

 public async complete(code: string, req: Request, res: Response): Promise<GoogleLoginResult> {
  this.sessions.assertBrowserRequest(req);
  res.setHeader('Cache-Control', 'no-store');
  const binding = cookie(req, TICKET_COOKIE);
  if (!/^[\w-]{43}$/.test(code) || !binding || !/^[\w-]{43}$/.test(binding) || !req.headers.origin)
   throw new UnauthorizedException('Google sign-in expired. Please try again.');
  const ticket = await this.ticketModel.findOneAndDelete({ tokenHash: hash(code), browserHash: hash(binding),
   origin: req.headers.origin, expiresAt: { $gt: new Date() } }).exec();
  if (!ticket) throw new UnauthorizedException('Google sign-in expired. Please try again.');
  res.clearCookie(TICKET_COOKIE, refreshCookieOptions());
  const member = await this.memberModel.findOne({ _id: ticket.memberId, memberStatus: MemberStatus.ACTIVE }).exec();
  if (!member) throw new UnauthorizedException('Google sign-in is unavailable.');
  await this.sessions.startSession(member, req, res);
  return { accessToken: await this.auth.createToken(member), returnTo: ticket.returnTo };
 }
}
