import { Schema } from 'mongoose';

const GoogleLoginTicketSchema = new Schema({
 tokenHash: { type: String, required: true, unique: true },
 browserHash: { type: String, required: true },
 memberId: { type: Schema.Types.ObjectId, required: true, ref: 'Member' },
 origin: { type: String, required: true },
 returnTo: { type: String, required: true },
 expiresAt: { type: Date, required: true },
}, { collection: 'googleLoginTickets' });
GoogleLoginTicketSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export default GoogleLoginTicketSchema;
