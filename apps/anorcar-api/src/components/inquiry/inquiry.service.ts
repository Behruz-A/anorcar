import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, ObjectId } from 'mongoose';
import { Inquiry, Inquiries } from '../../libs/dto/inquiry/inquiry';
import { AllInquiriesInquiry, InquiryInput, InquiryUpdate } from '../../libs/dto/inquiry/inquiry.input';
import { InquiryStatus } from '../../libs/enums/inquiry.enum';
import { Message } from '../../libs/enums/common.enum';

@Injectable()
export class InquiryService {
	constructor(@InjectModel('Inquiry') private readonly inquiryModel: Model<Inquiry>) {}

	public async createInquiry(memberId: ObjectId, input: InquiryInput): Promise<Inquiry> {
		try {
			return await this.inquiryModel.create({
				memberId,
				inquiryName: input.inquiryName.trim(),
				inquiryEmail: input.inquiryEmail.trim(),
				inquirySubject: input.inquirySubject,
				inquiryMessage: input.inquiryMessage.trim(),
				inquiryStatus: InquiryStatus.NEW,
			});
		} catch {
			throw new InternalServerErrorException(Message.CREATE_FAILED);
		}
	}

	public async getAllInquiriesByAdmin(input: AllInquiriesInquiry): Promise<Inquiries> {
		const match: FilterQuery<Inquiry> = {};
		if (input.inquiryStatus) match.inquiryStatus = input.inquiryStatus;
		if (input.text?.trim()) {
			const text = input.text.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			match.$or = ['inquiryName', 'inquiryEmail', 'inquiryMessage'].map((field) => ({
				[field]: { $regex: text, $options: 'i' },
			}));
		}
		const [result] = await this.inquiryModel
			.aggregate<Inquiries>([
				{ $match: match },
				{ $sort: { createdAt: -1, _id: -1 } },
				{
					$facet: {
						list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		return result ?? { list: [], metaCounter: [] };
	}

	public async updateInquiryByAdmin(input: InquiryUpdate): Promise<Inquiry> {
		const result = await this.inquiryModel
			.findByIdAndUpdate(
				input._id,
				{ $set: { inquiryStatus: input.inquiryStatus } },
				{ new: true, runValidators: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result;
	}
}
