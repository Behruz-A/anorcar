import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
	private readonly logger = new Logger(LoggingInterceptor.name);

	public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		if (context.getType<GqlContextType>() !== 'graphql') return next.handle();
		const started = Date.now();
		const fieldName = GqlExecutionContext.create(context).getInfo().fieldName;
		// Do not log inputs, returned records, credentials or private messages.
		return next.handle().pipe(tap(() => this.logger.log(`${fieldName} - ${Date.now() - started}ms`, 'Response')));
	}
}
