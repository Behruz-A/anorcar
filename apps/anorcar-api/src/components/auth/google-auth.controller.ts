import { Controller, Get, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { GoogleAuthService } from './google-auth.service';

@Controller('auth/google')
export class GoogleAuthController {
 constructor(private readonly googleAuth: GoogleAuthService) {}

 @Get('callback')
 public callback(@Req() req: Request, @Res() res: Response): Promise<void> {
  return this.googleAuth.callback(req, res);
 }
}
