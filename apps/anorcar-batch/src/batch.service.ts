import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Car } from '../../anorcar-api/src/libs/dto/car/car';
import { Model } from 'mongoose';
import { Member } from '../../anorcar-api/src/libs/dto/member/member';
import { CarStatus } from '../../anorcar-api/src/libs/enums/car.enum';
import { MemberStatus, MemberType } from '../../anorcar-api/src/libs/enums/member.enum';

@Injectable()
export class BatchService {
	constructor(
		@InjectModel('Car') private readonly carModel: Model<Car>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
	) {}

	public async batchRollback(): Promise<void> {
		await this.carModel
			.updateMany(
				{
					carStatus: CarStatus.ACTIVE,
				},
				{ carRank: 0 },
			)
			.exec();

		await this.memberModel
			.updateMany(
				{
					memberStatus: MemberStatus.ACTIVE,
					memberType: MemberType.AGENT,
				},
				{ memberRank: 0 },
			)
			.exec();
	}

	// recreate uploads

	public async batchTopCars(): Promise<void> {
		const cars: Car[] = await this.carModel
			.find({
				carStatus: CarStatus.ACTIVE,
				carRank: 0,
			})
			.exec();

		const promisedList = cars.map(async (ele: Car) => {
			const { _id, carLikes, carViews } = ele;
			const rank = carLikes * 2 + carViews * 1;
			return await this.carModel.findOneAndUpdate(_id, { carRank: rank });
		});
		await Promise.all(promisedList);
	}

	public async batchTopAgents(): Promise<void> {
		const agents: Member[] = await this.memberModel
			.find({
				memberType: MemberType.AGENT,
				memberStatus: MemberStatus.ACTIVE,
				memberRank: 0,
			})
			.exec();

		const promisedList = agents.map(async (ele: Member) => {
			const { _id, memberCars, memberLikes, memberArticles, memberViews } = ele;
			const rank = memberCars * 5 + memberArticles * 3 + memberLikes * 2 + memberViews * 1;
			return await this.memberModel.findByIdAndUpdate(_id, { memberRank: rank });
		});
		await Promise.all(promisedList);
	}

	getHello(): string {
		return 'Welcome to BATCH Server!';
	}
}
