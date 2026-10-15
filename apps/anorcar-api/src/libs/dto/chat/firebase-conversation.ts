import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class FirebaseConversation {
	@Field(() => String)
	conversationId!: string;
	@Field(() => String)
	customerId!: string;
	@Field(() => String)
	agentId!: string;
	@Field(() => Float)
	createdAt!: number;
}

export interface FirebaseConversationRecord {
	customerId: string;
	agentId: string;
	createdAt: number;
	participants: Record<string, true>;
}
