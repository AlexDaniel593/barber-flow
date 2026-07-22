import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { AppModule } from './app.module';
import { RpcExceptionFilter } from './shared/filters/rpc-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: 3002,
    },
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'barber',
      protoPath: join(__dirname, '../../../proto/barber.proto'),
      url: '0.0.0.0:50051',
    },
  });

  app.useGlobalFilters(new RpcExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.startAllMicroservices();
  console.log('Microservicio ms-services-staff corriendo en TCP:3002 y gRPC:50051');
}
bootstrap();
