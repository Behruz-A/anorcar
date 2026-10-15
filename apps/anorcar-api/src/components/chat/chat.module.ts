import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import MemberSchema from '../../schemas/Member.model';
import { AuthModule } from '../auth/auth.module';
import { FirebaseModule } from '../firebase/firebase.module';
import { ChatService } from './chat.service';
import { ChatResolver } from './chat.resolver';

@Module({
	imports: [AuthModule, FirebaseModule, MongooseModule.forFeature([{ name: 'Member', schema: MemberSchema }])],
	providers: [ChatService, ChatResolver],
})
export class ChatModule {}
