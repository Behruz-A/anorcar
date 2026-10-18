// comment.service.ts
import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { MemberService } from '../member/member.service';
import { CarService } from '../car/car.service';
import { BoardArticleService } from '../board-article/board-article.service';
import { CommentInput, CommentsInquiry } from '../../libs/dto/comment/comment.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { CommentGroup, CommentStatus } from '../../libs/enums/comment.enum';
import { CommentUpdate } from '../../libs/dto/comment/comment.update';
import { Comment, Comments } from '../../libs/dto/comment/comment';
import { lookupMember } from '../../libs/config';
import { T } from '../../libs/types/common';

@Injectable()
export class CommentService {
	constructor(
		@InjectModel('Comment') private readonly commentModel: Model<Comment>,
		private readonly memberService: MemberService,
		private readonly carService: CarService,
		private readonly boardArticleService: BoardArticleService,
	) {}

	public async createComment(memberId: ObjectId, input: CommentInput): Promise<Comment> {
		input.memberId = memberId;

		let result: Comment | null = null;
		try {
			result = await this.commentModel.create(input);
		} catch (err) {

			throw new BadRequestException(Message.CREATE_FAILED);
		}

		await this.updateTargetCount(input, 1);

		if (!result) throw new InternalServerErrorException(Message.CREATE_FAILED);
		return result;
	}

	private async updateTargetCount(comment: Pick<Comment, 'commentGroup' | 'commentRefId'>, modifier: number): Promise<void> {
		switch (comment.commentGroup) {
			case CommentGroup.CAR:
				await this.carService.carStatsEditor({
					_id: comment.commentRefId,
					targetKey: 'carComments',
					modifier,
				});
				break;
			case CommentGroup.ARTICLE:
				await this.boardArticleService.boardArticleStatsEditor({
					_id: comment.commentRefId,
					targetKey: 'articleComments',
					modifier,
				});
				break;
			case CommentGroup.MEMBER:
				await this.memberService.memberStatsEditor({
					_id: comment.commentRefId,
					targetKey: 'memberComments',
					modifier,
				});
				break;
		}

	}

	public async updateComment(memberId: ObjectId, input: CommentUpdate): Promise<Comment> {
		const { _id } = input;
		const result = await this.commentModel
			.findOneAndUpdate(
				{
					_id: _id,
					memberId: memberId,
					commentStatus: CommentStatus.ACTIVE,
				},
				input,
				{
					new: true,
				},
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		if (result.commentStatus === CommentStatus.DELETE) await this.updateTargetCount(result, -1);
		return result;
	}

	public async getComments(memberId: ObjectId, input: CommentsInquiry): Promise<Comments> {
		const { commentRefId } = input.search;
		const match: T = { commentRefId: commentRefId, commentStatus: CommentStatus.ACTIVE };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		const result: Comments[] = await this.commentModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				lookupMember,
				{ $unwind: '$memberData' },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							// meLiked
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async removeCommentByAdmin(input: ObjectId): Promise<Comment> {
		const result = await this.commentModel.findByIdAndDelete(input).exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
		if (result.commentStatus === CommentStatus.ACTIVE) await this.updateTargetCount(result, -1);
		return result;
	}
}
