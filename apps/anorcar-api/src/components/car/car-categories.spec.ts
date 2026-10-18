import 'reflect-metadata';
import { validate } from 'class-validator';
import { CarInput, CarsInquiry } from '../../libs/dto/car/car.input';
import { CarUpdate } from '../../libs/dto/car/car.update';
import { CarBodyType, CarSegment, CarFuelType, CarCondition } from '../../libs/enums/car.enum';
import { CarService } from './car.service';
import CarSchema from '../../schemas/Car.model';

describe('Car category filters', () => {
 it.each(Object.values(CarBodyType))('validates body type %s on updates', async carBodyType => {
  const update = Object.assign(new CarUpdate(), { _id: '507f1f77bcf86cd799439011', carBodyType });
  expect(await validate(update)).toHaveLength(0);
 });
 it('rejects invalid create/update categories and permits unknown legacy values', async () => {
  const input = Object.assign(new CarInput(), { carBodyType: 'PLANE', carSegment: 'CHEAP' });
  expect((await validate(input)).map(error => error.property)).toEqual(expect.arrayContaining(['carBodyType', 'carSegment']));
  const legacy = Object.assign(new CarUpdate(), { _id: '507f1f77bcf86cd799439011', carBodyType: null, carSegment: null });
  expect(await validate(legacy)).toHaveLength(0);
  const invalid = Object.assign(new CarUpdate(), { _id: '507f1f77bcf86cd799439011', carBodyType: 'PLANE' });
  expect((await validate(invalid)).map(error => error.property)).toContain('carBodyType');
 });
 it('defines optional schema fields with enum validation', () => {
  expect(CarSchema.path('carBodyType').options.required).toBeUndefined();
  expect(CarSchema.path('carSegment').options.required).toBeUndefined();
  expect(CarSchema.path('carBodyType').options.enum).toEqual(CarBodyType);
 });
 it('combines categories, fuel, condition, region and ranges in the existing getCars pipeline', async () => {
  const aggregate = jest.fn().mockReturnValue({ exec: async () => [{ list: [], metaCounter: [] }] });
  const model = { aggregate } as unknown as ConstructorParameters<typeof CarService>[0];
  const service = new CarService(model, ...Array(4).fill({}) as [never, never, never, never]);
  const input: CarsInquiry = { page: 2, limit: 9, search: {
   bodyTypes: [CarBodyType.SUV], segments: [CarSegment.LUXURY], fuelTypes: [CarFuelType.HYBRID],
   conditions: [CarCondition.USED], pricesRange: { start: 0, end: 50000000 },
  } };
  await service.getCars(null as never, input);
  const pipeline = aggregate.mock.calls[0][0];
  expect(pipeline[0].$match).toMatchObject({ carStatus: 'ACTIVE', carBodyType: { $in: ['SUV'] },
   carSegment: { $in: ['LUXURY'] }, carFuelType: { $in: ['HYBRID'] }, carCondition: { $in: ['USED'] },
   carPrice: { $gte: 0, $lte: 50000000 } });
  expect(pipeline.find((stage: { $facet?: unknown }) => stage.$facet).$facet.list[0]).toEqual({ $skip: 9 });
  await service.getCars(null as never, { page: 1, limit: 9, search: {} });
  expect(aggregate.mock.calls[1][0][0].$match).not.toHaveProperty('carBodyType');
 });
});
