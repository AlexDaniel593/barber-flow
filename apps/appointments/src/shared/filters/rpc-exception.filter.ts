import {
  Catch,
  ArgumentsHost,
  RpcExceptionFilter as IRpcExceptionFilter,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';
import * as Sentry from '@sentry/node';

@Catch(RpcException)
export class RpcExceptionFilter implements IRpcExceptionFilter<RpcException> {
  catch(exception: RpcException, host: ArgumentsHost): Observable<never> {
    const error = exception.getError();

    Sentry.captureException(exception, {
      tags: { service: 'appointments' },
      extra: {
        rpcError: typeof error === 'string' ? error : JSON.stringify(error),
      },
    });

    return throwError(() => ({
      statusCode: 400,
      message:
        typeof error === 'string'
          ? error
          : (error as any)?.message || 'RPC Error',
      timestamp: new Date().toISOString(),
    }));
  }
}
