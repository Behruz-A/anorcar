import 'reflect-metadata';
import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule, Query, Resolver } from '@nestjs/graphql';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model, Types } from 'mongoose';
import request from 'supertest';
import type { Request } from 'express';
import { Member } from '../../libs/dto/member/member';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { FirebaseConversationRecord } from '../../libs/dto/chat/firebase-conversation';
import { LoggingInterceptor } from '../../libs/interceptor/Logging.intercepter';
import { AuthService } from '../auth/auth.service';
import { FirebaseService } from '../firebase/firebase.service';
import { ChatService } from './chat.service';
import { ChatResolver } from './chat.resolver';

// Jest 29 cannot load jwks-rsa's ESM jose dependency. These tests use ANORCAR
// JWT verification, never Firebase ID-token verification or remote JWKS fetching.
jest.mock('jwks-rsa', () => jest.fn());

const customerId = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const agentId = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const outsiderId = 'cccccccccccccccccccccccc';
const conversationId = `${customerId}_${agentId}`;
const objectId = (id: string) => new Types.ObjectId(id);

function storage() {
	const members = new Map<string, { memberType: MemberType; memberStatus: MemberStatus }>([
		[customerId, { memberType: MemberType.USER, memberStatus: MemberStatus.ACTIVE }],
		[agentId, { memberType: MemberType.AGENT, memberStatus: MemberStatus.ACTIVE }],
		[outsiderId, { memberType: MemberType.USER, memberStatus: MemberStatus.ACTIVE }],
	]);
	const conversations = new Map<string, FirebaseConversationRecord>();
	const update = jest.fn(async (_updates: Record<string, unknown>) => undefined);
	const ref = jest.fn((path = '') => ({
		transaction: async (callback: (value: FirebaseConversationRecord | null) => FirebaseConversationRecord) => {
			const value = callback(conversations.get(path) ?? null);
			conversations.set(path, value);
			return { committed: true, snapshot: { val: () => value } };
		},
		get: async () => ({ val: () => conversations.get(path) ?? null }),
		update,
	}));
	const firebase = { createChatToken: jest.fn(async (_uid: string) => 'private-firebase-token'), database: { ref } };
	const model = {
		findOne: jest.fn((filter: { _id: Types.ObjectId; memberStatus: MemberStatus }) => ({
			exec: async () => {
				const member = members.get(filter._id.toString());
				return member?.memberStatus === filter.memberStatus ? member : null;
			},
		})),
	};
	const chat = new ChatService(model as unknown as Model<Member>, firebase as unknown as FirebaseService);
	return { chat, members, conversations, firebase, model, update, ref };
}

