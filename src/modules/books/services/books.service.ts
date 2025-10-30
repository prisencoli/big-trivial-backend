import { Injectable } from '@nestjs/common';
import { AddUserBookDto } from '../dto/add-user-book.dto';
import { UpdateUserBookDto } from '../dto/update-user-book.dto';
import { UserBook } from '../entities/user-book.entity';

const userBooks: UserBook[] = [];
let userBookId = 1;

@Injectable()
export class BooksService {
  async fetchBookFromGoogle(isbn: string): Promise<any | null> {
    // API semplice per ricerca volume tramite ISBN
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
    const resp = await fetch(url);
    const data = await resp.json();
    if (!data.items || data.totalItems === 0) return null;
    const info = data.items[0].volumeInfo;
    return {
      isbn,
      title: info.title,
      authors: info.authors,
      thumbnail: info.imageLinks?.thumbnail,
      description: info.description,
      publishedDate: info.publishedDate
    };
  }

  addUserBook(dto: AddUserBookDto): { success: boolean; data?: UserBook; message?: string; bonusCredits: number } {
    const userBook: UserBook = {
      id: userBookId++,
      userId: dto.userId ?? 1,
      isbn: dto.isbn,
      descrizioneCondizione: dto.descrizioneCondizione,
      status: 'NOT_AVAILABLE',
      createdAt: new Date(),
    };
    userBooks.push(userBook);
    return { success: true, data: userBook, bonusCredits: 3 };
  }

  updateUserBookStatus(userBookId: number, status: 'AVAILABLE' | 'NOT_AVAILABLE', userId: number): { success: boolean; message?: string } {
    const ub = userBooks.find(u => u.id === userBookId && u.userId === userId);
    if (!ub) return { success: false, message: 'Libro non trovato o permessi insufficienti' };
    ub.status = status;
    return { success: true };
  }

  getMyUserBooks(userId: number) {
    return userBooks.filter(u => u.userId === userId);
  }
  deleteUserBook(userBookId: number, userId: number) {
    const idx = userBooks.findIndex(u => u.id === userBookId && u.userId === userId);
    if (idx === -1) return { success: false, message: 'Libro non trovato o permessi insufficienti' };
    userBooks.splice(idx, 1);
    return { success: true };
  }
}
