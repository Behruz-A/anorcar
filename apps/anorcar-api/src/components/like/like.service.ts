import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Like, MeLiked } from '../../libs/dto/like/like';
import { Model, ObjectId } from 'mongoose';
import { LikeInput } from '../../libs/dto/like/like.input';
import { T } from '../../libs/types/common';
import { Message } from '../../libs/enums/common.enum';
import { OrdinaryInquiry } from '../../libs/dto/car/car.input';
import { Cars } from '../../libs/dto/car/car';
import { LikeGroup } from '../../libs/enums/like.enum';
import { lookupFavorite, lookupFavoriteBrand } from '../../libs/config';
import { CarStatus } from '../../libs/enums/car.enum';
@Injectable()
export class LikeService {
	constructor(@InjectModel('Like') private readonly likeModel: Model<Like>) {}

	public async toggleLike(input: LikeInput): Promise<number> {
		const search: T = { memberId: input.memberId, likeRefId: input.likeRefId },
			exist = await this.likeModel.findOne(search).exec();

		let modifier = 1;

		if (exist) {
			const removed = await this.likeModel.findOneAndDelete(search).exec();
			modifier = removed ? -1 : 0;
		} else {
			try {
				await this.likeModel.create(input);
			} catch (err) {
				// Another request may have inserted the same unique viewer/target pair.
				if (typeof err === 'object' && err !== null && 'code' in err && err.code === 11000) return 0;

				throw new BadRequestException(Message.CREATE_FAILED);
			}
		}

		return modifier;
	}

	public async checkLikeExistence(input: LikeInput): Promise<MeLiked[]> {
		const { memberId, likeRefId } = input;
		const result = await this.likeModel.findOne({ memberId: memberId, likeRefId: likeRefId }).exec();

		return result ? [{ memberId: memberId, likeRefId: likeRefId, myFavorite: true }] : [];
	}

	public async getFavoriteCars(memberId: ObjectId, input: OrdinaryInquiry): Promise<Cars> {
		const { page, limit } = input;

		const match: T = { likeGroup: LikeGroup.CAR, memberId: memberId };

		const data: T = await this.likeModel
			.aggregate([
				{ $match: match },
				{ $sort: { updatedAt: -1 } },

				{
					$lookup: {
						from: 'cars',
						localField: 'likeRefId',
						foreignField: '_id',
						as: 'favoriteCar',
					},
				},

				{
					$unwind: '$favoriteCar',
				},
				{ $match: { 'favoriteCar.carStatus': CarStatus.ACTIVE } },

				lookupFavorite,
				{ $unwind: '$favoriteCar.memberData' },
				lookupFavoriteBrand,
				{ $unwind: '$favoriteCar.brandData' },
				{
					$facet: {
						list: [
							{ $skip: (page - 1) * limit },
							{ $limit: limit },

						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		const result: Cars = { list: [], metaCounter: data[0].metaCounter };

		result.list = data[0].list.map((ele) => ele.favoriteCar);

		return result;
	}
}
