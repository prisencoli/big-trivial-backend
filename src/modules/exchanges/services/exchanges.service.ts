import { Injectable } from '@nestjs/common';
import { Exchange } from '../entities/exchange.entity';
import { ProposeExchangeDto } from '../dto/propose-exchange.dto';

const exchanges: Exchange[] = [];
let exchangeId = 1;

@Injectable()
export class ExchangesService {
  createExchange(dto: ProposeExchangeDto, userId: number) {
    // Accetta: richiesto: id userBook, offerto: userBook || credits, message
    const ex: Exchange = {
      id: exchangeId++,
      proposerUserId: userId,
      requestedUserBookId: dto.requestedUserBookId,
      offeredUserBookId: dto.offeredUserBookId,
      offeredCredits: dto.offeredCredits,
      status: 'PENDING',
      message: dto.message,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    exchanges.push(ex);
    return ex;
  }
  getExchanges(userId: number, type: 'sent' | 'received') {
    return exchanges.filter(e => 
      type === 'sent' ? e.proposerUserId === userId : e.requestedUserBookId && this.getBookOwnerId(e.requestedUserBookId) === userId
    );
  }
  updateExchangeStatus(id: number, status: Exchange['status'], userId: number) {
    const ex = exchanges.find(e=>e.id===id);
    if (!ex) return { success: false, message: 'Scambio non trovato' };
    // Permessi: solo owner o proposer possono aggiornare, logic minimale
    if (ex.proposerUserId !== userId && this.getBookOwnerId(ex.requestedUserBookId) !== userId) {
      return { success: false, message: 'Permessi insufficienti' };
    }
    ex.status = status;
    ex.updatedAt = new Date();
    return { success: true };
  }
  // Mock: simulazione mapping book->user
  getBookOwnerId(userBookId: number) {
    return 1; // Per ora mock: userId=1 possiede tutto!
  }
}



