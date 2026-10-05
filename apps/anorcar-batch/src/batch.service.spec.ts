import { BatchService } from './batch.service';

describe('BatchService rankings', () => {
	it('calculates car rank from likes and views', async () => {
		const car = { _id: 'car', carLikes: 4, carViews: 3 };
		const exec = jest.fn().mockResolvedValue([car]);
		const update = jest.fn();
		const carModel = { find: jest.fn().mockReturnValue({ exec }), findOneAndUpdate: update };
		const service = new BatchService(carModel as never, {} as never);

		await service.batchTopCars();
		expect(update).toHaveBeenCalledWith('car', { carRank: 11 });
	});

	it('calculates agent rank from memberCars and engagement', async () => {
		const agent = { _id: 'agent', memberCars: 2, memberArticles: 3, memberLikes: 4, memberViews: 5 };
		const exec = jest.fn().mockResolvedValue([agent]);
		const update = jest.fn();
		const memberModel = { find: jest.fn().mockReturnValue({ exec }), findByIdAndUpdate: update };
		const service = new BatchService({} as never, memberModel as never);

		await service.batchTopAgents();
		expect(update).toHaveBeenCalledWith('agent', { memberRank: 32 });
	});
});
