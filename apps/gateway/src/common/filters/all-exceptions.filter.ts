import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const correlationId =
      (request.headers['x-correlation-id'] as string) ||
      `corr-${Date.now()}`;

    const failureMode =
      statusCode >= 500 ? 'uncaught_exception' : 'http_error';

    if (process.env.SENTRY_DSN) {
      Sentry.withScope((scope) => {
        scope.setTag('service', 'gateway');
        scope.setTag('transport', 'http');
        scope.setTag('failure_mode', failureMode);
        scope.setTag('correlation_id', correlationId);

        scope.setContext('request_info', {
          method: request.method,
          url: request.url,
          status: statusCode,
          correlationId,
        });

        scope.addBreadcrumb({
          type: 'http.request',
          category: 'http',
          data: {
            method: request.method,
            url: request.url,
            status_code: statusCode,
          },
          level: statusCode >= 500 ? 'error' : 'warning',
        });

        Sentry.captureException(exception);
      });
    }

    response.status(statusCode).json({
      statusCode,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      correlationId,
    });
  }
}