describe('Trusted Firebase chat operations', () => {
	it('uses the authenticated Mongo ID as UID and checks current member state', async () => {
		const { chat, firebase, members } = storage();
		await expect(chat.createFirebaseChatToken(objectId(customerId))).resolves.toBe('private-firebase-token');
		expect(firebase.createChatToken).toHaveBeenCalledWith(customerId);
		members.get(customerId)!.memberStatus = MemberStatus.BLOCK;
		await expect(chat.createFirebaseChatToken(objectId(customerId))).rejects.toThrow('active customer or agent');
		expect(firebase.createChatToken).toHaveBeenCalledTimes(1);
	});
	it.each([MemberStatus.BLOCK, MemberStatus.DELETE])('rejects %s agents', async (status) => {
		const { chat, members, ref } = storage();
		members.get(agentId)!.memberStatus = status;
		await expect(chat.createConversation(objectId(customerId), agentId)).rejects.toThrow();
		expect(ref).not.toHaveBeenCalled();
	});
	it('rejects missing members, admin users, agent initiators, self chat and non-agent targets', async () => {
		const { chat, members, ref } = storage();
		await expect(chat.createFirebaseChatToken(objectId('dddddddddddddddddddddddd'))).rejects.toThrow();
		await expect(chat.createConversation(objectId(customerId), outsiderId)).rejects.toThrow('active agent');
		await expect(chat.createConversation(objectId(agentId), customerId)).rejects.toThrow('Only customers');
		await expect(chat.createConversation(objectId(customerId), customerId)).rejects.toThrow('Only customers');
		members.get(customerId)!.memberType = MemberType.ADMIN;
		await expect(chat.createFirebaseChatToken(objectId(customerId))).rejects.toThrow();
		expect(ref).not.toHaveBeenCalled();
	});
	it('creates one stable conversation and both private indexes without resetting metadata', async () => {
		const { chat, update, conversations } = storage();
		const first = await chat.createConversation(objectId(customerId), agentId);
		const second = await chat.createConversation(objectId(customerId), agentId.toUpperCase());
		expect(first).toEqual(second);
		expect(conversations.size).toBe(1);
		expect(conversations.get(`conversations/${conversationId}`)?.participants).toEqual({
			[customerId]: true,
			[agentId]: true,
		});
		expect(update).toHaveBeenCalledWith({
			[`userConversations/${customerId}/${conversationId}`]: { otherMemberId: agentId, createdAt: first.createdAt },
			[`userConversations/${agentId}/${conversationId}`]: { otherMemberId: customerId, createdAt: first.createdAt },
		});
	});
	it('repairs indexes on retry after a partial storage failure', async () => {
		const { chat, update, conversations } = storage();
		update.mockRejectedValueOnce(new Error('private provider details'));
		await expect(chat.createConversation(objectId(customerId), agentId)).rejects.toThrow('temporarily unavailable');
		const createdAt = conversations.get(`conversations/${conversationId}`)!.createdAt;
		expect((await chat.createConversation(objectId(customerId), agentId)).createdAt).toBe(createdAt);
	});
	it('authorizes both participants and denies outsiders, missing conversations and changed roles', async () => {
		const { chat, members } = storage();
		await chat.createConversation(objectId(customerId), agentId);
		await expect(chat.authorizeConversation(objectId(customerId), conversationId)).resolves.toHaveProperty(
			'customerId',
			customerId,
		);
		await expect(chat.authorizeConversation(objectId(agentId), conversationId)).resolves.toHaveProperty(
			'agentId',
			agentId,
		);
		await expect(chat.authorizeConversation(objectId(outsiderId), conversationId)).rejects.toThrow('access denied');
		await expect(chat.authorizeConversation(objectId(customerId), `${customerId}_${outsiderId}`)).rejects.toThrow(
			'access denied',
		);
		members.get(agentId)!.memberType = MemberType.USER;
		await expect(chat.authorizeConversation(objectId(agentId), conversationId)).rejects.toThrow('access denied');
	});
	it('rejects path injection and corrupt participant metadata', async () => {
		const { chat, conversations, ref } = storage();
		await expect(chat.createConversation(objectId(customerId), '../agent')).rejects.toThrow('Invalid chat member ID');
		await expect(chat.authorizeConversation(objectId(customerId), '../messages')).rejects.toThrow(
			'Invalid conversation ID',
		);
		expect(ref).not.toHaveBeenCalled();
		await chat.createConversation(objectId(customerId), agentId);
		conversations.get(`conversations/${conversationId}`)!.participants[outsiderId] = true;
		await expect(chat.authorizeConversation(objectId(outsiderId), conversationId)).rejects.toThrow();
		await expect(chat.createConversation(objectId(customerId), agentId)).rejects.toThrow('temporarily unavailable');
	});
	it('does not return upstream credential/token errors', async () => {
		const { chat, firebase } = storage();
		firebase.createChatToken.mockRejectedValue(new Error('PRIVATE KEY fixture'));
		await expect(chat.createFirebaseChatToken(objectId(customerId))).rejects.toThrow(
			'Live Chat is temporarily unavailable',
		);
	});
});

@Resolver()
class TestQuery {
	@Query(() => Boolean)
	chatTestAck() {
		return true;
	}
}

