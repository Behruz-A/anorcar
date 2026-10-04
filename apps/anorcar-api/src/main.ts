import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from './libs/interceptor/Logging.intercepter';
import { graphqlUploadExpress } from 'graphql-upload';
import * as express from 'express';
import * as path from 'path';
import { WsAdapter } from '@nestjs/platform-ws';

async function bootstrap() {
	const app = await NestFactory.create(AppModule); // 1
	app.useGlobalPipes(new ValidationPipe());
	app.useGlobalInterceptors(new LoggingInterceptor());
	app.enableCors({ origin: true, credentials: true });
	app.use(graphqlUploadExpress({ maxFileSize: 15000000, maxFiles: 10 }));
	app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
	app.useWebSocketAdapter(new WsAdapter(app));
	await app.listen(process.env.PORT_API ?? 3000);
}
bootstrap();
