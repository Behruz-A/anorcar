import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { FirebaseConversationInput } from '../../libs/dto/chat/firebase-chat.input';
import { FirebaseConversation } from '../../libs/dto/chat/firebase-conversation';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { ChatService } from './chat.service';

@Resolver()
@UseGuards(AuthGuard)
export class ChatResolver {
	constructor(private readonly chatService: ChatService) {}

	@Mutation(() => String)
	public createFirebaseChatToken(@AuthMember('_id') memberId: ObjectId): Promise<string> {
		return this.chatService.createFirebaseChatToken(memberId);
	}

	@Mutation(() => FirebaseConversation)
	public createFirebaseConversation(
		@Args('input') input: FirebaseConversationInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<FirebaseConversation> {
		return this.chatService.createConversation(memberId, input.agentId);
	}

	@Query(() => FirebaseConversation)
	public getFirebaseConversation(
		@Args('conversationId') conversationId: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<FirebaseConversation> {
		return this.chatService.authorizeConversation(memberId, conversationId);
	}
}
