import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { firebaseConfig } from '../../libs/config/firebase.config';
import { FirebaseService, FIREBASE_APP } from './firebase.service';

@Module({
	imports: [ConfigModule],
	providers: [
		{
			provide: FIREBASE_APP,
			inject: [ConfigService],
			useFactory: (config: ConfigService) => {
				const settings = firebaseConfig(config);
				const existing = getApps().find((app) => app.name === 'anorcar-chat');
				if (existing) {
					if (
						existing.options.projectId !== settings.projectId ||
						existing.options.databaseURL !== settings.databaseURL
					)
						throw new Error('Firebase app configuration mismatch');
					return existing;
				}
				try {
					return initializeApp(
						{
							projectId: settings.projectId,
							databaseURL: settings.databaseURL,
							credential: cert(settings.serviceAccount),
						},
						'anorcar-chat',
					);
				} catch {
					throw new Error('Cannot initialize Firebase Admin credentials');
				}
			},
		},
		FirebaseService,
	],
	exports: [FirebaseService],
})
export class FirebaseModule {}
