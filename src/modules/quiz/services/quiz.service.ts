import { Injectable } from '@nestjs/common';
import { QuizQuestion } from '../entities/question.entity';
import { QuizAnswer } from '../entities/answer.entity';
import { QuizCategory } from '../entities/category.entity';
import { PrismaService } from './prisma.service';

const categories: QuizCategory[] = [
  { id: 1, name: 'Storia', colorHex: '#ffe28a' },
  { id: 2, name: 'Geografia', colorHex: '#8be2ff' },
  { id: 3, name: 'Scienza', colorHex: '#aaffbe' },
  { id: 4, name: 'Arte', colorHex: '#ff9ad2' },
  { id: 5, name: 'Sport', colorHex: '#f68e8e' },
  { id: 6, name: 'Spettacolo', colorHex: '#bfa6ff' }
];

// MOCK 1000 domande (solo struttura, i testi sarebbero reali!)
const questions: QuizQuestion[] = [];
const answers: QuizAnswer[] = [];

// Punteggi e stats mock per utente
type CatStats = { correct: number; total: number };
const userScores: Record<number, number> = {};
const userCategoryStats: Record<number, Record<number, CatStats>> = {};

// Log eventi per leaderboard/achievements
type ScoreEvent = { userId: number; delta: number; at: number; categoryId: number; correct: boolean };
const scoreEvents: ScoreEvent[] = [];

// Challenges (mock)
type ChallengeStatus = 'PENDING'|'ACCEPTED'|'IN_PROGRESS'|'COMPLETED'|'CANCELED';
type Challenge = {
  id: number;
  creatorId: number;
  opponentId: number;
  categoryId?: number;
  difficulty: 'easy'|'medium'|'hard';
  seed: number; // per generare stessa sequenza
  status: ChallengeStatus;
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
  scores: Record<number, number>; // userId -> score
};
const challenges: Challenge[] = [];
let challengeId = 1;

// Funzione helper per mock questionario
(function mockPopulate() {
  let qid = 1, aid = 1;
  const total = 1000;
  const basePerCat = Math.floor(total / categories.length); // 166
  let remainder = total % categories.length; // 4

  for (let c = 0; c < categories.length; c++) {
    const countForCat = basePerCat + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;

    for (let i = 0; i < countForCat; i++) {
      const qtext = `Domanda ${qid} della categoria ${categories[c].name}`;
      questions.push({
        id: qid,
        questionText: qtext,
        categoryId: categories[c].id,
        timerSeconds: 20,
      });
      const correctIdx = Math.floor(Math.random()*4);
      for (let k = 0; k < 4; k++) {
        answers.push({
          id: aid++,
          questionId: qid,
          answerText: `Risposta ${String.fromCharCode(65+k)} per Domanda ${qid}`,
          isCorrect: k === correctIdx,
        });
      }
      qid++;
    }
  }
})();

@Injectable()
export class QuizService {
  constructor(private readonly prisma: PrismaService) {}

  async getCategories() {
    try {
      const dbCats = await this.prisma.quizCategory.findMany();
      if (dbCats && dbCats.length > 0) {
        return dbCats.map(c => ({ id: c.id, name: c.name, colorHex: c.colorHex }));
      }
    } catch {}
    return categories;
  }

  async getRandomQuestion(catId?: number, excludeIds: number[] = [], difficulty: 'easy'|'medium'|'hard' = 'medium') {
    // prova DB
    try {
      const where: any = {};
      if (catId) where.categoryId = catId;
      if (excludeIds && excludeIds.length) where.id = { notIn: excludeIds };
      const count = await this.prisma.quizQuestion.count({ where });
      if (count > 0) {
        const skip = Math.floor(Math.random() * count);
        const q = await this.prisma.quizQuestion.findFirst({ where, skip, take: 1, include: { answers: true } });
        if (q) {
          const timers = { easy: 30, medium: 20, hard: 12 } as const;
          return {
            id: q.id,
            categoryId: q.categoryId,
            questionText: q.questionText,
            timerSeconds: timers[difficulty] ?? q.timerSeconds,
            answers: q.answers.map(a => ({ id: a.id, answerText: a.answerText }))
          };
        }
      }
    } catch {}

    // fallback MOCK
    let qs = catId ? questions.filter(q=>q.categoryId===catId) : questions;
    if (excludeIds.length) {
      const excl = new Set(excludeIds);
      qs = qs.filter(q => !excl.has(q.id));
    }
    if (qs.length === 0) return null;
    const idx = Math.floor(Math.random()*qs.length);
    const q = qs[idx];

    const timers = { easy: 30, medium: 20, hard: 12 };
    const timerSeconds = timers[difficulty] ?? q.timerSeconds;

    return {
      ...q,
      timerSeconds,
      answers: answers.filter(a=>a.questionId===q.id).map(({id,answerText})=>({id,answerText}))
    };
  }

