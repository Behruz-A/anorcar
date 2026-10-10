import 'reflect-metadata';
import { validate } from 'class-validator';
import { model } from 'mongoose';
import { CarInput } from './car.input';
import { CarUpdate } from './car.update';
import CarSchema from '../../../schemas/Car.model';

const MileageCar = model('MileageValidationCar', CarSchema);

describe('Optional car mileage in whole kilometres', () => {
 it.each([undefined, null, 0, 28000, 2147483647])('accepts %s in create and update DTOs', async (value) => {
  for (const Dto of [CarInput, CarUpdate]) {
   const input = Object.assign(new Dto(), { carMileage: value });
   const errors = await validate(input);
   expect(errors.filter((error) => error.property === 'carMileage')).toHaveLength(0);
  }
 });
 it.each([-1, 1.5, 2147483648, NaN, Infinity, '28000'])('rejects %s in create and update DTOs', async (value) => {
  for (const Dto of [CarInput, CarUpdate]) {
   const input = Object.assign(new Dto(), { carMileage: value });
   const errors = await validate(input);
   expect(errors.some((error) => error.property === 'carMileage')).toBe(true);
  }
 });
 it.each([-1, 1.5, 2147483648])('rejects invalid persisted mileage %s', (carMileage) => {
  expect(new MileageCar({ carMileage }).validateSync()?.errors.carMileage).toBeDefined();
 });
 it('preserves zero, missing mileage and unknown mileage separately', () => {
  expect(new MileageCar({ carMileage: 0 }).toObject().carMileage).toBe(0);
  expect(new MileageCar().toObject().carMileage).toBeUndefined();
  expect(new MileageCar({ carMileage: null }).toObject().carMileage).toBeNull();
  expect(new MileageCar({ carMileage: 28000 }).toObject().carMileage).toBe(28000);
 });
});
