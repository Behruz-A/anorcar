import 'reflect-metadata';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Mongoose, PipelineStage, Types } from 'mongoose';
import request from 'supertest';
import { InquiryResolver } from './inquiry.resolver';
import { InquiryService } from './inquiry.service';
import { AuthService } from '../auth/auth.service';
import { Inquiry } from '../../libs/dto/inquiry/inquiry';
import { InquiryStatus, InquirySubject } from '../../libs/enums/inquiry.enum';
import InquirySchema from '../../schemas/Inquiry.model';

const create =
	'mutation($input:InquiryInput!){createInquiry(input:$input){_id memberId inquiryName inquiryEmail inquiryMessage inquiryStatus}}';
const list =
	'query($input:AllInquiriesInquiry!){getAllInquiriesByAdmin(input:$input){list{_id inquiryMessage inquiryStatus}metaCounter{total}}}';
const update = 'mutation($input:InquiryUpdate!){updateInquiryByAdmin(input:$input){_id inquiryStatus}}';
const validInput = {
	inquiryName: ' QA Buyer ',
	inquiryEmail: 'buyer@example.test',
	inquirySubject: InquirySubject.TECHNICAL_SUPPORT,
	inquiryMessage: ' Help with model <A> .* ',
};

describe('Inquiry GraphQL integration (isolated storage)', () => {
	let app: INestApplication;
	const rows: Inquiry[] = [];
	const jwt = new JwtService({ secret: 'inquiry-test-only-secret' });
	const memberId = new Types.ObjectId().toString();
	const userToken = jwt.sign({ _id: memberId, memberType: 'USER', memberNick: 'QA Buyer' });
	const adminToken = jwt.sign({ _id: new Types.ObjectId().toString(), memberType: 'ADMIN', memberNick: 'QA Admin' });
	const documentModel = new Mongoose().model<Inquiry>('InquiryTest', InquirySchema);
	const model = {
		create: jest.fn(async (input: Partial<Inquiry>) => {
			const doc = new documentModel(input);
			await doc.validate();
			const row = { ...doc.toObject(), createdAt: new Date(), updatedAt: new Date() } as Inquiry;
			rows.push(row);
			return row;
		}),
		aggregate: jest.fn((pipeline: PipelineStage[]) => ({
			exec: async () => {
				const match = pipeline[0] as {
					$match: { inquiryStatus?: InquiryStatus; $or?: Record<string, { $regex: string; $options: string }>[] };
				};
				const facet = pipeline[2] as { $facet: { list: [{ $skip: number }, { $limit: number }] } };
				const filtered = rows
					.filter(
						(row) =>
							(!match.$match.inquiryStatus || row.inquiryStatus === match.$match.inquiryStatus) &&
							(!match.$match.$or ||
								match.$match.$or.some((condition) =>
									Object.entries(condition).some(([field, regex]) =>
										new RegExp(regex.$regex, regex.$options).test(String(row[field as keyof Inquiry])),
									),
								)),
					)
					.reverse();
				return [
					{
						list: filtered.slice(facet.$facet.list[0].$skip, facet.$facet.list[0].$skip + facet.$facet.list[1].$limit),
						metaCounter: filtered.length ? [{ total: filtered.length }] : [],
					},
				];
			},
		})),
		findByIdAndUpdate: jest.fn((id: string, patch: { $set: { inquiryStatus: InquiryStatus } }) => ({
			exec: async () => {
				const row = rows.find((value) => value._id.toString() === id);
				if (!row) return null;
				row.inquiryStatus = patch.$set.inquiryStatus;
				return row;
			},
		})),
	};
	const call = (query: string, input: object, token?: string) => {
		const operation = request(app.getHttpServer()).post('/graphql').send({ query, variables: { input } });
		return token ? operation.set('Authorization', 'Bearer ' + token) : operation;
	};
	beforeAll(async () => {
		const module = await Test.createTestingModule({
			imports: [GraphQLModule.forRoot<ApolloDriverConfig>({ driver: ApolloDriver, autoSchemaFile: true })],
			providers: [
				InquiryResolver,
				InquiryService,
				{ provide: AuthService, useValue: new AuthService(jwt) },
				{ provide: getModelToken('Inquiry'), useValue: model },
			],
		}).compile();
		app = module.createNestApplication();
		app.useGlobalPipes(new ValidationPipe());
		await app.init();
	});
	afterAll(async () => {
		await app?.close();
	});
	it('requires login and prevents buyers reading or updating private inquiries', async () => {
		expect((await call(create, validInput)).body.errors).toBeDefined();
		expect((await call(list, { page: 1, limit: 20 }, userToken)).body.errors).toBeDefined();
		expect(
			(await call(update, { _id: new Types.ObjectId().toString(), inquiryStatus: 'CLOSED' }, userToken)).body.errors,
		).toBeDefined();
		expect(rows).toHaveLength(0);
	});
	it.each([
		{ inquiryName: '   ' },
		{ inquiryEmail: 'invalid' },
		{ inquiryMessage: '   ' },
		{ inquiryMessage: 'x'.repeat(1501) },
		{ inquirySubject: 'UNSUPPORTED' },
		{ memberId: new Types.ObjectId().toString() },
	])('rejects invalid or spoofed input %j', async (patch) => {
		expect((await call(create, { ...validInput, ...patch }, userToken)).body.errors).toBeDefined();
		expect(rows).toHaveLength(0);
	});
	it('saves under authenticated owner and allows admin to search, paginate and update status', async () => {
		const sent = (await call(create, validInput, userToken)).body;
		expect(sent.errors).toBeUndefined();
		expect(sent.data.createInquiry).toMatchObject({
			memberId,
			inquiryName: 'QA Buyer',
			inquiryMessage: 'Help with model <A> .*',
			inquiryStatus: 'NEW',
		});
		const read = (await call(list, { page: 1, limit: 20, inquiryStatus: 'NEW', text: '.*' }, adminToken)).body;
		expect(read.errors).toBeUndefined();
		expect(read.data.getAllInquiriesByAdmin.metaCounter).toEqual([{ total: 1 }]);
		expect((await call(list, { page: 2, limit: 1 }, adminToken)).body.data.getAllInquiriesByAdmin.list).toEqual([]);
		for (const status of ['READ', 'CLOSED', 'NEW']) {
			const changed = (await call(update, { _id: sent.data.createInquiry._id, inquiryStatus: status }, adminToken))
				.body;
			expect(changed.errors).toBeUndefined();
			expect(changed.data.updateInquiryByAdmin.inquiryStatus).toBe(status);
		}
		expect(rows[0].memberId.toString()).toBe(memberId);
	});
	it('rejects invalid pagination and missing updates; storage failures return errors', async () => {
		for (const input of [
			{ page: 0, limit: 20 },
			{ page: 1, limit: 61 },
			{ page: 1, limit: 0 },
		]) {
			expect((await call(list, input, adminToken)).body.errors).toBeDefined();
		}
		expect(
			(await call(update, { _id: new Types.ObjectId().toString(), inquiryStatus: 'READ' }, adminToken)).body.errors,
		).toBeDefined();
		model.create.mockRejectedValueOnce(new Error('Storage unavailable'));
		expect((await call(create, validInput, userToken)).body.errors).toBeDefined();
		expect(rows).toHaveLength(1);
	});
});
