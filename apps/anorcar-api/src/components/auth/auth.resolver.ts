import { Context, Mutation, Resolver } from '@nestjs/graphql';
import type { Request, Response } from 'express';
import { AuthTokens } from '../../libs/dto/auth/auth';
import { AuthSessionService } from './auth-session.service';

export interface AuthContext {
	req: Request;
	res: Response;
}

@Resolver()
export class AuthResolver {
	constructor(private readonly authSessionService: AuthSessionService) {}
	@Mutation(() => AuthTokens)
	public async refreshAccessToken(@Context() context: AuthContext): Promise<AuthTokens> {
		return this.authSessionService.refreshAccessToken(context.req, context.res);
	}
	@Mutation(() => Boolean)
	public async logout(@Context() context: AuthContext): Promise<boolean> {
		return this.authSessionService.logout(context.req, context.res);
	}
}
