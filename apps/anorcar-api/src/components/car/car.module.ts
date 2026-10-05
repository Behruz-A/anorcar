import { Module } from '@nestjs/common';
import { CarResolver } from './car.resolver';
import { CarService } from './car.service';
import { AuthModule } from '../auth/auth.module';
import CarSchema from '../../schemas/Car.model';
import { MongooseModule } from '@nestjs/mongoose';
import { ViewModule } from '../view/view.module';
import { MemberModule } from '../member/member.module';
import { LikeModule } from '../like/like.module';
import { BrandModule } from '../brand/brand.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{
				name: 'Car',
				schema: CarSchema,
			},
		]),
		AuthModule,
		ViewModule,
		MemberModule,
		LikeModule,
		BrandModule,
	],
	providers: [CarResolver, CarService],
	exports: [CarService],
})
export class CarModule {}
