import { registerEnumType } from '@nestjs/graphql';

export enum MemberType {
	USER = 'USER',
	AGENT = 'AGENT',
	ADMIN = 'ADMIN',
}

registerEnumType(MemberType, { name: 'MemberType' });

export enum MemberStatus {
	ACTIVE = 'ACTIVE',
	BLOCK = 'BLOCK',
	DELETE = 'DELETE',
}

registerEnumType(MemberStatus, { name: 'MemberStatus' });

export enum MemberAuthType {
	PHONE = 'PHONE',
	EMAIL = 'EMAIL',
	TELEGRAM = 'TELEGRAM',
}

registerEnumType(MemberAuthType, { name: 'MemberAuthType' });

export enum AgentType {
	DEALERSHIP = 'DEALERSHIP',
	INDEPENDENT = 'INDEPENDENT',
}
registerEnumType(AgentType, { name: 'AgentType' });
export enum AgentLanguage {
	ENGLISH = 'ENGLISH',
	KOREAN = 'KOREAN',
	RUSSIAN = 'RUSSIAN',
	UZBEK = 'UZBEK',
	CHINESE = 'CHINESE',
	JAPANESE = 'JAPANESE',
	ARABIC = 'ARABIC',
}
registerEnumType(AgentLanguage, { name: 'AgentLanguage' });
