import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import * as fs from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';
import { GrpcExceptionFilter } from './common/filters/grpc-exception.filter';

const getProtoPath = () => {
  const paths = [
    join(__dirname, '../proto/barber.proto'),
    join(__dirname, '../../proto/barber.proto'),
    join(__dirname, '../../../proto/barber.proto'),
    join(__dirname, '../../../../proto/barber.proto'),
    join(process.cwd(), 'proto/barber.proto'),
    join(process.cwd(), 'apps/proto/barber.proto'),
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return paths[paths.length - 1];
};

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
      protoPath: getProtoPath(),
      url: '0.0.0.0:50051',
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GrpcExceptionFilter());

  await app.startAllMicroservices();
  console.log('Microservicio ms-services-staff corriendo en TCP:3002 y gRPC:50051');
}
bootstrap();
