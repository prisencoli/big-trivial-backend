import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth';
import { UsersModule } from './modules/users';
import { BooksModule } from './modules/books';
import { QuizModule } from './modules/quiz';

@Module({
  imports: [AuthModule, UsersModule, BooksModule, QuizModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
