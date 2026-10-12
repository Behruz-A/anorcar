import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { ObjectId } from 'mongoose';
import { Inquiry, Inquiries } from '../../libs/dto/inquiry/inquiry';
import { AllInquiriesInquiry, InquiryInput, InquiryUpdate } from '../../libs/dto/inquiry/inquiry.input';
import { MemberType } from '../../libs/enums/member.enum';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { InquiryService } from './inquiry.service';

@Resolver()
export class InquiryResolver {
	constructor(private readonly inquiryService: InquiryService) {}

	@UseGuards(AuthGuard)
	@Mutation(() => Inquiry)
	public async createInquiry(
		@Args('input') input: InquiryInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Inquiry> {
		return this.inquiryService.createInquiry(shapeIntoMongoObjectId(memberId), input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Inquiries)
	public async getAllInquiriesByAdmin(@Args('input') input: AllInquiriesInquiry): Promise<Inquiries> {
		return this.inquiryService.getAllInquiriesByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Inquiry)
	public async updateInquiryByAdmin(@Args('input') input: InquiryUpdate): Promise<Inquiry> {
		return this.inquiryService.updateInquiryByAdmin(input);
	}
}
