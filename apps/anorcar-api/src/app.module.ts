import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '@nestjs/apollo';
import { AppResolver } from './app.resolver';
import { ComponentsModule } from './components/components.module';
import { DatabaseModule } from './database/database.module';
import { T } from './libs/types/common';
import { SocketModule } from './socket/socket.module';

@Module({
	// 2
	imports: [
		ConfigModule.forRoot(), // env
		GraphQLModule.forRoot({
			// graphql ni chaqirib olebmiz
			driver: ApolloDriver,
			playground: true,
			uploads: false,
			autoSchemaFile: true,
			introspection: true, // ← qo'shing
			csrfPrevention: false,
			formatError: (error: T) => {
				const graphQLFormattedError = {
					message:
						error?.extensions?.exception?.response?.message || error?.extensions?.response?.message || error?.message,
					extensions: {
						code: error?.extensions?.code,
					},
				};

				console.log('GRAPHQL GLOBAL ERROR:', graphQLFormattedError);
				return graphQLFormattedError;
			},
		}),
		ComponentsModule,
		DatabaseModule,
		SocketModule,
	],
	controllers: [AppController],
	providers: [AppService, AppResolver],
})
export class AppModule {}
