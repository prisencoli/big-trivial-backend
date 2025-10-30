import { Controller, Post, Body, Get, Query, Patch, Param } from '@nestjs/common';
import { ExchangesService } from '../services/exchanges.service';
import { ProposeExchangeDto } from '../dto/propose-exchange.dto';

@Controller('exchanges')
export class ExchangesController {
  constructor(private readonly es: ExchangesService) {}

  @Post()
  propose(@Body() dto: ProposeExchangeDto) {
    // In reale prende userId da JWT
    const userId = 1;
    return this.es.createExchange(dto, userId);
  }

  @Get()
  list(@Query('type') type: 'sent' | 'received') {
    return this.es.getExchanges(1, type);
  }

  @Patch(':id/:action')
  updateStatus(@Param('id') id: string, @Param('action') action: string) {
    const validActions = {
      accept: 'ACCEPTED',
      reject: 'REJECTED',
      cancel: 'CANCELED',
      complete: 'COMPLETED',
    };
    if (!(action in validActions)) return { success: false, message: 'Azione non valida' };
    return this.es.updateExchangeStatus(Number(id), validActions[action], 1);
  }
}


