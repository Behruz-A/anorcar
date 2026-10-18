import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import MemberSchema from '../../schemas/Member.model';
import RefreshSessionSchema from '../../schemas/RefreshSession.model';
import { ACCESS_TOKEN_SECONDS } from '../../libs/config/auth.config';
import { AuthSessionService } from './auth-session.service';
import { AuthResolver } from './auth.resolver';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Member', schema: MemberSchema },
			{ name: 'RefreshSession', schema: RefreshSessionSchema },
		]),
		JwtModule.register({
			secret: `${process.env.SECRET_TOKEN}`,
			signOptions: { expiresIn: ACCESS_TOKEN_SECONDS },
		}),
	],
	providers: [AuthService, AuthSessionService, AuthResolver],
	exports: [AuthService, AuthSessionService],
})
export class AuthModule {}
