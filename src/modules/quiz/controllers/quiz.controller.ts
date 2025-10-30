import { Controller, Get, Query, Post, Body, Req, Param } from '@nestjs/common';
import { QuizService } from '../services/quiz.service';
import { AuthService } from '../../auth/services/auth.service';

@Controller('quiz')
export class QuizController {
  constructor(private readonly quiz: QuizService, private readonly auth: AuthService) {}

  @Get('categories')
  getCategories() {
    return this.quiz.getCategories();
  }

  @Get('question/random')
  getRandom(
    @Query('cat') catId?: string,
    @Query('exclude') exclude?: string,
    @Query('difficulty') diff?: string,
  ) {
    const excludeIds = (exclude || '')
      .split(',')
      .map(s => Number(s.trim()))
      .filter(n => !!n);
    const d = (diff || 'medium').toLowerCase();
    const allowed = ['easy','medium','hard'];
    const difficulty = (allowed as string[]).includes(d) ? (d as 'easy'|'medium'|'hard') : 'medium';
    return this.quiz.getRandomQuestion(catId ? Number(catId) : undefined, excludeIds, difficulty);
  }

  @Get('daily/next')
  getDailyNext(
    @Query('cat') catId?: string,
    @Query('exclude') exclude?: string,
    @Query('difficulty') diff?: string,
  ) {
    const excludeIds = (exclude || '')
      .split(',')
      .map(s => Number(s.trim()))
      .filter(n => !!n);
    const d = (diff || 'medium').toLowerCase();
    const allowed = ['easy','medium','hard'];
    const difficulty = (allowed as string[]).includes(d) ? (d as 'easy'|'medium'|'hard') : 'medium';
    return this.quiz.getDailyQuestion(catId ? Number(catId) : undefined, excludeIds, difficulty);
  }

  @Post('answer')
  checkAnswer(@Req() req, @Body() body: { questionId:number, answerId: number, difficulty?: string }) {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = (authHeader || '').replace('Bearer ', '');
    const userId = this.auth.getUserIdFromToken(token) || 1;
    const ok = this.quiz.checkAnswer(body.questionId, body.answerId);
    this.quiz.updateCategoryStats(userId, body.questionId, ok);
    if (ok) {
      const d = (body.difficulty || 'medium').toLowerCase();
      const delta = d === 'hard' ? 3 : d === 'easy' ? 1 : 2;
      this.quiz.addScore(userId, delta, body.questionId, true);
    } else {
      this.quiz.addScore(userId, 0, body.questionId, false);
    }
    return { correct: ok };
  }

  @Get('score')
  getScore(@Req() req) {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = (authHeader || '').replace('Bearer ', '');
    const userId = this.auth.getUserIdFromToken(token) || 1;
    return this.quiz.getScore(userId);
  }

  @Get('stats')
  getStats(@Req() req) {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = (authHeader || '').replace('Bearer ', '');
    const userId = this.auth.getUserIdFromToken(token) || 1;
    return this.quiz.getCategoryStats(userId);
  }

  @Get('leaderboard')
  getLeaderboard(@Query('period') period?: string, @Query('cat') cat?: string) {
    const p = (period || 'weekly').toLowerCase();
    const allowed = ['daily','weekly','monthly','annual'];
    const safe = (allowed as string[]).includes(p) ? (p as 'daily'|'weekly'|'monthly'|'annual') : 'weekly';
    const entries = this.quiz.getLeaderboard(safe, cat ? Number(cat) : undefined);
    return entries.map(e => {
      const user = this.auth.getUserById(e.userId);
      const username = user?.username || `Utente #${e.userId}`;
      const avatar = { initials: (username || 'U').slice(0,2).toUpperCase() };
      return { ...e, username, avatar };
    });
  }

  @Get('achievements')
  getAchievements(@Req() req) {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = (authHeader || '').replace('Bearer ', '');
    const userId = this.auth.getUserIdFromToken(token) || 1;
    return this.quiz.getAchievements(userId);
  }

  // Challenges
  @Post('challenges')
  createChallenge(@Req() req, @Body() body: { opponentId?: number; opponentUsername?: string; categoryId?: number; difficulty: 'easy'|'medium'|'hard' }) {
    const token = (req.headers['authorization'] || '').toString().replace('Bearer ', '');
    const userId = this.auth.getUserIdFromToken(token) || 1;
    let opponentId = body.opponentId;
    if (!opponentId && body.opponentUsername) {
      const u = this.auth.getUserByUsername(body.opponentUsername);
      if (!u) return { success: false, message: 'Utente non trovato' };
      opponentId = u.id;
    }
    if (!opponentId) return { success: false, message: 'Specificare opponentUsername' };
    return this.quiz.createChallenge(userId, opponentId, body.categoryId, body.difficulty);
  }

  @Get('challenges')
  listChallenges(@Req() req) {
    const token = (req.headers['authorization'] || '').toString().replace('Bearer ', '');
    const userId = this.auth.getUserIdFromToken(token) || 1;
    return this.quiz.listChallenges(userId);
  }

  @Post('challenges/:id/accept')
  acceptChallenge(@Req() req, @Param('id') id: string) {
    const token = (req.headers['authorization'] || '').toString().replace('Bearer ', '');
    const userId = this.auth.getUserIdFromToken(token) || 1;
    return this.quiz.acceptChallenge(Number(id), userId);
  }

  @Post('challenges/:id/start')
  startChallenge(@Req() req, @Param('id') id: string) {
    const token = (req.headers['authorization'] || '').toString().replace('Bearer ', '');
    const userId = this.auth.getUserIdFromToken(token) || 1;
    return this.quiz.startChallenge(Number(id), userId);
  }

  @Post('challenges/:id/submit')
  submitChallenge(@Req() req, @Param('id') id: string, @Body() body: { delta: number }) {
    const token = (req.headers['authorization'] || '').toString().replace('Bearer ', '');
    const userId = this.auth.getUserIdFromToken(token) || 1;
    return this.quiz.submitChallengeScore(Number(id), userId, body.delta || 0);
  }

  @Post('challenges/:id/finish')
  finishChallenge(@Param('id') id: string) {
    return this.quiz.finishChallenge(Number(id));
  }

  @Get('friends')
  listFriendsApi(@Req() req) {
    const token = (req.headers['authorization'] || '').toString().replace('Bearer ', '');
    const userId = this.auth.getUserIdFromToken(token) || 1;
    return this.auth.listFriends(userId);
  }

  @Post('friends')
  addFriendApi(@Req() req, @Body() body: { username: string }) {
    const token = (req.headers['authorization'] || '').toString().replace('Bearer ', '');
    const userId = this.auth.getUserIdFromToken(token) || 1;
    return this.auth.addFriend(userId, body.username);
  }
}
