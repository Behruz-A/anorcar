import { Field, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';

@ObjectType()
export class AuthTokens {
	@Field(() => String) accessToken!: string;
}

// Refresh credentials never become GraphQL fields or member properties.
export interface RefreshSession {
	_id: ObjectId;
	memberId: ObjectId;
	tokenHash: string;
	usedTokenHashes: string[];
	expiresAt: Date;
	revokedAt: Date | null;
}
