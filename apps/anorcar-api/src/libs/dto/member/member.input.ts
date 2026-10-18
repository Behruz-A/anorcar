import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayUnique, IsArray, IsEnum, IsIn, IsInt, IsNotEmpty, IsOptional, Length, Max, Min, ValidateNested } from 'class-validator';
import { AgentType, AgentLanguage, MemberAuthType, MemberStatus, MemberType } from '../../enums/member.enum';
import { availableAgentSorts, availableMemberSorts } from '../../config';
import { Direction } from '../../enums/common.enum';

@InputType()
export class MemberInput {
	@IsNotEmpty()
	@Length(3, 12)
	@Field(() => String)
	memberNick!: string;

	@IsNotEmpty()
	@Length(5, 12)
	@Field(() => String)
	memberPassword!: string;

	@IsNotEmpty()
	@Field(() => String)
	memberPhone!: string;

	@IsOptional()
	@Field(() => MemberType, { nullable: true })
	memberType?: MemberType;

	@IsOptional()
	@Field(() => MemberAuthType, { nullable: true })
	memberAuthType?: MemberAuthType;
}

@InputType()
export class LoginInput {
	@IsNotEmpty()
	@Length(3, 12)
	@Field(() => String)
	memberNick!: string;

	@IsNotEmpty()
	@Length(5, 12)
	@Field(() => String)
	memberPassword!: string;
}
@InputType()
class AISearch {
	@IsOptional()
	@Length(1, 100)
	@Field(() => String, { nullable: true })
	location?: string;
	@IsOptional()
	@IsArray()
	@ArrayUnique()
	@ArrayMaxSize(2)
	@IsEnum(AgentType, { each: true })
	@Field(() => [AgentType], { nullable: true })
	agentTypes?: AgentType[];
	@IsOptional()
	@IsArray()
	@ArrayUnique()
	@ArrayMaxSize(7)
	@IsEnum(AgentLanguage, { each: true })
	@Field(() => [AgentLanguage], { nullable: true })
	languages?: AgentLanguage[];
	@IsOptional()
	@IsInt()
	@Min(0)
	@Max(2147483647)
	@Field(() => Int, { nullable: true })
	minCars?: number;
	@IsOptional()
	@IsInt()
	@Min(0)
	@Max(2147483647)
	@Field(() => Int, { nullable: true })
	maxCars?: number;
	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class AgentsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page!: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit!: number;

	@IsOptional()
	@IsIn(availableAgentSorts) // arrayda bor bolganlarni
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@ValidateNested()
	@Type(() => AISearch)
	@Field(() => AISearch)
	search!: AISearch;
}

@InputType()
class MISearch {
	@IsOptional()
	@Field(() => MemberStatus, { nullable: true })
	memberStatus?: MemberStatus;

	@IsOptional()
	@Field(() => MemberType, { nullable: true })
	memberType?: MemberType;

	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class MembersInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page!: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit!: number;

	@IsOptional()
	@IsIn([availableMemberSorts]) // arrayda bor bolganlarni
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => MISearch)
	search!: MISearch;
}
