import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AiChatInput } from '../../libs/dto/ai/ai-chat.input';
import { AiChatResponse } from '../../libs/dto/ai/ai-chat.response';
import { clientOrigins } from '../../libs/config/auth.config';
import { AuthService } from '../auth/auth.service';
import { AiService } from './ai.service';

@Resolver()
export class AiResolver {
	constructor(private readonly ai: AiService, private readonly auth: AuthService) {}

	@Mutation(() => AiChatResponse)
	public async askAiAssistant(@Args('input') input: AiChatInput, @Context('req') request: Request): Promise<AiChatResponse> {
		if (request.method !== 'POST' || request.get('X-Anorcar-Client') !== 'web' ||
			(request.headers.origin && !clientOrigins().includes(request.headers.origin)))
			throw new ForbiddenException('AI request is not allowed.');
		let memberId: string | undefined;
		if (request.headers.authorization) {
			const match = /^Bearer (\S+)$/.exec(request.headers.authorization);
			if (!match) throw new UnauthorizedException('You are not authenticated, please login first!');
			const member = await this.auth.verifyToken(match[1]);
			if (member.memberStatus !== 'ACTIVE') throw new UnauthorizedException('You are not authenticated, please login first!');
			memberId = String(member._id);
		}
		// Ignore untrusted X-Forwarded-For. Configure Express trust proxy only for known proxies.
		const ip = request.ip || request.socket?.remoteAddress || 'unknown';
		return this.ai.ask(input.message, ip, memberId);
	}
}
