import { Field, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { BrandStatus } from '../../enums/brand.enum';

@ObjectType()
export class Brand {
	@Field(() => String) _id!: ObjectId;
	@Field(() => String) brandName!: string;
	@Field(() => String) brandLogo!: string;
	@Field(() => BrandStatus) brandStatus!: BrandStatus;
}
