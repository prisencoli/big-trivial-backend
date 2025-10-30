import { Module } from '@nestjs/common';
import { QuizController } from './controllers/quiz.controller';
import { QuizService } from './services/quiz.service';
import { AuthService } from '../auth/services/auth.service';

@Module({
  controllers: [QuizController],
  providers: [QuizService, AuthService],
})
export class QuizModule {}
