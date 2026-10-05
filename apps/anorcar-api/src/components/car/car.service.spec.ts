import { BadRequestException } from '@nestjs/common';
import { CarService } from './car.service';
import { CarCondition, CarFuelType, CarLocation, CarStatus, CarTransmission } from '../../libs/enums/car.enum';

describe('CarService filters', () => {
	const service = new CarService({} as never, {} as never, {} as never, {} as never, {} as never);

	it('maps the complete car search contract into Mongo criteria', () => {
		const match: Record<string, any> = {};
		(service as any).shapeMatchQuery(match, {
			search: {
				locations: [CarLocation.SEOUL],
				fuelTypes: [CarFuelType.ELECTRIC],
				conditions: [CarCondition.NEW],
				transmissions: [CarTransmission.AVTOMATIC],
				yearsRange: { start: 2020, end: 2026 },
				pricesRange: { start: 1000, end: 5000 },
				options: ['carBarter'],
				text: 'ioniq',
			},
		});

		expect(match.carLocation).toEqual({ $in: [CarLocation.SEOUL] });
		expect(match.carFuelType).toEqual({ $in: [CarFuelType.ELECTRIC] });
		expect(match.carCondition).toEqual({ $in: [CarCondition.NEW] });
		expect(match.carTransmission).toEqual({ $in: [CarTransmission.AVTOMATIC] });
		expect(match.carYear).toEqual({ $gte: 2020, $lte: 2026 });
		expect(match.carPrice).toEqual({ $gte: 1000, $lte: 5000 });
		expect(match.$or).toEqual([{ carBarter: true }]);
		expect(match.$and).toHaveLength(1);
	});

	it('rejects reversed ranges', () => {
		expect(() => (service as any).shapeMatchQuery({}, { search: { pricesRange: { start: 2, end: 1 } } })).toThrow(
			BadRequestException,
		);
	});
});

describe('CarService lifecycle', () => {
	it('validates the brand and increments memberCars when creating a car', async () => {
		const car = { memberId: 'member' };
		const carModel = { create: jest.fn().mockResolvedValue(car) };
		const memberService = { memberStatsEditor: jest.fn() };
		const brandService = { getBrand: jest.fn() };
		const service = new CarService(carModel as never, memberService as never, {} as never, {} as never, brandService as never);
		const input = { brandId: '507f1f77bcf86cd799439011' } as never;

		await expect(service.createCar(input)).resolves.toBe(car);
		expect(brandService.getBrand).toHaveBeenCalled();
		expect(memberService.memberStatsEditor).toHaveBeenCalledWith({ _id: 'member', targetKey: 'memberCars', modifier: 1 });
	});

	it('marks a car sold and decrements memberCars once', async () => {
		const updated = { memberId: 'member' };
		const exec = jest.fn().mockResolvedValue(updated);
		const carModel = { findOneAndUpdate: jest.fn().mockReturnValue({ exec }) };
		const memberService = { memberStatsEditor: jest.fn() };
		const service = new CarService(carModel as never, memberService as never, {} as never, {} as never, {} as never);
		const input = { _id: 'car', carStatus: CarStatus.SOLD } as never;

		await service.updateCar('member' as never, input);
		expect((input as any).soldAt).toBeInstanceOf(Date);
		expect(memberService.memberStatsEditor).toHaveBeenCalledWith({ _id: 'member', targetKey: 'memberCars', modifier: -1 });
	});
});
