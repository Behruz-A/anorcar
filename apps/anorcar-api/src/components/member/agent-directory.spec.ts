import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { MemberService } from './member.service';
import { AgentsInquiry } from '../../libs/dto/member/member.input';
import { MemberUpdate } from '../../libs/dto/member/memberr.update';
import { AgentLanguage, AgentType } from '../../libs/enums/member.enum';
import MemberSchema from '../../schemas/Member.model';

describe('Agent directory filters', () => {
	it('accepts optional metadata and legacy profiles without inventing values', async () => {
		expect(await validate(Object.assign(new MemberUpdate(), { _id: '507f1f77bcf86cd799439011' }))).toHaveLength(0);
		expect(await validate(Object.assign(new MemberUpdate(), { _id: '507f1f77bcf86cd799439011', agentType: AgentType.INDEPENDENT, agentLanguages: [AgentLanguage.KOREAN] }))).toHaveLength(0);
		expect(MemberSchema.path('agentType').options.default).toBeUndefined();
		expect(MemberSchema.path('agentLanguages').options.default).toBeUndefined();
	});
	it.each([{ agentTypes: ['ADMIN'] }, { languages: ['INVALID'] }, { minCars: -1 }, { maxCars: 1.5 }, { location: 'x'.repeat(101) }])('validates nested search %j', async search => {
		const input = plainToInstance(AgentsInquiry, { page: 1, limit: 9, search });
		expect((await validate(input)).length).toBeGreaterThan(0);
	});
	it('combines real metadata, keyword, region and count before pagination', async () => {
		const aggregate = jest.fn().mockReturnValue({ exec: async () => [{ list: [], metaCounter: [] }] });
		const service = Object.assign(Object.create(MemberService.prototype) as MemberService, { memberModel: { aggregate } });
		await service.getAgents(null as never, { page: 2, limit: 9, sort: 'createdAt', search: { text: 'Ryan', location: 'Seoul (KR)', agentTypes: [AgentType.DEALERSHIP], languages: [AgentLanguage.ENGLISH], minCars: 11, maxCars: 50 } });
		const pipeline = aggregate.mock.calls[0][0];
		expect(pipeline[0].$match).toMatchObject({ memberType: 'AGENT', memberStatus: 'ACTIVE', agentType: { $in: ['DEALERSHIP'] }, agentLanguages: { $all: ['ENGLISH'] }, memberCars: { $gte: 11, $lte: 50 } });
		expect(pipeline[0].$match.$or.map((field: object) => Object.keys(field)[0])).toEqual(['memberNick', 'memberFullName', 'memberAddress', 'memberDesc']);
		const region = pipeline[0].$match.memberAddress.$regex;
		expect(region.test('Seoul (KR)')).toBe(true);
		expect(region.test('Seoul KR')).toBe(false);
		expect(pipeline[2].$facet.list[0]).toEqual({ $skip: 9 });
		await expect(service.getAgents(null as never, { page: 1, limit: 9, search: { minCars: 50, maxCars: 1 } })).rejects.toThrow();
	});
});
