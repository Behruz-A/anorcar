import { BadRequestException, ForbiddenException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { ObjectId } from 'mongoose';
import { Member } from '../../libs/dto/member/member';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { FirebaseConversation, FirebaseConversationRecord } from '../../libs/dto/chat/firebase-conversation';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class ChatService {
	constructor(
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		private readonly firebase: FirebaseService,
	) {}

	private uid(id: ObjectId | string): string {
		const value = id?.toString();
		if (!value || !/^[a-fA-F0-9]{24}$/.test(value)) throw new BadRequestException('Invalid chat member ID');
		return value.toLowerCase();
	}

	private async activeMember(uid: string): Promise<Member> {
		const member = await this.memberModel
			.findOne({ _id: new Types.ObjectId(uid), memberStatus: MemberStatus.ACTIVE })
			.exec();
		if (!member || ![MemberType.USER, MemberType.AGENT].includes(member.memberType))
			throw new ForbiddenException('Chat requires an active customer or agent');
		return member;
	}

	public async createFirebaseChatToken(memberId: ObjectId): Promise<string> {
		const uid = this.uid(memberId);
		await this.activeMember(uid);
		try {
			return await this.firebase.createChatToken(uid);
		} catch {
			throw new ServiceUnavailableException('Live Chat is temporarily unavailable');
		}
	}

	public async createConversation(memberId: ObjectId, targetAgentId: string): Promise<FirebaseConversation> {
		const customerId = this.uid(memberId);
		const agentId = this.uid(targetAgentId);
		const customer = await this.activeMember(customerId);
		if (customer.memberType !== MemberType.USER || customerId === agentId)
			throw new ForbiddenException('Only customers can open agent conversations');
		const agent = await this.activeMember(agentId);
		if (agent.memberType !== MemberType.AGENT) throw new ForbiddenException('Select an active agent');
		const conversationId = `${customerId}_${agentId}`;
		const record: FirebaseConversationRecord = {
			customerId,
			agentId,
			createdAt: Date.now(),
			participants: { [customerId]: true, [agentId]: true },
		};
		try {
			// Transaction prevents concurrent requests from resetting existing metadata.
			const result = await this.firebase.database
				.ref(`conversations/${conversationId}`)
				.transaction((current: FirebaseConversationRecord | null) => current ?? record);
			const stored: FirebaseConversationRecord = result.snapshot.val();
			if (!result.committed || !this.matches(stored, customerId, agentId)) throw new Error('Invalid conversation');
			// Atomic fan-out of both indexes; retries repair indexes after a transient failure.
			await this.firebase.database.ref().update({
				[`userConversations/${customerId}/${conversationId}`]: { otherMemberId: agentId, createdAt: stored.createdAt },
				[`userConversations/${agentId}/${conversationId}`]: { otherMemberId: customerId, createdAt: stored.createdAt },
			});
			return { conversationId, customerId, agentId, createdAt: stored.createdAt };
		} catch {
			throw new ServiceUnavailableException('Live Chat is temporarily unavailable');
		}
	}

	private matches(record: FirebaseConversationRecord | null, customerId: string, agentId: string): boolean {
		return (
			!!record &&
			record.customerId === customerId &&
			record.agentId === agentId &&
			Number.isFinite(record.createdAt) &&
			!!record.participants &&
			Object.keys(record.participants).length === 2 &&
			record.participants[customerId] === true &&
			record.participants[agentId] === true
		);
	}

	public async authorizeConversation(memberId: ObjectId, conversationId: string): Promise<FirebaseConversation> {
		const uid = this.uid(memberId);
		const member = await this.activeMember(uid);
		if (!/^[a-f0-9]{24}_[a-f0-9]{24}$/.test(conversationId)) throw new BadRequestException('Invalid conversation ID');
		let record: FirebaseConversationRecord | null;
		try {
			record = (await this.firebase.database.ref(`conversations/${conversationId}`).get()).val();
		} catch {
			throw new ServiceUnavailableException('Live Chat is temporarily unavailable');
		}
		const [customerId, agentId] = conversationId.split('_');
		if (
			!this.matches(record, customerId, agentId) ||
			!record ||
			record.participants[uid] !== true ||
			(uid === customerId && member.memberType !== MemberType.USER) ||
			(uid === agentId && member.memberType !== MemberType.AGENT)
		)
			throw new ForbiddenException('Conversation access denied');
		return { conversationId, customerId, agentId, createdAt: record.createdAt };
	}
}
