import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Member, Members } from '../../libs/dto/member/member';
import { AgentsInquiry, LoginInput, MemberInput, MembersInquiry } from '../../libs/dto/member/member.input';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { AuthService } from '../auth/auth.service';
import { MemberUpdate } from '../../libs/dto/member/memberr.update';
import { StatisticModifier, T } from '../../libs/types/common';
import { ViewService } from '../view/view.service';
import { ViewInput } from '../../libs/dto/view/view.input';
import { ViewGroup } from '../../libs/enums/view.enum';
import { LikeInput } from '../../libs/dto/like/like.input';
import { LikeGroup } from '../../libs/enums/like.enum';
import { LikeService } from '../like/like.service';
import { Follower, Following, MeFollowed } from '../../libs/dto/follow/follow';
import { lookupAuthMemberLiked, lookupAuthMemberFollowed, literalSearchRegex } from '../../libs/config';

@Injectable()
export class MemberService {
	constructor(
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		@InjectModel('Follow') private readonly followModel: Model<Follower | Following>,
		private authService: AuthService,
		private viewService: ViewService,
		private readonly likeService: LikeService,
	) {}
	public async signup(input: MemberInput): Promise<Member> {
		if (input.memberType != null && ![MemberType.USER, MemberType.AGENT].includes(input.memberType))
			throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		input.memberPassword = await this.authService.hashPassword(input.memberPassword);

		try {
			const result = await this.memberModel.create(input);

			result.accessToken = await this.authService.createToken(result);

			return result;
		} catch (err: any) {

			throw new BadRequestException(Message.USED_MEMBER_NICK_OR_PHONE);
		}
	}

	public async login(input: LoginInput): Promise<Member> {
		const { memberNick } = input;

		const response: Member = (await this.memberModel
			.findOne({ memberNick: memberNick })
			.select('+memberPassword')
			.exec()) as Member;

		if (!response || response.memberStatus === MemberStatus.DELETE) {
			throw new InternalServerErrorException(Message.NO_MEMBER_NICK);
		} else if (response.memberStatus === MemberStatus.BLOCK) {
			throw new InternalServerErrorException(Message.BLOCKED_USER);
		}

		if (!response.memberPassword) {
			throw new InternalServerErrorException('Member password does not exist');
		}

		const isMatch = await this.authService.comparePasswords(input.memberPassword, response.memberPassword);
		if (!isMatch) throw new InternalServerErrorException(Message.WRONG_PASSWORD);

		response.accessToken = await this.authService.createToken(response);

		return response;
	}

	public async updateMember(memberId: ObjectId, input: MemberUpdate): Promise<Member> {
		if (String(input._id) !== String(memberId) || input.memberType !== undefined || input.memberStatus !== undefined)
			throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		const update = await this.memberUpdateFields(input);
		const result = (await this.memberModel
			.findOneAndUpdate({ _id: memberId, memberStatus: MemberStatus.ACTIVE }, update, { new: true })
			.exec()) as Member;
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		result.accessToken = await this.authService.createToken(result);

		return result;
	}

	public async getMember(memberId: ObjectId | null, targetId: ObjectId): Promise<Member> {
		const search: T = {
			_id: targetId,
			memberStatus: {
				$in: [MemberStatus.ACTIVE, MemberStatus.BLOCK],
			},
		};

		let targetMember = await this.memberModel.findOne(search).exec();

		if (!targetMember) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		if (memberId) {
			//view
			//increase

			const viewInput: ViewInput = { memberId: memberId, viewRefId: targetId, viewGroup: ViewGroup.MEMBER };

			const newView = await this.viewService.recordView(viewInput);

			if (newView) {
				await this.memberModel.findOneAndUpdate(search, { $inc: { memberViews: 1 } }, { new: true }).exec();
				targetMember.memberViews++;
			}
			//Liked
			const likeInput = { memberId: memberId, likeRefId: targetId, likeGroup: LikeGroup.MEMBER };
			targetMember.meLiked = await this.likeService.checkLikeExistence(likeInput);

			//Follow
			targetMember.meFollowed = await this.checkSubscription(memberId, targetId);
		}

		return targetMember;
	}

