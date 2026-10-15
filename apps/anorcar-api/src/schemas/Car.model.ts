import { Schema } from 'mongoose';
import { CarCondition, CarFuelType, CarLocation, CarStatus, CarTransmission } from '../libs/enums/car.enum';

const CarSchema = new Schema(
	{
		carStatus: { type: String, enum: CarStatus, default: CarStatus.ACTIVE },
		carFuelType: { type: String, enum: CarFuelType, required: true },
		carCondition: { type: String, enum: CarCondition, required: true },
		carModel: { type: String, required: true, trim: true },
		carYear: { type: Number, required: true },
		// Optional whole-kilometre odometer reading; unknown is not zero.
		carMileage: { type: Number, min: 0, max: 2147483647, validate: { validator: (value: number | null) => value == null || Number.isInteger(value), message: 'Mileage must be a whole number of kilometres.' } },
		carLocation: { type: String, enum: CarLocation, required: true },
		carAddress: { type: String, required: true, trim: true },
		carTransmission: { type: String, enum: CarTransmission, required: true },
		carTitle: { type: String, required: true, trim: true },
		carPrice: { type: Number, required: true, min: 1 },
		carColor: { type: String, required: true, trim: true },
		carViews: { type: Number, default: 0 },
		carLikes: { type: Number, default: 0 },
		carComments: { type: Number, default: 0 },
		carRank: { type: Number, default: 0 },
		carImages: { type: [String], required: true },
		brandId: { type: Schema.Types.ObjectId, required: true, ref: 'Brand' },
		carDesc: { type: String },
		carBarter: { type: Boolean, default: false },
		carRent: { type: Boolean, default: false },
		memberId: { type: Schema.Types.ObjectId, required: true, ref: 'Member' },
		soldAt: { type: Date },
		deletedAt: { type: Date },
	},
	{ timestamps: true, collection: 'cars' },
);

CarSchema.index({ brandId: 1, carModel: 1, carYear: 1 });
CarSchema.index({ carStatus: 1, carLocation: 1, carFuelType: 1, carCondition: 1, carTransmission: 1 });

export default CarSchema;
