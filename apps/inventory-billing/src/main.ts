import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { RpcExceptionFilter } from './shared/filters/rpc-exception.filter';

async function bootstrap() {
  // Patrón híbrido: aplicación HTTP + microservicio TCP
  // RabbitMQ se gestiona mediante RabbitmqConsumerService (propio), no como transporte NestJS
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: 3003,
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
  console.log('Microservicio ms-inventory-billing corriendo en TCP:3003');
}
bootstrap();

