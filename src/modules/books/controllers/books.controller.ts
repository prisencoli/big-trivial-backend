import { Controller, Get, Param, NotFoundException, Post, Body, Put, Delete } from '@nestjs/common';
import { BooksService } from '../services/books.service';
import { AddUserBookDto } from '../dto/add-user-book.dto';
import { UpdateUserBookDto } from '../dto/update-user-book.dto';

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

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get('isbn/:isbn')
  async getByIsbn(@Param('isbn') isbn: string) {
    if (isbn === '9788804681968') {
      return {
        isbn,
        title: 'It',
        authors: ['Stephen King'],
        thumbnail: 'https://books.google.com/books/content?id=vZ0ACwAAQBAJ&printsec=frontcover&img=1&zoom=1',
      };
    }
    const found = await this.booksService.fetchBookFromGoogle(isbn);
    if (!found) throw new NotFoundException('Libro non trovato');
    return found;
  }

  @Get('/config/affiliate')
  getAffiliate() {
    return { affiliateCode: AFFILIATE_CODE };
  }

  @Get('available')
  getAvailableBooks() {
    return demoBooks;
  }

  @Post('my-collection')
  addUserBook(@Body() dto: AddUserBookDto) {
    // In un sistema reale qui estraggo userId da JWT/Request
    dto.userId = 1;
    return this.booksService.addUserBook(dto);
  }

  @Put('my-collection/:userBookId')
  updateUserBookStatus(@Param('userBookId') userBookId: string, @Body() dto: UpdateUserBookDto) {
    // In un sistema reale qui estraggo userId da JWT/Request
    return this.booksService.updateUserBookStatus(Number(userBookId), dto.status, 1);
  }

  @Get('my-collection')
  getMyCollection() {
    // In reale: userId da JWT
    return this.booksService.getMyUserBooks(1);
  }

  @Delete('my-collection/:userBookId')
  deleteUserBook(@Param('userBookId') userBookId: string) {
    return this.booksService.deleteUserBook(Number(userBookId), 1);
  }
}
