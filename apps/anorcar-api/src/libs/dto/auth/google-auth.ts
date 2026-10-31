import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import type { ObjectId } from 'mongoose';
import { AuthTokens } from './auth';

@InputType()
export class GoogleLoginInput {
 @IsString() @MaxLength(200) @Field(() => String) origin!: string;
 @IsOptional() @IsIn(['en', 'kr', 'ru']) @Field(() => String, { nullable: true }) locale?: string;
 @IsOptional() @IsString() @MaxLength(1000) @Field(() => String, { nullable: true }) referrer?: string;
}

@ObjectType()
export class GoogleLoginResult extends AuthTokens {
 @Field(() => String) returnTo!: string;
}

export interface GoogleLoginTicket {
 tokenHash: string;
 browserHash: string;
 memberId: ObjectId;
 origin: string;
 returnTo: string;
 expiresAt: Date;
}
