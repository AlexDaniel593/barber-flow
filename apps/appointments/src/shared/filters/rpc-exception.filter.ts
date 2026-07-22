import { Catch, ArgumentsHost, RpcExceptionFilter as IRpcExceptionFilter } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';

@Catch(RpcException)
export class RpcExceptionFilter implements IRpcExceptionFilter<RpcException> {
  catch(exception: RpcException, host: ArgumentsHost): Observable<never> {
    const error = exception.getError();

    return throwError(() => ({
      statusCode: 400,
      message: typeof error === 'string' ? error : (error as any)?.message || 'RPC Error',
      timestamp: new Date().toISOString(),
    }));
  }
}
