import { Schema } from 'mongoose';

const RefreshSessionSchema = new Schema(
	{
		memberId: { type: Schema.Types.ObjectId, required: true, ref: 'Member', index: true },
		tokenHash: { type: String, required: true },
		usedTokenHashes: { type: [String], default: [] },
		expiresAt: { type: Date, required: true },
		revokedAt: { type: Date, default: null },
	},
	{ collection: 'refreshSessions', timestamps: true },
);
RefreshSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export default RefreshSessionSchema;
