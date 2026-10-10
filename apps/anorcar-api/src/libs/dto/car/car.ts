import { Field, Int, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { CarCondition, CarFuelType, CarLocation, CarStatus, CarTransmission } from '../../enums/car.enum';
import { Member, TotalCounter } from '../member/member';
import { MeLiked } from '../like/like';
import { Brand } from '../brand/brand';

@ObjectType()
export class Car {
	@Field(() => String) _id!: ObjectId;
	@Field(() => CarStatus) carStatus!: CarStatus;
	@Field(() => CarFuelType) carFuelType!: CarFuelType;
	@Field(() => CarCondition) carCondition!: CarCondition;
	@Field(() => String) carModel!: string;
	@Field(() => Int) carYear!: number;
	@Field(() => Int, { nullable: true }) carMileage?: number | null;
	@Field(() => CarLocation) carLocation!: CarLocation;
	@Field(() => String) carAddress!: string;
	@Field(() => CarTransmission) carTransmission!: CarTransmission;
	@Field(() => String) carTitle!: string;
	@Field(() => Number) carPrice!: number;
	@Field(() => String) carColor!: string;
	@Field(() => Int) carViews!: number;
	@Field(() => Int) carLikes!: number;
	@Field(() => Int) carComments!: number;
	@Field(() => Int) carRank!: number;
	@Field(() => [String]) carImages!: string[];
	@Field(() => String) brandId!: ObjectId;
	@Field(() => String, { nullable: true }) carDesc?: string;
	@Field(() => Boolean) carBarter!: boolean;
	@Field(() => Boolean) carRent!: boolean;
	@Field(() => String) memberId!: ObjectId;
	@Field(() => Date, { nullable: true }) soldAt?: Date;
	@Field(() => Date, { nullable: true }) deletedAt?: Date;
	@Field(() => Date) createdAt!: Date;
	@Field(() => Date) updatedAt!: Date;
	@Field(() => Member, { nullable: true }) memberData?: Member;
	@Field(() => Brand, { nullable: true }) brandData?: Brand;
	@Field(() => [MeLiked], { nullable: true }) meLiked?: MeLiked[];
}

@ObjectType()
export class Cars {
	@Field(() => [Car]) list!: Car[];
	@Field(() => [TotalCounter], { nullable: true }) metaCounter?: TotalCounter[];
}
