import { Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { BaseRpcExceptionFilter, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import * as Sentry from '@sentry/node';

@Catch()
export class GrpcExceptionFilter extends BaseRpcExceptionFilter {
  private readonly logger = new Logger(GrpcExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    if (exception instanceof RpcException) {
      return super.catch(exception, host);
    }

    const error = exception as Error;
    this.logger.error(`Unhandled gRPC error: ${error.message}`, error.stack);

    Sentry.withScope((scope) => {
      scope.setTag('service', 'services-staff');
      scope.setTag('transport', 'grpc');
      scope.setContext('grpc_error', {
        message: error.message,
        stack: error.stack,
      });
      Sentry.captureException(exception);
    });

    const grpcError = new RpcException({
      code: status.INTERNAL,
      message: error.message || 'Internal server error',
    });

    return super.catch(grpcError, host);
  }
}
