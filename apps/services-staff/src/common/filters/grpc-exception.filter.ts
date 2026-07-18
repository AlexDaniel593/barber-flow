import { Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { BaseRpcExceptionFilter, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

@Catch()
export class GrpcExceptionFilter extends BaseRpcExceptionFilter {
  private readonly logger = new Logger(GrpcExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    if (exception instanceof RpcException) {
      return super.catch(exception, host);
    }

    const error = exception as Error;
    this.logger.error(`Unhandled gRPC error: ${error.message}`, error.stack);

    const grpcError = new RpcException({
      code: status.INTERNAL,
      message: error.message || 'Internal server error',
    });

    return super.catch(grpcError, host);
  }
}
