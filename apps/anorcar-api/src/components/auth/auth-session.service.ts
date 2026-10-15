import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { createHash, randomBytes } from 'crypto';
import type { Request, Response } from 'express';
import { Model, Types } from 'mongoose';
import { AuthTokens, RefreshSession } from '../../libs/dto/auth/auth';
import { Member } from '../../libs/dto/member/member';
import { MemberStatus } from '../../libs/enums/member.enum';
import {
	clientOrigins,
	refreshCookieOptions,
	REFRESH_COOKIE_NAME,
	REFRESH_TOKEN_MILLISECONDS,
} from '../../libs/config/auth.config';
import { AuthService } from './auth.service';

@Injectable()
export class AuthSessionService {
	constructor(
		@InjectModel('RefreshSession') private readonly sessionModel: Model<RefreshSession>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		private readonly authService: AuthService,
	) {}

	public assertBrowserRequest(req: Request): void {
		const origin = req.headers.origin;
		if (
			req.method !== 'POST' ||
			req.headers['x-anorcar-client'] !== 'web' ||
			(origin && !clientOrigins().includes(origin))
		) {
			throw new ForbiddenException('Untrusted authentication request');
		}
	}

	private readCookie(req: Request): string | undefined {
		return req.headers.cookie
			?.split(';')
			.map((value) => value.trim())
			.find((value) => value.startsWith(REFRESH_COOKIE_NAME + '='))
			?.slice(REFRESH_COOKIE_NAME.length + 1);
	}
	private hash(token: string): string {
		return createHash('sha256').update(token).digest('hex');
	}
	private parse(token?: string): { id: string; hash: string } | null {
		if (!token || !/^[a-f0-9]{24}\.[A-Za-z0-9_-]{43}$/.test(token)) return null;
		return { id: token.split('.')[0], hash: this.hash(token) };
	}
	private setCookie(res: Response, token: string, expiresAt: Date): void {
		res.cookie(REFRESH_COOKIE_NAME, token, {
			...refreshCookieOptions(),
			maxAge: Math.max(0, expiresAt.getTime() - Date.now()),
		});
	}
	private rejectSession(res: Response): never {
		res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
		throw new UnauthorizedException('REFRESH_SESSION_EXPIRED');
	}
	private async revokeKnownToken(token: { id: string; hash: string }): Promise<void> {
		await this.sessionModel
			.findOneAndUpdate(
				{ _id: token.id, $or: [{ tokenHash: token.hash }, { usedTokenHashes: token.hash }] },
				{ $set: { revokedAt: new Date() } },
			)
			.exec();
	}

	public async startSession(member: Member, req: Request, res: Response): Promise<void> {
		this.assertBrowserRequest(req);
		const previous = this.parse(this.readCookie(req));
		if (previous) await this.revokeKnownToken(previous);
		const id = new Types.ObjectId();
		const rawToken = id.toString() + '.' + randomBytes(32).toString('base64url');
		const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MILLISECONDS);
		await this.sessionModel.create({ _id: id, memberId: member._id, tokenHash: this.hash(rawToken), expiresAt });
		this.setCookie(res, rawToken, expiresAt);
	}

	public async refreshAccessToken(req: Request, res: Response): Promise<AuthTokens> {
		this.assertBrowserRequest(req);
		const token = this.parse(this.readCookie(req));
		if (!token) return this.rejectSession(res);
		const now = new Date();
		const session = await this.sessionModel
			.findOne({ _id: token.id, tokenHash: token.hash, revokedAt: null, expiresAt: { $gt: now } })
			.exec();
		if (!session) {
			// A proven old token invalidates its session; a guessed ID cannot revoke a session.
			await this.revokeKnownToken(token);
			return this.rejectSession(res);
		}
		const member = await this.memberModel.findOne({ _id: session.memberId, memberStatus: MemberStatus.ACTIVE }).exec();
		if (!member) {
			await this.revokeKnownToken(token);
			return this.rejectSession(res);
		}
		const accessToken = await this.authService.createToken(member);
		const nextToken = token.id + '.' + randomBytes(32).toString('base64url');
		const rotated = await this.sessionModel
			.findOneAndUpdate(
				{ _id: token.id, tokenHash: token.hash, revokedAt: null, expiresAt: { $gt: new Date() } },
				{ $set: { tokenHash: this.hash(nextToken) }, $push: { usedTokenHashes: token.hash } },
				{ new: true },
			)
			.exec();
		if (!rotated) {
			await this.revokeKnownToken(token);
			return this.rejectSession(res);
		}
		this.setCookie(res, nextToken, rotated.expiresAt);
		return { accessToken };
	}

	public async logout(req: Request, res: Response): Promise<boolean> {
		this.assertBrowserRequest(req);
		const token = this.parse(this.readCookie(req));
		if (token) await this.revokeKnownToken(token);
		res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
		return true;
	}
}
