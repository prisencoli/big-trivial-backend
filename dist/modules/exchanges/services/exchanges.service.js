"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExchangesService = void 0;
const common_1 = require("@nestjs/common");
const exchanges = [];
let exchangeId = 1;
let ExchangesService = class ExchangesService {
    createExchange(dto, userId) {
        const ex = {
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
    getExchanges(userId, type) {
        return exchanges.filter(e => type === 'sent' ? e.proposerUserId === userId : e.requestedUserBookId && this.getBookOwnerId(e.requestedUserBookId) === userId);
    }
    updateExchangeStatus(id, status, userId) {
        const ex = exchanges.find(e => e.id === id);
        if (!ex)
            return { success: false, message: 'Scambio non trovato' };
        if (ex.proposerUserId !== userId && this.getBookOwnerId(ex.requestedUserBookId) !== userId) {
            return { success: false, message: 'Permessi insufficienti' };
        }
        ex.status = status;
        ex.updatedAt = new Date();
        return { success: true };
    }
    getBookOwnerId(userBookId) {
        return 1;
    }
};
exports.ExchangesService = ExchangesService;
exports.ExchangesService = ExchangesService = __decorate([
    (0, common_1.Injectable)()
], ExchangesService);
//# sourceMappingURL=exchanges.service.js.map