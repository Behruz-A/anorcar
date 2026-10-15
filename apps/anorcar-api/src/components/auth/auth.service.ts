import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Member } from '../../libs/dto/member/member';
import { T } from '../../libs/types/common';
import { JwtService } from '@nestjs/jwt';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { ACCESS_TOKEN_SECONDS } from '../../libs/config/auth.config';
import { Message } from '../../libs/enums/common.enum';

@Injectable()
export class AuthService {
	constructor(private jwtService: JwtService) {}

	public async hashPassword(memberPassword: string): Promise<string> {
		const salt = await bcrypt.genSalt();
		return await bcrypt.hash(memberPassword, salt);
	}

	public async comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
		return await bcrypt.compare(password, hashedPassword);
	}

	public async createToken(member: Member): Promise<string> {
		const payload: T = {};

		Object.keys(member['_doc'] ? member['_doc'] : member).map((ele) => {
			payload[`${ele}`] = member[`${ele}`];
		});

		delete payload.memberPassword;
		delete payload.accessToken;
		delete payload.iat;
		delete payload.exp;
		delete payload.nbf;
		return await this.jwtService.signAsync(payload, { expiresIn: ACCESS_TOKEN_SECONDS });
	}
	public async verifyToken(token: string): Promise<Member> {
		try {
			const member = await this.jwtService.verifyAsync<Member>(token, {
				algorithms: ['HS256'],
				maxAge: ACCESS_TOKEN_SECONDS,
			});
			member._id = shapeIntoMongoObjectId(member._id);
			return member;
		} catch (error) {
			if (error instanceof Error && error.name === 'TokenExpiredError')
				throw new UnauthorizedException('ACCESS_TOKEN_EXPIRED');
			throw new UnauthorizedException(Message.NOT_AUTHENTICATED);
		}
	}
}
