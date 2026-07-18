import { Controller, Post, Body, Inject, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, catchError, throwError, timeout, TimeoutError } from 'rxjs';

@Controller('appointments')
export class AppointmentsController {
  constructor(
    @Inject('APPOINTMENTS_CLIENT')
    private readonly client: ClientProxy,
  ) {}

  @Post('verify-stylist')
  async verifyStylist(@Body() data: { id: string }) {
    return firstValueFrom(
      this.client.send({ cmd: 'appointments.verifyStylistGrpc' }, data).pipe(
        timeout(5000),
        catchError((err) => {
          if (err instanceof TimeoutError) {
            return throwError(() => new HttpException('El servicio no respondió a tiempo', HttpStatus.SERVICE_UNAVAILABLE));
          }
          const message = err?.message || 'Error verifying stylist';
          if (message?.toLowerCase().includes('inactivo') || message?.toLowerCase().includes('no está disponible')) {
            return throwError(() => new BadRequestException(message));
          }
          if (message?.toLowerCase().includes('no disponible en este momento')) {
            return throwError(() => new HttpException(message, HttpStatus.SERVICE_UNAVAILABLE));
          }
          return throwError(() => new BadRequestException(message));
        }),
      ),
    );
  }
}
