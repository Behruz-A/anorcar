import { Field, InputType } from '@nestjs/graphql';
import { IsString, Length, Matches } from 'class-validator';

@InputType()
export class AiChatInput {
	@IsString()
	@Length(1, 1000)
	@Matches(/\S/)
	@Field(() => String)
	message!: string;
}