  async getDailyQuestion(catId?: number, excludeIds: number[] = [], difficulty: 'easy'|'medium'|'hard' = 'medium') {
    // Per semplicità usiamo comunque la logica deterministica sul set DB se presente
    try {
      const where: any = {};
      if (catId) where.categoryId = catId;
      if (excludeIds && excludeIds.length) where.id = { notIn: excludeIds };
      const list = await this.prisma.quizQuestion.findMany({ where, include: { answers: true } });
      if (list.length > 0) {
        const daySeed = Math.floor(Date.now() / (24*60*60*1000));
        const ordered = list
          .map(q => ({ q, key: (q.id + daySeed) % 9973 }))
          .sort((a,b)=>a.key-b.key)
          .map(x=>x.q);
        const q = ordered[0];
        const timers = { easy: 30, medium: 20, hard: 12 } as const;
        return {
          id: q.id,
          categoryId: q.categoryId,
          questionText: q.questionText,
          timerSeconds: timers[difficulty] ?? q.timerSeconds,
          answers: q.answers.map(a => ({ id: a.id, answerText: a.answerText }))
        };
      }
    } catch {}

    // fallback MOCK
    const daySeed = Math.floor(Date.now() / (24*60*60*1000));
    let qs = catId ? questions.filter(q=>q.categoryId===catId) : questions;
    if (excludeIds.length) {
      const excl = new Set(excludeIds);
      qs = qs.filter(q => !excl.has(q.id));
    }
    if (qs.length === 0) return null;
    qs = qs
      .map(q => ({ q, key: (q.id + daySeed) % 9973 }))
      .sort((a,b)=>a.key-b.key)
      .map(x=>x.q);
    const q = qs[0];
    const timers = { easy: 30, medium: 20, hard: 12 };
    const timerSeconds = timers[difficulty] ?? q.timerSeconds;
    return {
      ...q,
      timerSeconds,
      answers: answers.filter(a=>a.questionId===q.id).map(({id,answerText})=>({id,answerText}))
    };
  }

  checkAnswer(questionId: number, answerId: number) {
    return answers.find(a=>a.questionId===questionId && a.id===answerId)?.isCorrect ?? false;
  }

  addScore(userId: number, delta: number, questionId?: number, correct: boolean = true) {
    userId = userId || 1;
    userScores[userId] = (userScores[userId] || 0) + delta;
    const catId = questionId ? (questions.find(q=>q.id===questionId)?.categoryId || 0) : 0;
    scoreEvents.push({ userId, delta, at: Date.now(), categoryId: catId, correct });
    return userScores[userId];
  }

  getScore(userId: number) {
    userId = userId || 1;
    return { userId, score: userScores[userId] || 0 };
  }

  // Tracking per categoria
  updateCategoryStats(userId: number, questionId: number, correct: boolean) {
    const q = questions.find(q => q.id === questionId);
    if (!q) return;
    if (!userCategoryStats[userId]) userCategoryStats[userId] = {};
    if (!userCategoryStats[userId][q.categoryId]) userCategoryStats[userId][q.categoryId] = { correct: 0, total: 0 };
    const s = userCategoryStats[userId][q.categoryId];
    s.total += 1;
    if (correct) s.correct += 1;
  }

  getCategoryStats(userId: number) {
    const perCat = userCategoryStats[userId] || {};
    return categories.map(c => {
      const s = perCat[c.id] || { correct: 0, total: 0 };
      const percent = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
      return { categoryId: c.id, name: c.name, colorHex: c.colorHex, correct: s.correct, total: s.total, percent };
    });
  }

