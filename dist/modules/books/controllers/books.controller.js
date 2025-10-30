"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BooksController = void 0;
const common_1 = require("@nestjs/common");
const books_service_1 = require("../services/books.service");
const add_user_book_dto_1 = require("../dto/add-user-book.dto");
const update_user_book_dto_1 = require("../dto/update-user-book.dto");
const AFFILIATE_CODE = 'TESTAFF-21';
const demoBooks = [
    {
        title: 'It',
        authors: ['Stephen King'],
        isbn: '9788804681968',
        thumbnail: 'https://books.google.com/books/content?id=vZ0ACwAAQBAJ&printsec=frontcover&img=1&zoom=1',
        available: true,
    },
    {
        title: 'Il signore degli anelli',
        authors: ['J.R.R. Tolkien'],
        isbn: '9788804668235',
        thumbnail: 'https://books.google.com/books/content?id=YhtcDwAAQBAJ&printsec=frontcover&img=1&zoom=1',
        available: false,
    },
    {
        title: 'Invisible Cities',
        authors: ['Italo Calvino'],
        isbn: '9780679735120',
        thumbnail: '',
        available: false,
    },
];
let BooksController = class BooksController {
    constructor(booksService) {
        this.booksService = booksService;
    }
    async getByIsbn(isbn) {
        if (isbn === '9788804681968') {
            return {
                isbn,
                title: 'It',
                authors: ['Stephen King'],
                thumbnail: 'https://books.google.com/books/content?id=vZ0ACwAAQBAJ&printsec=frontcover&img=1&zoom=1',
            };
        }
        const found = await this.booksService.fetchBookFromGoogle(isbn);
        if (!found)
            throw new common_1.NotFoundException('Libro non trovato');
        return found;
    }
    getAffiliate() {
        return { affiliateCode: AFFILIATE_CODE };
    }
    getAvailableBooks() {
        return demoBooks;
    }
    addUserBook(dto) {
        dto.userId = 1;
        return this.booksService.addUserBook(dto);
    }
    updateUserBookStatus(userBookId, dto) {
        return this.booksService.updateUserBookStatus(Number(userBookId), dto.status, 1);
    }
    getMyCollection() {
        return this.booksService.getMyUserBooks(1);
    }
    deleteUserBook(userBookId) {
        return this.booksService.deleteUserBook(Number(userBookId), 1);
    }
};
exports.BooksController = BooksController;
__decorate([
    (0, common_1.Get)('isbn/:isbn'),
    __param(0, (0, common_1.Param)('isbn')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BooksController.prototype, "getByIsbn", null);
__decorate([
    (0, common_1.Get)('/config/affiliate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BooksController.prototype, "getAffiliate", null);
__decorate([
    (0, common_1.Get)('available'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BooksController.prototype, "getAvailableBooks", null);
__decorate([
    (0, common_1.Post)('my-collection'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [add_user_book_dto_1.AddUserBookDto]),
    __metadata("design:returntype", void 0)
], BooksController.prototype, "addUserBook", null);
__decorate([
    (0, common_1.Put)('my-collection/:userBookId'),
    __param(0, (0, common_1.Param)('userBookId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_user_book_dto_1.UpdateUserBookDto]),
    __metadata("design:returntype", void 0)
], BooksController.prototype, "updateUserBookStatus", null);
__decorate([
    (0, common_1.Get)('my-collection'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BooksController.prototype, "getMyCollection", null);
__decorate([
    (0, common_1.Delete)('my-collection/:userBookId'),
    __param(0, (0, common_1.Param)('userBookId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BooksController.prototype, "deleteUserBook", null);
exports.BooksController = BooksController = __decorate([
    (0, common_1.Controller)('books'),
    __metadata("design:paramtypes", [books_service_1.BooksService])
], BooksController);
//# sourceMappingURL=books.controller.js.map