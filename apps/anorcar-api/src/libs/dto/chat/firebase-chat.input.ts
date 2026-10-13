import { Field, InputType } from '@nestjs/graphql';
import { Matches } from 'class-validator';

@InputType()
export class FirebaseConversationInput {
	@Field(() => String)
	@Matches(/^[a-fA-F0-9]{24}$/)
	agentId!: string;
}
