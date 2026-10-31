import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { GoogleLoginInput, GoogleLoginResult } from '../../libs/dto/auth/google-auth';
import type { AuthContext } from './auth.resolver';
import { GoogleAuthService } from './google-auth.service';

@Resolver()
export class GoogleAuthResolver {
 constructor(private readonly googleAuth: GoogleAuthService) {}

 @Mutation(() => String)
 public startGoogleLogin(@Args('input') input: GoogleLoginInput, @Context() context: AuthContext): Promise<string> {
  return this.googleAuth.start(input, context.req, context.res);
 }

 @Mutation(() => GoogleLoginResult)
 public completeGoogleLogin(@Args('code') code: string, @Context() context: AuthContext): Promise<GoogleLoginResult> {
  return this.googleAuth.complete(code, context.req, context.res);
 }
}
