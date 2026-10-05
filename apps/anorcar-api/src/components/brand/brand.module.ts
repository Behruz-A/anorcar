import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import BrandSchema from '../../schemas/Brand.model';
import { AuthModule } from '../auth/auth.module';
import { BrandResolver } from './brand.resolver';
import { BrandService } from './brand.service';

@Module({
	imports: [MongooseModule.forFeature([{ name: 'Brand', schema: BrandSchema }]), AuthModule],
	providers: [BrandResolver, BrandService],
	exports: [BrandService],
})
export class BrandModule {}
