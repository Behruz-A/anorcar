import { Mutation, Resolver, Query, Args, Context } from '@nestjs/graphql';
import { MemberService } from './member.service';
import { AgentsInquiry, LoginInput, MemberInput, MembersInquiry } from '../../libs/dto/member/member.input';
import { Member, Members } from '../../libs/dto/member/member';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import type { ObjectId } from 'mongoose';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MemberUpdate } from '../../libs/dto/member/memberr.update';
import { getSerialForImage, shapeIntoMongoObjectId, validMimeTypes } from '../../libs/config';
import { WithoutGuard } from '../auth/guards/without.guard';

import * as path from 'path';
import { Message } from '../../libs/enums/common.enum';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

import { GraphQLUpload, type FileUpload } from 'graphql-upload';
import { AuthSessionService } from '../auth/auth-session.service';
import type { AuthContext } from '../auth/auth.resolver';

@Resolver()
export class MemberResolver {
	constructor(private readonly memberService: MemberService, private readonly authSessionService: AuthSessionService) {}

	@Mutation(() => Member)
	public async signup(@Args('input') input: MemberInput, @Context() context: AuthContext): Promise<Member> {

		this.authSessionService.assertBrowserRequest(context.req);
		const member = await this.memberService.signup(input);
		await this.authSessionService.startSession(member, context.req, context.res);
		return member;
	}

	@Mutation(() => Member)
	public async login(@Args('input') input: LoginInput, @Context() context: AuthContext): Promise<Member> {

		this.authSessionService.assertBrowserRequest(context.req);
		const member = await this.memberService.login(input);
		await this.authSessionService.startSession(member, context.req, context.res);
		return member;
	}

	@Roles(MemberType.USER, MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Query(() => String)
	public async checkAuthRoles(
		@AuthMember() //
		authMember: Member,
	): Promise<string> {

		return `Hi ${authMember.memberNick}, //
		you are${authMember.memberType} (memberId: ${authMember._id})`;
	}

	@UseGuards(AuthGuard)
	@Query(() => String)
	public async checkAuth(
		@AuthMember('memberNick') //
		memberNick: string,
	): Promise<string> {

		return `Hi ${memberNick}`;
	}

	// Authenticated
	@UseGuards(AuthGuard)
	@Mutation(() => Member)
	public async updateMember(
		@Args('input') input: MemberUpdate,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Member> {


		return await this.memberService.updateMember(memberId, input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Member)
	public async getMember(
		@Args('memberId') //
		input: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Member> {

		const targetId = shapeIntoMongoObjectId(input);
		return await this.memberService.getMember(memberId, targetId);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Members)
	public async getAgents(
		@Args('input') //
		input: AgentsInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Members> {

		return await this.memberService.getAgents(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Member)
	public async likeTargetMember(
		@Args('memberId') input: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Member> {

		const likeRefId = shapeIntoMongoObjectId(input);
		return await this.memberService.likeTargetMember(memberId, likeRefId);
	}

	/**ADMIN */

	// Autoration: ADMIN
	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Members)
	public async getAllMembersByAdmin(
		@Args('input') //
		input: MembersInquiry,
	): Promise<Members> {

		return await this.memberService.getAllMembersByAdmin(input);
	}

	// Authenticated
	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Member)
	public async updateMemberByAdmin(
		@Args('input') //
		input: MemberUpdate,
	): Promise<Member> {

		return await this.memberService.updateMemberByAdmin(input);
	}

	/** Existing authenticated upload contract; all files stay inside the three image stores. */
	private assertUploadTarget(target: string): void {
		if (!['member', 'car', 'article'].includes(target)) throw new Error(Message.UPLOAD_FAILED);
	}

	private async storeImage(file: Promise<FileUpload>, target: string): Promise<string> {
		const { createReadStream, filename, mimetype } = await file;
		const extension = path.extname(filename || '').toLowerCase();
		if (!['.jpg', '.jpeg', '.png'].includes(extension) ||
			(!validMimeTypes.includes(mimetype) && mimetype !== 'application/octet-stream'))
			throw new Error(Message.PROVIDE_ALLOWED_FORMAT);
		const url = `uploads/${target}/${getSerialForImage('image' + extension)}`;
		try {
			await pipeline(createReadStream(), createWriteStream(url, { flags: 'wx' }));
		} catch {
			throw new Error(Message.UPLOAD_FAILED);
		}
		return url;
	}

	@UseGuards(AuthGuard)
	@Mutation(() => String)
	public async imageUploader(
		@Args({ name: 'file', type: () => GraphQLUpload }) file: unknown,
		@Args('target') target: string,
	): Promise<string> {
		this.assertUploadTarget(target);
		return this.storeImage(file as Promise<FileUpload>, target);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => [String])
	public async imagesUploader(
		@Args('files', { type: () => [GraphQLUpload] }) files: Promise<FileUpload>[],
		@Args('target') target: string,
	): Promise<string[]> {
		this.assertUploadTarget(target);
		return Promise.all(files.map(file => this.storeImage(file, target)));
	}
}