  // Leaderboard timeframe: weekly/monthly/annual/daily con filtro categoria
  getLeaderboard(period: 'daily'|'weekly' | 'monthly' | 'annual', catId?: number) {
    const now = Date.now();
    const ms = {
      daily: 1 * 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
      monthly: 30 * 24 * 60 * 60 * 1000,
      annual: 365 * 24 * 60 * 60 * 1000,
    }[period];
    const from = now - ms;
    const sums: Record<number, number> = {};
    for (const ev of scoreEvents) {
      if (ev.at >= from && (catId ? ev.categoryId === catId : true)) {
        sums[ev.userId] = (sums[ev.userId] || 0) + ev.delta;
      }
    }
    const entries = Object.entries(sums)
      .map(([userId, score]) => ({ userId: Number(userId), score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
    return entries;
  }

  getAchievements(userId: number) {
    const evs = scoreEvents.filter(e=>e.userId===userId).sort((a,b)=>a.at-b.at);
    const totalCorrect = evs.filter(e=>e.correct && e.delta>0).length;
    // streak semplice: risposte corrette consecutive adesso
    let streak = 0;
    for (let i = evs.length-1; i>=0; i--) {
      if (evs[i].correct && e delta>0) streak++; else break;
    }
    const perCat = this.getCategoryStats(userId);
    const masters = perCat.filter(c=>c.total>=50 && c.percent>=70).map(c=>`Maestro ${c.name}`);
    const badges: string[] = [];
    if (streak>=5) badges.push('Streak 5');
    if (streak>=10) badges.push('Streak 10');
    if (streak>=20) badges.push('Streak 20');
    if (totalCorrect>=100) badges.push('100 Corrette');
    badges.push(...masters);
    return { totalCorrect, streak, badges };
  }

  // Challenges API (mock)
  createChallenge(creatorId: number, opponentId: number, categoryId: number | undefined, difficulty: 'easy'|'medium'|'hard') {
    const ch: Challenge = {
      id: challengeId++,
      creatorId,
      opponentId,
      categoryId,
      difficulty,
      seed: Math.floor(Math.random()*1_000_000),
      status: 'PENDING',
      createdAt: Date.now(),
      scores: {}
    };
    challenges.push(ch);
    return ch;
  }
  acceptChallenge(chId: number, userId: number) {
    const ch = challenges.find(c=>c.id===chId && c.opponentId===userId);
    if (!ch) return { success: false, message: 'Sfida non trovata' };
    if (ch.status !== 'PENDING') return { success: false, message: 'Sfida non più disponibile' };
    ch.status = 'ACCEPTED';
    return { success: true };
  }
  startChallenge(chId: number, userId: number) {
    const ch = challenges.find(c=>c.id===chId && (c.creatorId===userId || c.opponentId===userId));
    if (!ch) return { success: false, message: 'Sfida non trovata' };
    if (ch.status === 'PENDING') ch.status = 'ACCEPTED';
    if (!ch.startedAt) ch.startedAt = Date.now();
    ch.status = 'IN_PROGRESS';
    return { success: true, seed: ch.seed, difficulty: ch.difficulty, categoryId: ch.categoryId };
  }
  submitChallengeScore(chId: number, userId: number, scoreDelta: number) {
    const ch = challenges.find(c=>c.id===chId && (c.creatorId===userId || c.opponentId===userId));
    if (!ch) return { success: false, message: 'Sfida non trovata' };
    ch.scores[userId] = (ch.scores[userId] || 0) + scoreDelta;
    // completa quando entrambi hanno almeno un punteggio e 10 domande? (mock: se chiamato con finish=true altrove)
    return { success: true };
  }
  finishChallenge(chId: number) {
    const ch = challenges.find(c=>c.id===chId);
    if (!ch) return { success: false };
    ch.status = 'COMPLETED';
    ch.finishedAt = Date.now();
    const creatorScore = ch.scores[ch.creatorId] || 0;
    const opponentScore = ch.scores[ch.opponentId] || 0;
    const winnerId = creatorScore === opponentScore ? undefined : (creatorScore > opponentScore ? ch.creatorId : ch.opponentId);
    return { success: true, winnerId, creatorScore, opponentScore };
  }
  listChallenges(userId: number) {
    return challenges.filter(c=>c.creatorId===userId || c.opponentId===userId);
  }
}
