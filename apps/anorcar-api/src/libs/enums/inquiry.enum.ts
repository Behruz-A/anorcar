import { registerEnumType } from '@nestjs/graphql';

export enum InquirySubject {
	BUYING_CAR = 'BUYING_CAR',
	SELLING_CAR = 'SELLING_CAR',
	MY_ACCOUNT = 'MY_ACCOUNT',
	TECHNICAL_SUPPORT = 'TECHNICAL_SUPPORT',
	COMMUNITY = 'COMMUNITY',
}
export enum InquiryStatus {
	NEW = 'NEW',
	READ = 'READ',
	CLOSED = 'CLOSED',
}
registerEnumType(InquirySubject, { name: 'InquirySubject' });
registerEnumType(InquiryStatus, { name: 'InquiryStatus' });
