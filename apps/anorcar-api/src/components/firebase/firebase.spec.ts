import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { createPublicKey, generateKeyPairSync, verify } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deleteApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { firebaseConfig } from '../../libs/config/firebase.config';
import { FirebaseModule } from './firebase.module';
import { CHAT_SESSION_MS, FirebaseService } from './firebase.service';

// Keep real Admin initialization/signing classes; no remote Firebase ID-token
// verification is needed and Jest 29 cannot load jwks-rsa's ESM dependency.
jest.mock('jwks-rsa', () => jest.fn());

describe('Firebase startup configuration and singleton DI', () => {
	let directory: string;
	let accountPath: string;
	let account: Record<string, string>;
	const values = () => ({
		FIREBASE_PROJECT_ID: 'anorcar-test',
		FIREBASE_DATABASE_URL: 'https://anorcar-test-default-rtdb.asia-southeast1.firebasedatabase.app',
		FIREBASE_SERVICE_ACCOUNT_PATH: accountPath,
	});
	beforeAll(() => {
		directory = mkdtempSync(join(tmpdir(), 'anorcar-firebase-test-'));
		accountPath = join(directory, 'fixture.json');
		const { privateKey } = generateKeyPairSync('rsa', {
			modulusLength: 2048,
			privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
			publicKeyEncoding: { type: 'spki', format: 'pem' },
		});
		account = {
			type: 'service_account',
			project_id: 'anorcar-test',
			client_email: 'fixture@anorcar-test.iam.gserviceaccount.com',
			private_key: privateKey,
		};
	});
	beforeEach(() => writeFileSync(accountPath, JSON.stringify(account)));
	afterEach(async () => {
		jest.restoreAllMocks();
		await Promise.all(
			getApps()
				.filter((app) => app.name === 'anorcar-chat')
				.map((app) => deleteApp(app)),
		);
	});
	afterAll(() => rmSync(directory, { recursive: true, force: true }));
	it.each(['FIREBASE_PROJECT_ID', 'FIREBASE_DATABASE_URL', 'FIREBASE_SERVICE_ACCOUNT_PATH'])(
		'fails startup without %s',
		(key) => {
			expect(() => firebaseConfig(new ConfigService({ ...values(), [key]: '' }))).toThrow(`Missing ${key}`);
		},
	);
	it.each([
		'http://anorcar-test.firebaseio.com',
		'https://evil.test',
		'https://anorcar-test.firebaseio.com/messages',
		'https://user:password@anorcar-test.firebaseio.com',
		'not a url',
	])('rejects unsafe database URL %s', (url) => {
		expect(() => firebaseConfig(new ConfigService({ ...values(), FIREBASE_DATABASE_URL: url }))).toThrow(
			'Invalid FIREBASE_DATABASE_URL',
		);
	});
	it('rejects unreadable, malformed and wrong-project accounts without exposing file contents', () => {
		expect(() =>
			firebaseConfig(new ConfigService({ ...values(), FIREBASE_SERVICE_ACCOUNT_PATH: join(directory, 'missing') })),
		).toThrow('Cannot load');
		writeFileSync(accountPath, 'private-sentinel malformed');
		expect(() => firebaseConfig(new ConfigService(values()))).toThrow('Cannot load FIREBASE_SERVICE_ACCOUNT_PATH');
		writeFileSync(accountPath, JSON.stringify({ ...account, project_id: 'other-project' }));
		expect(() => firebaseConfig(new ConfigService(values()))).toThrow('project mismatch');
	});
	it('uses one named Admin app across Nest containers and adds expiring chat claims', async () => {
		const create = () =>
			Test.createTestingModule({ imports: [FirebaseModule] })
				.overrideProvider(ConfigService)
				.useValue(new ConfigService(values()))
				.compile();
		const first = await create();
		const second = await create();
		try {
			expect(getApps().filter((app) => app.name === 'anorcar-chat')).toHaveLength(1);
			const app = getApps().find((app) => app.name === 'anorcar-chat')!;
			const issuedAtMs = 1791879000000;
			jest.spyOn(Date, 'now').mockReturnValue(issuedAtMs);
			const mint = jest.spyOn(getAuth(app), 'createCustomToken').mockResolvedValue('fixture-token');
			await expect(first.get(FirebaseService).createChatToken('verified-uid')).resolves.toBe('fixture-token');
			expect(CHAT_SESSION_MS).toBe(900000);
			expect(mint).toHaveBeenCalledWith('verified-uid', {
				anorcarChat: true,
				chatExpiresAt: issuedAtMs + CHAT_SESSION_MS,
			});
			await second.get(FirebaseService).createChatToken('another-uid');
			expect(mint).toHaveBeenCalledTimes(2);
		} finally {
			await first.close();
			await second.close();
		}
	});
	it('rejects conflicting configuration on an existing app', async () => {
		const first = await Test.createTestingModule({ imports: [FirebaseModule] })
			.overrideProvider(ConfigService)
			.useValue(new ConfigService(values()))
			.compile();
		try {
			await expect(
				Test.createTestingModule({ imports: [FirebaseModule] })
					.overrideProvider(ConfigService)
					.useValue(
						new ConfigService({ ...values(), FIREBASE_DATABASE_URL: 'https://another-instance.firebaseio.com' }),
					)
					.compile(),
			).rejects.toThrow('configuration mismatch');
		} finally {
			await first.close();
		}
	});
	it('signs a real SDK custom token locally using fixture credentials', async () => {
		const module = await Test.createTestingModule({ imports: [FirebaseModule] })
			.overrideProvider(ConfigService)
			.useValue(new ConfigService(values()))
			.compile();
		try {
			const before = Date.now();
			const token = await module.get(FirebaseService).createChatToken('verified-member');
			const [header, payload, signature] = token.split('.');
			const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
			expect(JSON.parse(Buffer.from(header, 'base64url').toString('utf8')).alg).toBe('RS256');
			expect(
				verify(
					'RSA-SHA256',
					Buffer.from(`${header}.${payload}`),
					createPublicKey(account.private_key),
					Buffer.from(signature, 'base64url'),
				),
			).toBe(true);
			expect(claims.uid).toBe('verified-member');
			expect(claims.claims.anorcarChat).toBe(true);
			expect(claims.exp - claims.iat).toBe(3600);
			expect(claims.iat).toBeLessThan(Date.now() / 1000 + 1);
			expect(Number.isSafeInteger(claims.claims.chatExpiresAt)).toBe(true);
			expect(claims.claims.chatExpiresAt).toBeGreaterThanOrEqual(before + CHAT_SESSION_MS);
			expect(claims.claims.chatExpiresAt).toBeLessThanOrEqual(Date.now() + CHAT_SESSION_MS);
		} finally {
			await module.close();
		}
	});
});
