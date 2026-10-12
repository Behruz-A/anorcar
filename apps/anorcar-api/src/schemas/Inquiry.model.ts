import { Schema } from 'mongoose';
import { InquiryStatus, InquirySubject } from '../libs/enums/inquiry.enum';

const InquirySchema = new Schema(
	{
		memberId: { type: Schema.Types.ObjectId, required: true, ref: 'Member', immutable: true },
		inquiryName: { type: String, required: true, trim: true, maxlength: 80 },
		inquiryEmail: { type: String, required: true, trim: true, maxlength: 120 },
		inquirySubject: { type: String, required: true, enum: InquirySubject },
		inquiryMessage: { type: String, required: true, trim: true, maxlength: 1500 },
		inquiryStatus: { type: String, required: true, enum: InquiryStatus, default: InquiryStatus.NEW },
	},
	{ collection: 'inquiries', timestamps: true },
);
InquirySchema.index({ createdAt: -1, _id: -1 });
InquirySchema.index({ inquiryStatus: 1, createdAt: -1, _id: -1 });
export default InquirySchema;
