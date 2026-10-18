import 'reflect-metadata';
import { Types } from 'mongoose';
import { CarService } from './car.service';
import { CarStatus } from '../../libs/enums/car.enum';

describe('Admin car status transitions', () => {
	const setup = (status: CarStatus) => {
		const record = { _id: new Types.ObjectId(), memberId: new Types.ObjectId(), carStatus: status, soldAt: new Date(), deletedAt: new Date() };
		const model = {
			findOne: jest.fn(() => ({ exec: async () => record.carStatus === CarStatus.DELETE ? null : { ...record } })),
			findOneAndUpdate: jest.fn((search, update) => ({ exec: async () => {
				if (record.carStatus !== search.carStatus) return null;
				Object.assign(record, update.$set);
				for (const field of Object.keys(update.$unset ?? {})) delete record[field];
				return { ...record };
			} })),
		};
		const member = { memberStatsEditor: jest.fn().mockResolvedValue({}) };
		const service = new CarService(model as never, member as never, {} as never, {} as never, {} as never);
		return { service, model, member, record };
	};
	it('restores sold cars, clears lifecycle dates and adds one active listing', async () => {
		const { service, record, member } = setup(CarStatus.SOLD);
		const result = await service.updateCarByAdmin({ _id: record._id as never, carStatus: CarStatus.ACTIVE });
		expect(result.carStatus).toBe(CarStatus.ACTIVE);
		expect(result).not.toHaveProperty('soldAt');
		expect(result).not.toHaveProperty('deletedAt');
		expect(member.memberStatsEditor).toHaveBeenCalledWith({ _id: record.memberId, targetKey: 'memberCars', modifier: 1 });
		await service.updateCarByAdmin({ _id: record._id as never, carStatus: CarStatus.ACTIVE });
		expect(member.memberStatsEditor).toHaveBeenCalledTimes(1);
	});
	it.each([CarStatus.SOLD, CarStatus.DELETE])('removes one active listing when changed to %s', async carStatus => {
		const { service, record, member } = setup(CarStatus.ACTIVE);
		const result = await service.updateCarByAdmin({ _id: record._id as never, carStatus });
		expect(result[carStatus === CarStatus.SOLD ? 'soldAt' : 'deletedAt']).toBeInstanceOf(Date);
		expect(member.memberStatsEditor).toHaveBeenCalledWith({ _id: record.memberId, targetKey: 'memberCars', modifier: -1 });
	});
	it('does not change counters for normal active edits', async () => {
		const { service, record, member } = setup(CarStatus.ACTIVE);
		await service.updateCarByAdmin({ _id: record._id as never, carTitle: 'Updated car' });
		expect(member.memberStatsEditor).not.toHaveBeenCalled();
	});
	it('keeps deleted cars non-restorable and sold cars limited to reactivation', async () => {
		for (const [from, to] of [[CarStatus.DELETE, CarStatus.ACTIVE], [CarStatus.SOLD, CarStatus.DELETE]]) {
			const { service, record, member, model } = setup(from);
			await expect(service.updateCarByAdmin({ _id: record._id as never, carStatus: to })).rejects.toThrow();
			expect(model.findOneAndUpdate).not.toHaveBeenCalled();
			expect(member.memberStatsEditor).not.toHaveBeenCalled();
		}
	});
	it('uses the previous status as an atomic condition so concurrent restores count once', async () => {
		const { service, record, member } = setup(CarStatus.SOLD);
		const results = await Promise.allSettled([1, 2].map(() => service.updateCarByAdmin({ _id: record._id as never, carStatus: CarStatus.ACTIVE })));
		expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
		expect(member.memberStatsEditor).toHaveBeenCalledTimes(1);
	});
});
