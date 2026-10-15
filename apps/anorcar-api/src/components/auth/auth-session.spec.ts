import 'reflect-metadata';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Mongoose, Types } from 'mongoose';
import request from 'supertest';
import type { Request, Response } from 'express';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { AuthSessionService } from './auth-session.service';
import { MemberResolver } from '../member/member.resolver';
import { MemberService } from '../member/member.service';
import { Member } from '../../libs/dto/member/member';
import { RefreshSession } from '../../libs/dto/auth/auth';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { REFRESH_TOKEN_MILLISECONDS, refreshCookieOptions } from '../../libs/config/auth.config';
import RefreshSessionSchema from '../../schemas/RefreshSession.model';
import { SocketGateway } from '../../socket/socket.gateway';
import type { Server, WebSocket } from 'ws';

const refresh = 'mutation{refreshAccessToken{accessToken}}';
const logout = 'mutation{logout}';
const login = 'mutation{login(input:{memberNick:"testbuyer",memberPassword:"secret1"}){_id accessToken}}';
const signup =
	'mutation{signup(input:{memberNick:"testbuyer",memberPassword:"secret1",memberPhone:"01000000000",memberType:AGENT}){_id accessToken}}';
const cookieOf = (response: { headers: Record<string, unknown> }): string =>
	(response.headers['set-cookie'] as string[])[0].split(';')[0];

