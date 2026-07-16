import {
  Controller, Get, Post, Param, Body, Inject,
  BadRequestException, InternalServerErrorException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, catchError, throwError } from 'rxjs';

@Controller('invoices')
export class InvoicesController {
  constructor(
    @Inject('INVENTORY_BILLING_CLIENT')
    private readonly client: ClientProxy,
  ) {}

  @Post()
  async create(@Body() dto: any) {
    return firstValueFrom(
      this.client.send({ cmd: 'invoices.create' }, dto).pipe(
        catchError((err) => {
          const message = err?.message || 'Error creating invoice';
          return throwError(() => new BadRequestException(message));
        }),
      ),
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return firstValueFrom(
      this.client.send({ cmd: 'invoices.findOne' }, { id }).pipe(
        catchError((err) => {
          const message = err?.message || `Invoice with ID ${id} not found`;
          return throwError(() => new BadRequestException(message));
        }),
      ),
    );
  }
}
