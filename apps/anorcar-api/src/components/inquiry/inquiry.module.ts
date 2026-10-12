import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import InquirySchema from '../../schemas/Inquiry.model';
import { AuthModule } from '../auth/auth.module';
import { InquiryResolver } from './inquiry.resolver';
import { InquiryService } from './inquiry.service';

@Module({
	imports: [MongooseModule.forFeature([{ name: 'Inquiry', schema: InquirySchema }]), AuthModule],
	providers: [InquiryResolver, InquiryService],
	exports: [InquiryService],
})
export class InquiryModule {}