	private async checkSubscription(followerId: ObjectId, followingId: ObjectId): Promise<MeFollowed[]> {
		const result = await this.followModel
			.findOne({
				followerId: followerId,
				followingId: followingId,
			})
			.exec();

		return result ? [{ followerId: followerId, followingId: followingId, myFollowing: true }] : [];
	}

	public async getAgents(memberId: ObjectId, input: AgentsInquiry): Promise<Members> {
		const { text, location, agentTypes, languages, minCars, maxCars } = input.search;
		const match: T = { memberType: MemberType.AGENT, memberStatus: MemberStatus.ACTIVE };
		const sort: T = { [input?.sort ?? 'createdAt']: input.direction ?? Direction.DESC };

		if (text)
			match.$or = ['memberNick', 'memberFullName', 'memberAddress', 'memberDesc'].map((field) => ({
				[field]: { $regex: literalSearchRegex(text) },
			}));
		if (location) match.memberAddress = { $regex: new RegExp(location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') };
		if (agentTypes?.length) match.agentType = { $in: agentTypes };
		if (languages?.length) match.agentLanguages = { $all: languages };
		if (minCars != null && maxCars != null && minCars > maxCars)
			throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		if (minCars != null || maxCars != null)
			match.memberCars = {
				...(minCars != null ? { $gte: minCars } : {}),
				...(maxCars != null ? { $lte: maxCars } : {}),
			};

		const result = await this.memberModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupAuthMemberLiked(memberId),
							lookupAuthMemberFollowed({ followerId: memberId, followingId: '$_id' }),
						],

						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result[0];
	}

	public async likeTargetMember(memberId: ObjectId, likeRefId: ObjectId): Promise<Member> {
		const target = await this.memberModel.findOne({ _id: likeRefId, memberStatus: MemberStatus.ACTIVE }).exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		const input: LikeInput = {
			memberId: memberId,
			likeRefId: likeRefId,
			likeGroup: LikeGroup.MEMBER,
		};

		// Toggle
		const modifier: number = await this.likeService.toggleLike(input);

		const result = await this.memberStatsEditor({
			_id: likeRefId,
			targetKey: 'memberLikes',
			modifier: modifier,
		});
		if (!result) throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);
		return result;
	}

	public async getAllMembersByAdmin(input: MembersInquiry): Promise<Members> {
		const { memberStatus, memberType, text } = input.search;
		const match: T = {};
		const sort: T = { [input?.sort ?? 'createdAt']: input.direction ?? Direction.DESC };

		if (memberStatus) match.memberStatus = memberStatus;
		if (memberType) match.memberType = memberType;
		if (text) match.memberNick = { $regex: literalSearchRegex(text) };

		const result = await this.memberModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result[0];
	}

	private async memberUpdateFields(input: MemberUpdate): Promise<Partial<MemberUpdate>> {
		const update: Partial<MemberUpdate> = { ...input };
		delete update._id;
		if (update.memberPassword !== undefined) update.memberPassword = await this.authService.hashPassword(update.memberPassword);
		return update;
	}

	public async updateMemberByAdmin(input: MemberUpdate): Promise<Member> {
		const update = await this.memberUpdateFields(input);
		const result = (await this.memberModel.findOneAndUpdate({ _id: input._id }, update, { new: true }).exec()) as Member;
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		return result;
	}

	public async memberStatsEditor(input: StatisticModifier): Promise<Member> {
		const { _id, targetKey, modifier } = input;
		const result = await this.memberModel
			.findOneAndUpdate({ _id }, { $inc: { [targetKey]: modifier } }, { new: true })
			.exec();

		if (!result) {
			throw new InternalServerErrorException(Message.UPDATE_FAILED);
		}

		return result;
	}
}
