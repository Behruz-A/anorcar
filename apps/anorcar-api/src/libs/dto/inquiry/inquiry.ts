import { Field, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { InquiryStatus, InquirySubject } from '../../enums/inquiry.enum';
import { TotalCounter } from '../member/member';

@ObjectType()
export class Inquiry {
	@Field(() => String) _id!: ObjectId;
	@Field(() => String) memberId!: ObjectId;
	@Field(() => String) inquiryName!: string;
	@Field(() => String) inquiryEmail!: string;
	@Field(() => InquirySubject) inquirySubject!: InquirySubject;
	@Field(() => String) inquiryMessage!: string;
	@Field(() => InquiryStatus) inquiryStatus!: InquiryStatus;
	@Field(() => Date) createdAt!: Date;
	@Field(() => Date) updatedAt!: Date;
}

@ObjectType()
export class Inquiries {
	@Field(() => [Inquiry]) list!: Inquiry[];
	@Field(() => [TotalCounter]) metaCounter!: TotalCounter[];
}
