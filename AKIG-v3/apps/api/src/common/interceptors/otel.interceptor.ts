import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

@Injectable()
export class OpenTelemetryInterceptor implements NestInterceptor {
  private readonly tracer = trace.getTracer('akig-api', '3.0.0');

  intercept(executionContext: ExecutionContext, next: CallHandler): Observable<any> {
    const request = executionContext.switchToHttp().getRequest();
    const { method, url, headers } = request;
    
    const span = this.tracer.startSpan(`${method} ${url}`, {
      attributes: {
        'http.method': method,
        'http.url': url,
        'http.user_agent': headers['user-agent'],
        'user.id': request.user?.id || 'anonymous',
      },
    });

    return next.handle().pipe(
      tap({
        next: () => {
          span.setStatus({ code: SpanStatusCode.OK });
          span.end();
        },
        error: (error) => {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error.message,
          });
          span.recordException(error);
          span.end();
        },
      }),
    );
  }
}
