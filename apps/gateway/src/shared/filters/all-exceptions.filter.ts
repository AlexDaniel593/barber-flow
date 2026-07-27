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
    } else if (
      exception &&
      typeof exception === 'object' &&
      typeof (exception as any).statusCode === 'number'
    ) {
      // Error serializado por un filtro RPC de un microservicio (ver rpc-exception.filter.ts)
      statusCode = (exception as any).statusCode;
      message = (exception as any).message || message;
    }

    if (statusCode >= 500) {
      Sentry.withScope((scope) => {
        scope.setTag('service', 'gateway');
        scope.setTag('path', request.url);
        scope.setContext('request', {
          method: request.method,
          url: request.url,
          headers: request.headers,
        });
        Sentry.captureException(exception);
      });
    }

    response.status(statusCode).json({
      statusCode,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
