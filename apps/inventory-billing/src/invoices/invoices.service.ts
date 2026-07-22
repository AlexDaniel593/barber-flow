import { Injectable, Logger, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { DailySummaryDto } from './dto/daily-summary.dto';
import { MonthlyReportDto } from './dto/monthly-report.dto';

const TAX_RATE = 0;

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private readonly invoiceItemRepository: Repository<InvoiceItem>,
    @Inject('SERVICES_STAFF_CLIENT')
    private readonly staffClient: ClientProxy,
  ) {}

  async create(dto: CreateInvoiceDto): Promise<Invoice> {
    try {
      let stylist: any;
      try {
        stylist = await firstValueFrom(
          this.staffClient.send({ cmd: 'stylists.findOne' }, { id: dto.stylistId }),
        );
      } catch (connectionError: any) {
        const errorMsg = connectionError?.message || String(connectionError);
        const isConnectionError =
          errorMsg.includes('ECONNREFUSED') ||
          errorMsg.includes('ETIMEDOUT') ||
          errorMsg.includes('TIMEOUT') ||
          errorMsg.includes('connect') ||
          errorMsg.includes('closed');

        if (isConnectionError) {
          this.logger.error(
            `MS-Services-Staff inalcanzable al validar estilista ${dto.stylistId}: ${errorMsg}`,
          );
          throw new RpcException(
            `Servicio de Staff no disponible. No se puede validar el estilista. Intente más tarde.`,
          );
        }

        this.logger.warn(
          `Error de negocio al buscar estilista ${dto.stylistId}: ${errorMsg}`,
        );
        throw new RpcException(
          `El estilista con ID ${dto.stylistId} no existe en la base de datos de Staff.`,
        );
      }

      if (!stylist) {
        throw new RpcException(
          `El estilista con ID ${dto.stylistId} no existe en la base de datos de Staff.`,
        );
      }

      const items = dto.items.map((item) =>
        this.invoiceItemRepository.create({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        }),
      );

      const subtotal = items.reduce((sum, item) => sum + Number(item.total), 0);
      const discount = dto.discount ?? 0;
      const tax = subtotal * TAX_RATE;
      const total = subtotal + tax - discount;

      const invoice = this.invoiceRepository.create({
        appointmentId: dto.appointmentId,
        stylistId: dto.stylistId,
        subtotal,
        tax,
        discount,
        total,
        paymentMethod: dto.paymentMethod,
        paidAt: new Date(),
        items,
      });

      return await this.invoiceRepository.save(invoice);
    } catch (error) {
      this.logger.error(`Error creating invoice: ${error.message}`, error.stack);
      if (error instanceof RpcException) {
        throw error;
      }
      throw new BadRequestException(`Failed to create invoice: ${error.message}`);
    }
  }

  async findOne(id: string): Promise<Invoice> {
    try {
      const invoice = await this.invoiceRepository.findOne({
        where: { id },
        relations: ['items'],
      });
      if (!invoice) {
        throw new NotFoundException(`Invoice with ID ${id} not found`);
      }
      return invoice;
    } catch (error) {
      this.logger.error(`Error finding invoice ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findByAppointment(appointmentId: string): Promise<Invoice> {
    try {
      const invoice = await this.invoiceRepository.findOne({
        where: { appointmentId },
        relations: ['items'],
      });
      if (!invoice) {
        throw new NotFoundException(`Invoice for appointment ${appointmentId} not found`);
      }
      return invoice;
    } catch (error) {
      this.logger.error(
        `Error finding invoice for appointment ${appointmentId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getDailySummary(dto: DailySummaryDto): Promise<{
    totalInvoices: number;
    totalRevenue: number;
    paymentMethods: { cash: number; card: number };
    items: Invoice[];
  }> {
    try {
      const day = new Date(dto.date);
      const start = new Date(day.setHours(0, 0, 0, 0));
      const end = new Date(day.setHours(23, 59, 59, 999));

      const invoices = await this.invoiceRepository.find({
        where: { createdAt: Between(start, end) },
        relations: ['items'],
      });

      const totalRevenue = invoices.reduce((sum, invoice) => sum + Number(invoice.total), 0);
      const paymentMethods = invoices.reduce(
        (acc, invoice) => {
          if (invoice.paymentMethod === 'cash') acc.cash += Number(invoice.total);
          if (invoice.paymentMethod === 'card') acc.card += Number(invoice.total);
          return acc;
        },
        { cash: 0, card: 0 },
      );

      return {
        totalInvoices: invoices.length,
        totalRevenue,
        paymentMethods,
        items: invoices,
      };
    } catch (error) {
      this.logger.error(`Error building daily summary: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to build daily summary: ${error.message}`);
    }
  }

  async getMonthlyReport(dto: MonthlyReportDto): Promise<{
    totalRevenue: number;
    totalInvoices: number;
    topServices: { description: string; count: number; revenue: number }[];
    topStylists: never[];
  }> {
    try {
      const year = parseInt(dto.year, 10);
      const month = parseInt(dto.month, 10);
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59, 999);

      const invoices = await this.invoiceRepository.find({
        where: { createdAt: Between(start, end) },
        relations: ['items'],
      });

      const totalRevenue = invoices.reduce((sum, invoice) => sum + Number(invoice.total), 0);

      const servicesMap = new Map<string, { count: number; revenue: number }>();
      for (const invoice of invoices) {
        for (const item of invoice.items) {
          const current = servicesMap.get(item.description) ?? { count: 0, revenue: 0 };
          current.count += item.quantity;
          current.revenue += Number(item.total);
          servicesMap.set(item.description, current);
        }
      }

      const topServices = Array.from(servicesMap.entries())
        .map(([description, data]) => ({ description, ...data }))
        .sort((a, b) => b.revenue - a.revenue);

      return {
        totalRevenue,
        totalInvoices: invoices.length,
        topServices,
        topStylists: [],
      };
    } catch (error) {
      this.logger.error(`Error building monthly report: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to build monthly report: ${error.message}`);
    }
  }
}
