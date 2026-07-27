import { Catch, ArgumentsHost, HttpException, RpcExceptionFilter as IRpcExceptionFilter } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';
import * as Sentry from '@sentry/node';

@Catch(RpcException, HttpException)
export class RpcExceptionFilter implements IRpcExceptionFilter<RpcException | HttpException> {
  catch(exception: RpcException | HttpException, host: ArgumentsHost): Observable<never> {
    let statusCode = 400;
    let message: string;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const response = exception.getResponse();
      message =
        typeof response === 'string' ? response : (response as any)?.message || exception.message;
    } else {
      const error = exception.getError();
      message = typeof error === 'string' ? error : (error as any)?.message || 'RPC Error';
    }

    Sentry.withScope((scope) => {
      scope.setTag('service', 'services-staff');
      scope.setTag('transport', 'tcp');
      scope.setContext('rpc_error', { statusCode, message });
      Sentry.captureException(exception);
    });

    return throwError(() => ({
      statusCode,
      message,
      timestamp: new Date().toISOString(),
    }));
  }
}
