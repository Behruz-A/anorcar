import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length } from 'class-validator';
import type { ObjectId } from 'mongoose';
import { BrandStatus } from '../../enums/brand.enum';

@InputType()
export class BrandUpdate {
	@IsNotEmpty() @Field(() => String) _id!: ObjectId;
	@IsOptional() @Length(1, 60) @Field(() => String, { nullable: true }) brandName?: string;
	@IsOptional() @Length(1, 300) @Field(() => String, { nullable: true }) brandLogo?: string;
	@IsOptional() @Field(() => BrandStatus, { nullable: true }) brandStatus?: BrandStatus;
}
