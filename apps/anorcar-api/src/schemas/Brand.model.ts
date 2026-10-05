import { Schema } from 'mongoose';
import { BrandStatus } from '../libs/enums/brand.enum';

const BrandSchema = new Schema(
	{
		brandName: { type: String, required: true, trim: true, unique: true },
		brandLogo: { type: String, required: true },
		brandStatus: { type: String, enum: BrandStatus, default: BrandStatus.ACTIVE },
	},
	{ collection: 'brands' },
);

export default BrandSchema;
