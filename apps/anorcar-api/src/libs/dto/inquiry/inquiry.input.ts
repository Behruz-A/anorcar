import { Field, InputType, Int } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsInt, IsMongoId, IsOptional, Length, Matches, Max, Min } from 'class-validator';
import { InquiryStatus, InquirySubject } from '../../enums/inquiry.enum';

const trim = ({ value }: { value: unknown }): unknown => (typeof value === 'string' ? value.trim() : value);

@InputType()
export class InquiryInput {
	@Transform(trim)
	@Length(1, 80)
	@Matches(/\S/)
	@Field(() => String)
	inquiryName!: string;
	@Transform(trim)
	@IsEmail()
	@Length(1, 120)
	@Field(() => String)
	inquiryEmail!: string;
	@IsEnum(InquirySubject)
	@Field(() => InquirySubject)
	inquirySubject!: InquirySubject;
	@Transform(trim)
	@Length(1, 1500)
	@Matches(/\S/)
	@Field(() => String)
	inquiryMessage!: string;
}

@InputType()
export class AllInquiriesInquiry {
	@IsInt()
	@Min(1)
	@Max(100000)
	@Field(() => Int)
	page!: number;
	@IsInt()
	@Min(1)
	@Max(60)
	@Field(() => Int)
	limit!: number;
	@IsOptional()
	@IsEnum(InquiryStatus)
	@Field(() => InquiryStatus, { nullable: true })
	inquiryStatus?: InquiryStatus;
	@IsOptional()
	@Transform(trim)
	@Length(0, 100)
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class InquiryUpdate {
	@IsMongoId()
	@Field(() => String)
	_id!: string;
	@IsEnum(InquiryStatus)
	@Field(() => InquiryStatus)
	inquiryStatus!: InquiryStatus;
}
