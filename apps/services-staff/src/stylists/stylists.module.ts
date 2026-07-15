import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StylistsController } from './stylists.controller';
import { StylistsService } from './stylists.service';
import { Stylist } from './entities/stylist.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Stylist])],
  controllers: [StylistsController],
  providers: [StylistsService],
  exports: [StylistsService],
})
export class StylistsModule {}
