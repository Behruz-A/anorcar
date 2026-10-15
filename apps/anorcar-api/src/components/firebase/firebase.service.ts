import { Inject, Injectable } from '@nestjs/common';
import type { App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';

export const FIREBASE_APP = Symbol('FIREBASE_APP');
export const CHAT_SESSION_MS = 15 * 60 * 1000;

@Injectable()
export class FirebaseService {
	constructor(@Inject(FIREBASE_APP) private readonly app: App) {}

	public createChatToken(uid: string): Promise<string> {
		return getAuth(this.app).createCustomToken(uid, {
			anorcarChat: true,
			chatExpiresAt: Date.now() + CHAT_SESSION_MS,
		});
	}

	public get database() {
		return getDatabase(this.app);
	}
}
