import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ServiceAccount } from 'firebase-admin/app';

export function firebaseConfig(config: ConfigService) {
	const required = (name: string): string => {
		const value = config.get<string>(name)?.trim();
		if (!value) throw new Error(`Missing ${name}`);
		return value;
	};
	const projectId = required('FIREBASE_PROJECT_ID');
	const databaseURL = required('FIREBASE_DATABASE_URL');
	const serviceAccountPath = resolve(required('FIREBASE_SERVICE_ACCOUNT_PATH'));
	if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(projectId)) throw new Error('Invalid FIREBASE_PROJECT_ID');
	let url: URL;
	try {
		url = new URL(databaseURL);
	} catch {
		throw new Error('Invalid FIREBASE_DATABASE_URL');
	}
	if (
		url.protocol !== 'https:' ||
		!/^[a-z0-9-]+\.(firebaseio\.com|[a-z0-9-]+\.firebasedatabase\.app)$/.test(url.hostname) ||
		url.username ||
		url.password ||
		url.port ||
		url.search ||
		url.hash ||
		url.pathname !== '/'
	) {
		throw new Error('Invalid FIREBASE_DATABASE_URL: use the HTTPS Realtime Database root URL');
	}
	let account: Record<string, unknown>;
	try {
		const parsed: unknown = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
		account = parsed as Record<string, unknown>;
	} catch {
		throw new Error('Cannot load FIREBASE_SERVICE_ACCOUNT_PATH');
	}
	if (
		account.type !== 'service_account' ||
		account.project_id !== projectId ||
		typeof account.client_email !== 'string' ||
		!account.client_email.endsWith('.iam.gserviceaccount.com') ||
		typeof account.private_key !== 'string' ||
		!account.private_key.includes('-----BEGIN PRIVATE KEY-----')
	) {
		throw new Error('Invalid Firebase service account or project mismatch');
	}
	const serviceAccount: ServiceAccount = {
		projectId,
		clientEmail: account.client_email,
		privateKey: account.private_key,
	};
	return { projectId, databaseURL: url.origin, serviceAccount };
}
