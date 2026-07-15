import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicesModule } from './services/services.module';
import { StylistsModule } from './stylists/stylists.module';
import { Service } from './services/entities/service.entity';
import { Stylist } from './stylists/entities/stylist.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'barber_flow',
      entities: [Service, Stylist],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    ServicesModule,
    StylistsModule,
  ],
})
export class AppModule {}