describe('Auth access/refresh GraphQL (isolated storage)', () => {
	let app: INestApplication;
	const jwt = new JwtService({ secret: 'auth-session-test-only-secret' });
	const auth = new AuthService(jwt);
	const rows: RefreshSession[] = [];
	let member = {
		_id: new Types.ObjectId(),
		memberType: MemberType.USER,
		memberStatus: MemberStatus.ACTIVE,
		memberNick: 'testbuyer',
		memberPassword: 'not-for-token',
		accessToken: 'old-token',
	} as unknown as Member;
	const documentModel = new Mongoose().model<RefreshSession>('SessionTest', RefreshSessionSchema);
	const matches = (row: RefreshSession, filter: Record<string, unknown>): boolean =>
		Object.entries(filter).every(([key, value]) => {
			if (key === '$or') return (value as Record<string, unknown>[]).some((condition) => matches(row, condition));
			const actual = row[key as keyof RefreshSession];
			if (value && typeof value === 'object' && '$gt' in value)
				return (actual as Date).getTime() > (value.$gt as Date).getTime();
			if (Array.isArray(actual)) return actual.includes(String(value));
			return value === null ? actual === null : String(actual) === String(value);
		});
	const sessionModel = {
		create: jest.fn(async (input: Partial<RefreshSession>) => {
			const doc = new documentModel(input);
			await doc.validate();
			const row = doc.toObject() as RefreshSession;
			rows.push(row);
			return row;
		}),
		findOne: jest.fn((filter: Record<string, unknown>) => ({
			exec: async () => rows.find((row) => matches(row, filter)) ?? null,
		})),
		findOneAndUpdate: jest.fn(
			(
				filter: Record<string, unknown>,
				update: { $set: Partial<RefreshSession>; $push?: { usedTokenHashes: string } },
			) => ({
				exec: async () => {
					const row = rows.find((row) => matches(row, filter));
					if (!row) return null;
					Object.assign(row, update.$set);
					if (update.$push) row.usedTokenHashes.push(update.$push.usedTokenHashes);
					return row;
				},
			}),
		),
	};
	const memberModel = {
		findOne: jest.fn(() => ({ exec: async () => (member.memberStatus === MemberStatus.ACTIVE ? member : null) })),
	};
	const memberService = {
		login: async () => ({ ...member, accessToken: await auth.createToken(member) }),
		signup: async () => ({ ...member, accessToken: await auth.createToken(member) }),
	};
	const call = (query: string, cookie?: string, origin = 'http://localhost:3000', marker = true) => {
		const operation = request(app.getHttpServer()).post('/graphql').set('Origin', origin).send({ query });
		if (marker) operation.set('X-Anorcar-Client', 'web');
		if (cookie) operation.set('Cookie', cookie);
		return operation;
	};
	beforeAll(async () => {
		const module = await Test.createTestingModule({
			imports: [
				GraphQLModule.forRoot<ApolloDriverConfig>({
					driver: ApolloDriver,
					autoSchemaFile: true,
					context: ({ req, res }: { req: Request; res: Response }) => ({ req, res }),
				}),
			],
			providers: [
				AuthResolver,
				MemberResolver,
				AuthSessionService,
				{ provide: AuthService, useValue: auth },
				{ provide: MemberService, useValue: memberService },
				{ provide: getModelToken('RefreshSession'), useValue: sessionModel },
				{ provide: getModelToken('Member'), useValue: memberModel },
			],
		}).compile();
		app = module.createNestApplication();
		app.useGlobalPipes(new ValidationPipe());
		await app.init();
	});
	beforeEach(() => {
		rows.length = 0;
		member.memberStatus = MemberStatus.ACTIVE;
		member.memberType = MemberType.USER;
	});
	afterAll(async () => {
		await app?.close();
	});

	it.each([login, signup])('issues a 15 minute JWT and HttpOnly 30 day cookie after authentication', async (query) => {
		const response = await call(query);
		expect(response.body.errors).toBeUndefined();
		const result = response.body.data[query === login ? 'login' : 'signup'];
		const claims = jwt.decode(result.accessToken);
		expect(claims.exp - claims.iat).toBe(900);
		expect(claims.memberPassword).toBeUndefined();
		expect(claims.accessToken).toBeUndefined();
		expect((response.headers['set-cookie'] as string[])[0]).toMatch(/HttpOnly/);
		expect((response.headers['set-cookie'] as string[])[0]).toMatch(/Path=\/graphql/);
		expect((response.headers['set-cookie'] as string[])[0]).toMatch(/SameSite=Lax/);
		expect(rows[0].expiresAt.getTime() - Date.now()).toBeGreaterThan(REFRESH_TOKEN_MILLISECONDS - 1000);
		expect(JSON.stringify(rows)).not.toContain(cookieOf(response).split('=')[1]);
	});
	it('rotates once, retains absolute expiry, uses current member role and revokes replayed sessions', async () => {
		const authenticated = await call(login);
		const original = cookieOf(authenticated);
		const expiresAt = rows[0].expiresAt.getTime();
		member.memberType = MemberType.AGENT;
		const renewed = await call(refresh, original);
		expect(renewed.body.errors).toBeUndefined();
		expect(jwt.decode(renewed.body.data.refreshAccessToken.accessToken).memberType).toBe('AGENT');
		const next = cookieOf(renewed);
		expect(next).not.toBe(original);
		expect(rows[0].expiresAt.getTime()).toBe(expiresAt);
		expect(rows[0].usedTokenHashes).toHaveLength(1);
		expect((await call(refresh, original)).body.errors).toBeDefined();
		expect(rows[0].revokedAt).not.toBeNull();
		expect((await call(refresh, next)).body.errors).toBeDefined();
	});
	it('requires cookie, trusted origin and client header; guessed secrets cannot revoke a valid session', async () => {
		const authenticated = await call(login),
			cookie = cookieOf(authenticated);
		for (const query of [login, signup, refresh, logout]) {
			expect((await call(query, cookie, 'https://untrusted.example')).body.errors).toBeDefined();
			expect((await call(query, cookie, 'http://localhost:3000', false)).body.errors).toBeDefined();
		}
		expect((await call(refresh)).body.errors).toBeDefined();
		const guessed = cookie.split('.')[0] + '.' + 'x'.repeat(43);
		expect((await call(refresh, guessed)).body.errors).toBeDefined();
		expect(rows[0].revokedAt).toBeNull();
		expect((await call(refresh, cookie)).body.errors).toBeUndefined();
	});
	it.each([MemberStatus.BLOCK, MemberStatus.DELETE])('rejects %s members and expired sessions', async (status) => {
		const authenticated = await call(login);
		member.memberStatus = status;
		expect((await call(refresh, cookieOf(authenticated))).body.errors).toBeDefined();
		expect(rows[0].revokedAt).not.toBeNull();
		member.memberStatus = MemberStatus.ACTIVE;
		const active = await call(login);
		rows[1].expiresAt = new Date(Date.now() - 1);
		expect((await call(refresh, cookieOf(active))).body.errors).toBeDefined();
	});
	it('revokes on logout and rejects concurrent reuse', async () => {
		const authenticated = await call(login),
			cookie = cookieOf(authenticated);
		const results = await Promise.all([call(refresh, cookie), call(refresh, cookie)]);
		expect(results.filter((result) => !result.body.errors)).toHaveLength(1);
		expect(rows[0].revokedAt).not.toBeNull();
		const fresh = await call(login),
			freshCookie = cookieOf(fresh);
		const signedOut = await call(logout, freshCookie);
		expect(signedOut.body.data.logout).toBe(true);
		expect((signedOut.headers['set-cookie'] as string[])[0]).toMatch(/Expires=Thu, 01 Jan 1970/);
		expect((await call(refresh, freshCookie)).body.errors).toBeDefined();
	});
	it('handles storage failure without returning tokens or consuming the current credential', async () => {
		const authenticated = await call(login),
			cookie = cookieOf(authenticated),
			originalHash = rows[0].tokenHash;
		memberModel.findOne.mockImplementationOnce(() => ({
			exec: async () => {
				throw Error('Database unavailable');
			},
		}));
		expect((await call(refresh, cookie)).body.errors).toBeDefined();
		expect(rows[0].tokenHash).toBe(originalHash);
		expect((await call(refresh, cookie)).body.errors).toBeUndefined();
	});
	it('enforces max access age even for legacy 30 day tokens and rejects bad signatures', async () => {
		const legacy = jwt.sign(
			{ _id: member._id.toString(), iat: Math.floor(Date.now() / 1000) - 901 },
			{ expiresIn: '30d' },
		);
		await expect(auth.verifyToken(legacy)).rejects.toThrow('ACCESS_TOKEN_EXPIRED');
		await expect(auth.verifyToken(legacy + 'bad')).rejects.toThrow();
		const original = process.env.NODE_ENV;
		process.env.NODE_ENV = 'production';
		expect(refreshCookieOptions().secure).toBe(true);
		process.env.NODE_ENV = original;
	});
});

it('does not retain authenticated socket identity beyond the access token lifetime', async () => {
	const jwt = new JwtService({ secret: 'socket-test-only-secret' });
	const token = jwt.sign(
		{ _id: new Types.ObjectId().toString(), memberNick: 'Socket QA', memberType: MemberType.USER },
		{ expiresIn: 900 },
	);
	const gateway = new SocketGateway(new AuthService(jwt));
	const send = jest.fn();
	const client = { readyState: 1, send } as unknown as WebSocket;
	gateway.server = { clients: new Set([client]) } as unknown as Server;
	await gateway.handleConnection(client, { url: '/?token=' + token });
	try {
		jest.useFakeTimers({ now: Date.now() + 901000 });
		await gateway.handleMessage(client, 'Test message');
		expect(JSON.parse(send.mock.calls.at(-1)?.[0]).list[0].memberData).toBeNull();
	} finally {
		jest.useRealTimers();
	}
});
