import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { RpcExceptionFilter } from './shared/filters/rpc-exception.filter';
import { initSentry } from './sentry.config';

initSentry();

async function bootstrap() {
  // Patrón híbrido: aplicación HTTP + microservicio TCP
  // RabbitMQ se gestiona mediante RabbitmqPublisherService (propio), no como transporte NestJS
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: 3001,
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
  console.log('Microservicio ms-appointments corriendo en TCP:3001');
}
bootstrap();