import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const userId = request.user?.id || 'anonymous';
    const startTime = Date.now();

    this.logger.log(`→ ${method} ${url} | User: ${userId} | IP: ${ip}`);

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const duration = Date.now() - startTime;
          
          this.logger.log(
            `← ${method} ${url} | ${statusCode} | ${duration}ms | User: ${userId}`
          );
        },
        error: (error) => {
          const response = context.switchToHttp().getResponse();
          const statusCode = error.status || 500;
          const duration = Date.now() - startTime;
          
          this.logger.error(
            `← ${method} ${url} | ${statusCode} | ${duration}ms | Error: ${error.message}`
          );
        },
      }),
    );
  }
}
