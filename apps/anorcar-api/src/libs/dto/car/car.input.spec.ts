import 'reflect-metadata';
import { validate } from 'class-validator';
import { CarInput } from './car.input';
import { CarCondition, CarFuelType, CarLocation, CarTransmission } from '../../enums/car.enum';

const validInput = (): CarInput => Object.assign(new CarInput(), {
	carFuelType: CarFuelType.GASOLINE,
	carCondition: CarCondition.USED,
	carModel: 'Sonata',
	carYear: 2022,
	carLocation: CarLocation.SEOUL,
	carAddress: 'Gangnam-gu',
	carTransmission: CarTransmission.AVTOMATIC,
	carTitle: 'Clean used Sonata',
	carPrice: 20000,
	carColor: 'Black',
	carImages: ['https://example.com/car.jpg'],
	brandId: '507f1f77bcf86cd799439011',
});

describe('CarInput', () => {
	it.each(Object.values(CarFuelType))('accepts fuel type %s', async (value) => {
		const input = validInput(); input.carFuelType = value;
		expect(await validate(input)).toHaveLength(0);
	});

	it.each(Object.values(CarCondition))('accepts condition %s', async (value) => {
		const input = validInput(); input.carCondition = value;
		expect(await validate(input)).toHaveLength(0);
	});

	it.each(Object.values(CarTransmission))('accepts transmission %s', async (value) => {
		const input = validInput(); input.carTransmission = value;
		expect(await validate(input)).toHaveLength(0);
	});

	it('rejects AUTOMATIC and empty images', async () => {
		const input = validInput();
		input.carTransmission = 'AUTOMATIC' as CarTransmission;
		input.carImages = [];
		const errors = await validate(input);
		expect(errors.map((error) => error.property)).toEqual(expect.arrayContaining(['carTransmission', 'carImages']));
	});
});
