import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { AiResolver } from './ai.resolver';
import { AiService } from './ai.service';

@Module({ imports: [ConfigModule, AuthModule], providers: [AiResolver, AiService] })
export class AiModule {}
