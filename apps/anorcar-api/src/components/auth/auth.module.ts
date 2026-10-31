import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import MemberSchema from '../../schemas/Member.model';
import RefreshSessionSchema from '../../schemas/RefreshSession.model';
import { ACCESS_TOKEN_SECONDS } from '../../libs/config/auth.config';
import { AuthSessionService } from './auth-session.service';
import { AuthResolver } from './auth.resolver';
import GoogleLoginTicketSchema from '../../schemas/GoogleLoginTicket.model';
import { GoogleAuthService } from './google-auth.service';
import { GoogleAuthResolver } from './google-auth.resolver';
import { GoogleAuthController } from './google-auth.controller';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Member', schema: MemberSchema },
			{ name: 'RefreshSession', schema: RefreshSessionSchema },
			{ name: 'GoogleLoginTicket', schema: GoogleLoginTicketSchema },
		]),
		JwtModule.register({
			secret: `${process.env.SECRET_TOKEN}`,
			signOptions: { expiresIn: ACCESS_TOKEN_SECONDS },
		}),
	],
	controllers: [GoogleAuthController],
	providers: [AuthService, AuthSessionService, AuthResolver, GoogleAuthService, GoogleAuthResolver],
	exports: [AuthService, AuthSessionService],
})
export class AuthModule {}