describe('Firebase GraphQL with existing JWT guard', () => {
	let app: INestApplication;
	let state: ReturnType<typeof storage>;
	const jwt = new JwtService({ secret: 'chat-test-only-secret' });
	const token = jwt.sign({ _id: customerId, memberType: MemberType.ADMIN, memberNick: 'fixture' });
	const send = (query: string, bearer?: string) => {
		const req = request(app.getHttpServer()).post('/graphql').send({ query });
		return bearer ? req.set('Authorization', `Bearer ${bearer}`) : req;
	};
	beforeAll(async () => {
		state = storage();
		const module = await Test.createTestingModule({
			imports: [
				GraphQLModule.forRoot<ApolloDriverConfig>({
					driver: ApolloDriver,
					autoSchemaFile: true,
					context: ({ req }: { req: Request }) => ({ req }),
				}),
			],
			providers: [
				ChatResolver,
				ChatService,
				TestQuery,
				AuthService,
				{ provide: JwtService, useValue: jwt },
				{ provide: getModelToken('Member'), useValue: state.model },
				{ provide: FirebaseService, useValue: state.firebase },
			],
		}).compile();
		app = module.createNestApplication();
		app.useGlobalPipes(new ValidationPipe());
		app.useGlobalInterceptors(new LoggingInterceptor());
		await app.init();
	});
	afterAll(async () => {
		await app.close();
	});
	afterEach(() => jest.restoreAllMocks());
	it('rejects missing, invalid and expired JWTs on all operations', async () => {
		for (const query of [
			'mutation{createFirebaseChatToken}',
			`mutation{createFirebaseConversation(input:{agentId:"${agentId}"}){conversationId}}`,
			`query{getFirebaseConversation(conversationId:"${conversationId}"){conversationId}}`,
		]) {
			for (const bearer of [undefined, 'invalid', jwt.sign({ _id: customerId }, { expiresIn: -1 })]) {
				expect((await send(query, bearer)).body.errors).toBeTruthy();
			}
		}
		expect(state.firebase.createChatToken).not.toHaveBeenCalled();
		expect(state.ref).not.toHaveBeenCalled();
	});
	it('mints a token bound to JWT ID, ignoring the stale JWT role', async () => {
		expect((await send('mutation{createFirebaseChatToken}', token)).body.data.createFirebaseChatToken).toBe(
			'private-firebase-token',
		);
		expect(state.firebase.createChatToken).toHaveBeenCalledWith(customerId);
	});
	it('does not accept client UID or participants and validates agent IDs', async () => {
		for (const query of [
			'mutation{createFirebaseChatToken(uid:"spoof")}',
			`mutation{createFirebaseConversation(input:{agentId:"${agentId}",customerId:"${outsiderId}"}){conversationId}}`,
			'mutation{createFirebaseConversation(input:{agentId:"../bad"}){conversationId}}',
		]) {
			expect((await send(query, token)).body.errors).toBeTruthy();
		}
	});
	it('creates and authorizes the conversation through GraphQL', async () => {
		const created = await send(
			`mutation{createFirebaseConversation(input:{agentId:"${agentId}"}){conversationId customerId agentId createdAt}}`,
			token,
		);
		expect(created.body.errors).toBeUndefined();
		expect(created.body.data.createFirebaseConversation.conversationId).toBe(conversationId);
		const read = await send(
			`query{getFirebaseConversation(conversationId:"${conversationId}"){customerId agentId}}`,
			token,
		);
		expect(read.body.data.getFirebaseConversation.customerId).toBe(customerId);
	});
	it('never logs custom tokens or mixed-operation request details', async () => {
		const log = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
		await send('mutation{secretAlias:createFirebaseChatToken}', token);
		await send('query{getFirebaseConversation(conversationId:"private-sentinel") {customerId} chatTestAck}', token);
		expect(JSON.stringify(log.mock.calls)).not.toContain('private-firebase-token');
		expect(JSON.stringify(log.mock.calls)).not.toContain('private-sentinel');
	});
});
