"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BooksService = void 0;
const common_1 = require("@nestjs/common");
const userBooks = [];
let userBookId = 1;
let BooksService = class BooksService {
    async fetchBookFromGoogle(isbn) {
        var _a;
        const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
        const resp = await fetch(url);
        const data = await resp.json();
        if (!data.items || data.totalItems === 0)
            return null;
        const info = data.items[0].volumeInfo;
        return {
            isbn,
            title: info.title,
            authors: info.authors,
            thumbnail: (_a = info.imageLinks) === null || _a === void 0 ? void 0 : _a.thumbnail,
            description: info.description,
            publishedDate: info.publishedDate
        };
    }
    addUserBook(dto) {
        var _a;
        const userBook = {
            id: userBookId++,
            userId: (_a = dto.userId) !== null && _a !== void 0 ? _a : 1,
            isbn: dto.isbn,
            descrizioneCondizione: dto.descrizioneCondizione,
            status: 'NOT_AVAILABLE',
            createdAt: new Date(),
        };
        userBooks.push(userBook);
        return { success: true, data: userBook, bonusCredits: 3 };
    }
    updateUserBookStatus(userBookId, status, userId) {
        const ub = userBooks.find(u => u.id === userBookId && u.userId === userId);
        if (!ub)
            return { success: false, message: 'Libro non trovato o permessi insufficienti' };
        ub.status = status;
        return { success: true };
    }
    getMyUserBooks(userId) {
        return userBooks.filter(u => u.userId === userId);
    }
    deleteUserBook(userBookId, userId) {
        const idx = userBooks.findIndex(u => u.id === userBookId && u.userId === userId);
        if (idx === -1)
            return { success: false, message: 'Libro non trovato o permessi insufficienti' };
        userBooks.splice(idx, 1);
        return { success: true };
    }
};
exports.BooksService = BooksService;
exports.BooksService = BooksService = __decorate([
    (0, common_1.Injectable)()
], BooksService);
//# sourceMappingURL=books.service.js.map