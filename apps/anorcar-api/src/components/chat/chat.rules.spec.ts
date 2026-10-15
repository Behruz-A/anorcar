import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Explicit opt-in. Never sends requests to a production Firebase instance.
const host = process.env.FIREBASE_DATABASE_EMULATOR_HOST;
const rulesDescribe = host ? describe : describe.skip;
const customer = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const agent = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const outsider = 'cccccccccccccccccccccccc';
const conversation = `${customer}_${agent}`;

rulesDescribe('Realtime Database Rules (local emulator only)', () => {
	const namespace = 'demo-anorcar-chat';
	const token = (uid: string, claims: Record<string, unknown> = {}) => {
		const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
		const now = Math.floor(Date.now() / 1000);
		return `${encode({ alg: 'none', typ: 'JWT' })}.${encode({
			iss: `https://securetoken.google.com/${namespace}`,
			aud: namespace,
			sub: uid,
			user_id: uid,
			iat: now,
			exp: now + 3600,
			auth_time: now,
			firebase: { sign_in_provider: 'custom' },
			anorcarChat: true,
			chatExpiresAt: Date.now() + 900000,
			...claims,
		})}.`;
	};
	const call = async (path: string, method = 'GET', body?: unknown, auth?: string) => {
		if (!host || !/^(127\.0\.0\.1|localhost):\d+$/.test(host)) throw new Error('Use a loopback database emulator');
		const url = new URL(`http://${host}/${path}.json`);
		url.searchParams.set('ns', namespace);
		if (auth && auth !== 'owner') url.searchParams.set('auth', auth);
		return fetch(url, {
			method,
			headers: { 'Content-Type': 'application/json', ...(auth === 'owner' ? { Authorization: 'Bearer owner' } : {}) },
			...(body === undefined ? {} : { body: JSON.stringify(body) }),
		});
	};
	const message = (senderId = customer) => ({ senderId, text: 'Hello\nAgent', createdAt: { '.sv': 'timestamp' } });
	beforeAll(async () => {
		const rules = JSON.parse(readFileSync(resolve('firebase/database.rules.json'), 'utf8'));
		const response = await call('.settings/rules', 'PUT', rules, 'owner');
		if (!response.ok) throw new Error(`Rules compilation failed (${response.status}): ${await response.text()}`);
	});
	beforeEach(async () => {
		expect(
			(
				await call(
					'',
					'PUT',
					{
						conversations: {
							[conversation]: {
								customerId: customer,
								agentId: agent,
								createdAt: 1,
								participants: { [customer]: true, [agent]: true },
							},
						},
						userConversations: {
							[customer]: { [conversation]: { otherMemberId: agent, createdAt: 1 } },
							[agent]: { [conversation]: { otherMemberId: customer, createdAt: 1 } },
						},
					},
					'owner',
				)
			).status,
		).toBe(200);
	});
	it.each([customer, agent])('permits participant %s to read and append', async (uid) => {
		for (const path of [`conversations/${conversation}`, `messages/${conversation}`, `userConversations/${uid}`])
			expect((await call(path, 'GET', undefined, token(uid))).status).toBe(200);
		expect((await call(`messages/${conversation}/m1`, 'PUT', message(uid), token(uid))).status).toBe(200);
		const stored = await (await call(`messages/${conversation}/m1`, 'GET', undefined, token(uid))).json();
		expect(typeof stored.createdAt).toBe('number');
		expect(stored.createdAt).toBeGreaterThan(Date.now() - 10000);
		expect(stored.createdAt).toBeLessThanOrEqual(Date.now());
	});
	it.each([undefined, 'outsider', 'expired', 'no-claim'])('denies unauthorized session %s', async (kind) => {
		const auth =
			kind === 'outsider'
				? token(outsider)
				: kind === 'expired'
					? token(customer, { chatExpiresAt: 1 })
					: kind === 'no-claim'
						? token(customer, { anorcarChat: false })
						: undefined;
		for (const path of [`conversations/${conversation}`, `messages/${conversation}`, `userConversations/${customer}`])
			expect((await call(path, 'GET', undefined, auth)).status).toBe(401);
		expect((await call(`messages/${conversation}/m1`, 'PUT', message(), auth)).status).toBe(401);
	});
	it('denies collection reads, another member index, metadata writes and self-created participants', async () => {
		for (const path of ['', 'conversations', 'messages', 'userConversations', `userConversations/${agent}`])
			expect((await call(path, 'GET', undefined, token(customer))).status).toBe(401);
		for (const path of [
			`conversations/${conversation}`,
			`conversations/${conversation}/participants/${outsider}`,
			`conversations/fake/participants/${customer}`,
			`userConversations/${customer}/${conversation}`,
		])
			expect((await call(path, 'PUT', true, token(customer))).status).toBe(401);
	});
	it('rejects sender spoofing, unexpected fields, empty/oversized text and forged timestamps', async () => {
		for (const value of [
			message(agent),
			{ ...message(), role: 'ADMIN' },
			{ ...message(), text: '' },
			{ ...message(), text: ' \n\t ' },
			{ ...message(), text: 'a'.repeat(2001) },
			{ ...message(), createdAt: 1 },
			{ text: 'missing sender', createdAt: { '.sv': 'timestamp' } },
		])
			expect((await call(`messages/${conversation}/m1`, 'PUT', value, token(customer))).status).toBe(401);
	});
	it.each([
		' ',
		'\t',
		'\r',
		'\n',
		'\f',
		'\v',
		'\u00a0',
		'\u1680',
		'\u2000',
		...Array.from({ length: 9 }, (_, index) => String.fromCharCode(0x2001 + index)),
		'\u200a',
		'\u2028',
		'\u2029',
		'\u202f',
		'\u205f',
		'\u3000',
		'\ufeff',
	])('rejects whitespace-only text %j', async (text) => {
		expect((await call(`messages/${conversation}/m1`, 'PUT', { ...message(), text }, token(customer))).status).toBe(
			401,
		);
	});
	it.each(['t', 'r', 'n', 'f', 'v', 'u', 'Hello\nAgent', 'Salom', '안녕하세요', 'a'.repeat(2000)])(
		'accepts nonblank and multiline text case %#',
		async (text) => {
			expect((await call(`messages/${conversation}/m1`, 'PUT', { ...message(), text }, token(customer))).status).toBe(
				200,
			);
		},
	);
	it.each([
		['seconds', Math.floor(Date.now() / 1000) + 900],
		['expiration boundary', Date.now()],
		['missing expiry', undefined],
	])('denies %s grants on reads and writes', async (_name, chatExpiresAt) => {
		const auth = token(customer, { chatExpiresAt });
		for (const path of [`conversations/${conversation}`, `messages/${conversation}`, `userConversations/${customer}`])
			expect((await call(path, 'GET', undefined, auth)).status).toBe(401);
		expect((await call(`messages/${conversation}/m1`, 'PUT', message(), auth)).status).toBe(401);
	});
	it('a new ID-token issue time does not renew an expired chat grant', async () => {
		const now = Math.floor(Date.now() / 1000);
		const auth = token(customer, { iat: now, exp: now + 3600, chatExpiresAt: Date.now() - 1 });
		expect((await call(`messages/${conversation}`, 'GET', undefined, auth)).status).toBe(401);
		expect((await call(`messages/${conversation}/m1`, 'PUT', message(), auth)).status).toBe(401);
	});
	it.each([
		['number text', { ...message(), text: 123 }],
		['object text', { ...message(), text: { content: 'Hi' } }],
		['number sender', { ...message(), senderId: 123 }],
		['string timestamp', { ...message(), createdAt: 'now' }],
		['future timestamp', { ...message(), createdAt: Date.now() + 86400000 }],
		['missing timestamp', { senderId: customer, text: 'Hi' }],
		['null timestamp', { ...message(), createdAt: null }],
	])('rejects invalid message field: %s', async (_name, value) => {
		expect((await call(`messages/${conversation}/m1`, 'PUT', value, token(customer))).status).toBe(401);
	});
	it('denies metadata and index replacement, deletion and leaf edits', async () => {
		for (const path of [
			`conversations/${conversation}/participants`,
			`conversations/${conversation}/participants/${customer}`,
			`conversations/${conversation}/customerId`,
			`userConversations/${customer}`,
			`userConversations/${customer}/${conversation}/otherMemberId`,
		]) {
			expect((await call(path, 'PUT', outsider, token(customer))).status).toBe(401);
			expect((await call(path, 'DELETE', undefined, token(customer))).status).toBe(401);
		}
	});
	it('parent PUT/DELETE cannot replace or remove messages or metadata', async () => {
		expect((await call(`messages/${conversation}/m1`, 'PUT', message(), token(customer))).status).toBe(200);
		for (const [path, body] of [
			[`messages/${conversation}`, { m1: { ...message(), text: 'replaced' } }],
			['messages', { [conversation]: { m1: message() } }],
			['conversations', { [conversation]: { participants: { [outsider]: true } } }],
			['userConversations', { [customer]: {} }],
			['', { messages: { [conversation]: { m1: message() } } }],
		] as const) {
			expect((await call(path, 'PUT', body, token(customer))).status).toBe(401);
			expect((await call(path, 'DELETE', undefined, token(customer))).status).toBe(401);
		}
	});
	it('root PATCH authorizes each path and cannot overwrite, delete, spoof or edit membership', async () => {
		const messagePath = `messages/${conversation}`;
		expect((await call('', 'PATCH', { [`${messagePath}/m1`]: message() }, token(customer))).status).toBe(200);
		for (const updates of [
			{ [`${messagePath}/m1`]: message() },
			{ [`${messagePath}/m1`]: null },
			{ [`${messagePath}/m1/text`]: 'edited' },
			{ [`${messagePath}/m2`]: message(agent) },
			{ [`${messagePath}/m2`]: message(), [`conversations/${conversation}/participants/${outsider}`]: true },
			{ [`${messagePath}/m2`]: message(), [`userConversations/${customer}/${conversation}`]: null },
		])
			expect((await call('', 'PATCH', updates, token(customer))).status).toBe(401);
		// Failed fan-out must not leave the valid part of a mixed write behind.
		expect(await (await call(`${messagePath}/m2`, 'GET', undefined, 'owner')).json()).toBeNull();
	});
	it('rejects edits, deletes, child rewrites, unauthorized conversations and atomic escalation', async () => {
		expect((await call(`messages/${conversation}/m1`, 'PUT', message(), token(customer))).status).toBe(200);
		expect((await call(`messages/${conversation}/m1`, 'PUT', message(), token(customer))).status).toBe(401);
		expect((await call(`messages/${conversation}/m1`, 'DELETE', undefined, token(customer))).status).toBe(401);
		expect((await call(`messages/${conversation}/m1/text`, 'PUT', 'edited', token(customer))).status).toBe(401);
		expect((await call('messages/nonexistent/m1', 'PUT', message(), token(customer))).status).toBe(401);
		expect(
			(
				await call(
					'',
					'PATCH',
					{
						[`conversations/${conversation}/participants/${outsider}`]: true,
						[`messages/${conversation}/m2`]: message(outsider),
					},
					token(outsider),
				)
			).status,
		).toBe(401);
	});
});
