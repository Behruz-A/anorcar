import { Field, InputType } from '@nestjs/graphql';
import { ArrayMaxSize, ArrayUnique, IsArray, IsEnum, IsNotEmpty, IsOptional, Length } from 'class-validator';
import { AgentType, AgentLanguage, MemberStatus, MemberType } from '../../enums/member.enum';
import type { ObjectId } from 'mongoose';

@InputType()
export class MemberUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id!: ObjectId;

	@IsOptional()
	@Field(() => MemberType, { nullable: true })
	memberType?: MemberType;

	@IsOptional()
	@Field(() => MemberStatus, { nullable: true })
	memberStatus?: MemberStatus;

	@IsOptional()
	@Field(() => String, { nullable: true })
	memberPhone?: string;

	@IsOptional()
	@Length(3, 12)
	@Field(() => String, { nullable: true })
	memberNick?: string;

	@IsOptional()
	@Length(5, 12)
	@Field(() => String, { nullable: true })
	memberPassword?: string;

	@IsOptional()
	@Length(3, 100)
	@Field(() => String, { nullable: true })
	memberFullName?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	memberImage?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	memberAddress?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	memberDesc?: string;

	@IsOptional()
	@IsEnum(AgentType)
	@Field(() => AgentType, { nullable: true })
	agentType?: AgentType | null;
	@IsOptional()
	@IsArray()
	@ArrayUnique()
	@ArrayMaxSize(7)
	@IsEnum(AgentLanguage, { each: true })
	@Field(() => [AgentLanguage], { nullable: true })
	agentLanguages?: AgentLanguage[] | null;

	deletedAt?: Date;
}
