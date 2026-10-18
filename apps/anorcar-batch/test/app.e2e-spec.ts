import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BatchController } from '../src/batch.controller';
import { BatchService } from '../src/batch.service';

describe('Batch HTTP smoke (no schedules or database)', () => {
	let app: INestApplication;
	beforeAll(async () => {
		const module = await Test.createTestingModule({ controllers: [BatchController], providers: [
			{ provide: BatchService, useFactory: () => new BatchService({} as never, {} as never) },
		] }).compile();
		app = module.createNestApplication();
		await app.init();
	});
	afterAll(async () => { await app.close(); });
	it('returns the batch welcome response', () => request(app.getHttpServer()).get('/').expect(200).expect('Welcome to BATCH Server!'));
});
