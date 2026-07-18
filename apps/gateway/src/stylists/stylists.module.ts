import { Module } from '@nestjs/common';
import { StylistsController } from './stylists.controller';
import { StylistsService } from './stylists.service';

@Module({
  controllers: [StylistsController],
  providers: [StylistsService],
})
export class StylistsModule {}
