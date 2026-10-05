import { Module } from '@nestjs/common';
import { MemberModule } from './member/member.module';
import { CarModule } from './car/car.module';
import { AuthModule } from './auth/auth.module';
import { CommentModule } from './comment/comment.module';
import { LikeModule } from './like/like.module';
import { ViewModule } from './view/view.module';
import { FollowModule } from './follow/follow.module';
import { BoardArticleModule } from './board-article/board-article.module';
import { BrandModule } from './brand/brand.module';

@Module({
	imports: [MemberModule, CarModule, BrandModule, AuthModule, CommentModule, LikeModule, ViewModule, FollowModule, BoardArticleModule],
})
export class ComponentsModule {}
