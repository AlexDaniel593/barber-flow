import { Catch, ArgumentsHost, Logger, RpcExceptionFilter } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';

@Catch()
export class RpcErrorFilter implements RpcExceptionFilter<any> {
  private readonly logger = new Logger(RpcErrorFilter.name);

  catch(exception: any, host: ArgumentsHost): Observable<any> {
    const errorMsg = exception.message || 'Internal server error';
    this.logger.error(`Exception caught in Appointments: ${errorMsg}`, exception.stack);

    if (exception instanceof RpcException) {
      return throwError(() => exception.getError());
    }

    const status = exception.status || exception.statusCode || 500;
    const response = exception.response;

    return throwError(() => ({
      status,
      message: typeof response === 'object' && response !== null ? (response as any).message || errorMsg : errorMsg,
      error: typeof response === 'object' && response !== null ? (response as any).error || null : null,
    }));
  }
}
