import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { View } from '../../libs/dto/view/view';
import { ViewInput } from '../../libs/dto/view/view.input';
import { T } from '../../libs/types/common';
import { Cars } from '../../libs/dto/car/car';
import { OrdinaryInquiry } from '../../libs/dto/car/car.input';
import { ViewGroup } from '../../libs/enums/view.enum';
import { lookupVisit, lookupVisitBrand } from '../../libs/config';
import { CarStatus } from '../../libs/enums/car.enum';

@Injectable()
export class ViewService {
	constructor(@InjectModel('View') private readonly viewModel: Model<View>) {}
	public async recordView(input: ViewInput): Promise<View | null> {
		const viewExist = await this.checkViewExistence(input);
		if (!viewExist) {
			console.log('- New View Insert -');
			return await this.viewModel.create(input);
		} else return null;
	}
	private async checkViewExistence(input: ViewInput): Promise<View | null> {
		const { memberId, viewRefId } = input;
		const search: T = { memberId: memberId, viewRefId: viewRefId };
		return await this.viewModel.findOne(search).exec();
	}

	public async getVisitedCars(memberId: ObjectId, input: OrdinaryInquiry): Promise<Cars> {
		const { page, limit } = input;

		const match: T = { viewGroup: ViewGroup.CAR, memberId: memberId };

		const data: T = await this.viewModel
			.aggregate([
				{ $match: match },
				{ $sort: { updatedAt: -1 } },

				{
					$lookup: {
						from: 'cars',
						localField: 'viewRefId',
						foreignField: '_id',
						as: 'visitedCar',
					},
				},

				{
					$unwind: '$visitedCar',
				},
				{ $match: { 'visitedCar.carStatus': CarStatus.ACTIVE } },

				{
					$facet: {
						list: [
							{ $skip: (page - 1) * limit },
							{ $limit: limit },

							lookupVisit,
							{ $unwind: '$visitedCar.memberData' },
							lookupVisitBrand,
							{ $unwind: '$visitedCar.brandData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		console.log('data', data);

		const result: Cars = { list: [], metaCounter: data[0].metaCounter };

		result.list = data[0].list.map((ele) => ele.visitedCar);
		console.log('result', result);

		return result;
	}
}
