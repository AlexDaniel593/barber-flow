import { Catch, ArgumentsHost, RpcExceptionFilter as IRpcExceptionFilter } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';
import * as Sentry from '@sentry/node';

@Catch(RpcException)
export class RpcExceptionFilter implements IRpcExceptionFilter<RpcException> {
  catch(exception: RpcException, host: ArgumentsHost): Observable<never> {
    const error = exception.getError();

    Sentry.withScope((scope) => {
      scope.setTag('service', 'appointments');
      scope.setTag('transport', 'tcp');
      scope.setContext('rpc_error', {
        error: typeof error === 'string' ? error : JSON.stringify(error),
      });
      Sentry.captureException(exception);
    });

    return throwError(() => ({
      statusCode: 400,
      message: typeof error === 'string' ? error : (error as any)?.message || 'RPC Error',
      timestamp: new Date().toISOString(),
    }));
  }
}
