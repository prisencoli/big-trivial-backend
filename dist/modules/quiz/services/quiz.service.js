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
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("./prisma.service");
const categories = [
    { id: 1, name: 'Storia', colorHex: '#ffe28a' },
    { id: 2, name: 'Geografia', colorHex: '#8be2ff' },
    { id: 3, name: 'Scienza', colorHex: '#aaffbe' },
    { id: 4, name: 'Arte', colorHex: '#ff9ad2' },
    { id: 5, name: 'Sport', colorHex: '#f68e8e' },
    { id: 6, name: 'Spettacolo', colorHex: '#bfa6ff' }
];
const questions = [];
const answers = [];
const userScores = {};
const userCategoryStats = {};
const scoreEvents = [];
const challenges = [];
let challengeId = 1;
(function mockPopulate() {
    let qid = 1, aid = 1;
    const total = 1000;
    const basePerCat = Math.floor(total / categories.length);
    let remainder = total % categories.length;
    for (let c = 0; c < categories.length; c++) {
        const countForCat = basePerCat + (remainder > 0 ? 1 : 0);
        if (remainder > 0)
            remainder--;
        for (let i = 0; i < countForCat; i++) {
            const qtext = `Domanda ${qid} della categoria ${categories[c].name}`;
            questions.push({
                id: qid,
                questionText: qtext,
                categoryId: categories[c].id,
                timerSeconds: 20,
            });
            const correctIdx = Math.floor(Math.random() * 4);
            for (let k = 0; k < 4; k++) {
                answers.push({
                    id: aid++,
                    questionId: qid,
                    answerText: `Risposta ${String.fromCharCode(65 + k)} per Domanda ${qid}`,
                    isCorrect: k === correctIdx,
                });
            }
            qid++;
        }
    }
})();
let QuizService = class QuizService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getCategories() {
        try {
            const dbCats = await this.prisma.quizCategory.findMany();
            if (dbCats && dbCats.length > 0) {
                return dbCats.map(c => ({ id: c.id, name: c.name, colorHex: c.colorHex }));
            }
        }
        catch (_a) { }
        return categories;
    }
    async getRandomQuestion(catId, excludeIds = [], difficulty = 'medium') {
        var _a, _b;
        try {
            const where = {};
            if (catId)
                where.categoryId = catId;
            if (excludeIds && excludeIds.length)
                where.id = { notIn: excludeIds };
            const count = await this.prisma.quizQuestion.count({ where });
            if (count > 0) {
                const skip = Math.floor(Math.random() * count);
                const q = await this.prisma.quizQuestion.findFirst({ where, skip, take: 1, include: { answers: true } });
                if (q) {
                    const timers = { easy: 30, medium: 20, hard: 12 };
                    const shuffled = [...q.answers].sort(() => Math.random() - 0.5);
                    return {
                        id: q.id,
                        categoryId: q.categoryId,
                        questionText: q.questionText,
                        timerSeconds: (_a = timers[difficulty]) !== null && _a !== void 0 ? _a : q.timerSeconds,
                        answers: shuffled.map(a => ({ id: a.id, answerText: a.answerText }))
                    };
                }
            }
        }
        catch (_c) { }
        let qs = catId ? questions.filter(q => q.categoryId === catId) : questions;
        if (excludeIds.length) {
            const excl = new Set(excludeIds);
            qs = qs.filter(q => !excl.has(q.id));
        }
        if (qs.length === 0)
            return null;
        const idx = Math.floor(Math.random() * qs.length);
        const q = qs[idx];
        const timers = { easy: 30, medium: 20, hard: 12 };
        const timerSeconds = (_b = timers[difficulty]) !== null && _b !== void 0 ? _b : q.timerSeconds;
        return Object.assign(Object.assign({}, q), { timerSeconds, answers: answers.filter(a => a.questionId === q.id).map(({ id, answerText }) => ({ id, answerText })) });
    }
    async getDailyQuestion(catId, excludeIds = [], difficulty = 'medium') {
        var _a, _b;
        try {
            const where = {};
            if (catId)
                where.categoryId = catId;
            if (excludeIds && excludeIds.length)
                where.id = { notIn: excludeIds };
            const list = await this.prisma.quizQuestion.findMany({ where, include: { answers: true } });
            if (list.length > 0) {
                const daySeed = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
                const ordered = list
                    .map(q => ({ q, key: (q.id + daySeed) % 9973 }))
                    .sort((a, b) => a.key - b.key)
                    .map(x => x.q);
                const q = ordered[0];
                const timers = { easy: 30, medium: 20, hard: 12 };
                const shuffled = [...q.answers].sort(() => Math.random() - 0.5);
                return {
                    id: q.id,
                    categoryId: q.categoryId,
                    questionText: q.questionText,
                    timerSeconds: (_a = timers[difficulty]) !== null && _a !== void 0 ? _a : q.timerSeconds,
                    answers: shuffled.map(a => ({ id: a.id, answerText: a.answerText }))
                };
            }
        }
        catch (_c) { }
        const daySeed = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
        let qs = catId ? questions.filter(q => q.categoryId === catId) : questions;
        if (excludeIds.length) {
            const excl = new Set(excludeIds);
            qs = qs.filter(q => !excl.has(q.id));
        }
        if (qs.length === 0)
            return null;
        qs = qs
            .map(q => ({ q, key: (q.id + daySeed) % 9973 }))
            .sort((a, b) => a.key - b.key)
            .map(x => x.q);
        const q = qs[0];
        const timers = { easy: 30, medium: 20, hard: 12 };
        const timerSeconds = (_b = timers[difficulty]) !== null && _b !== void 0 ? _b : q.timerSeconds;
        return Object.assign(Object.assign({}, q), { timerSeconds, answers: answers.filter(a => a.questionId === q.id).map(({ id, answerText }) => ({ id, answerText })) });
    }
    async checkAnswer(questionId, answerId) {
        var _a, _b;
        try {
            const answer = await this.prisma.quizAnswer.findFirst({
                where: { id: answerId, questionId: questionId }
            });
            if (answer) {
                return answer.isCorrect;
            }
        }
        catch (_c) { }
        return (_b = (_a = answers.find(a => a.questionId === questionId && a.id === answerId)) === null || _a === void 0 ? void 0 : _a.isCorrect) !== null && _b !== void 0 ? _b : false;
    }
    addScore(userId, delta, questionId, correct = true) {
        var _a;
        userId = userId || 1;
        userScores[userId] = (userScores[userId] || 0) + delta;
        const catId = questionId ? (((_a = questions.find(q => q.id === questionId)) === null || _a === void 0 ? void 0 : _a.categoryId) || 0) : 0;
        scoreEvents.push({ userId, delta, at: Date.now(), categoryId: catId, correct });
        return userScores[userId];
    }
    getScore(userId) {
        userId = userId || 1;
        return { userId, score: userScores[userId] || 0 };
    }
    async updateCategoryStats(userId, questionId, correct) {
        let categoryId;
        try {
            const q = await this.prisma.quizQuestion.findUnique({
                where: { id: questionId },
                select: { categoryId: true }
            });
            if (q)
                categoryId = q.categoryId;
        }
        catch (_a) { }
        if (!categoryId) {
            const q = questions.find(q => q.id === questionId);
            if (!q)
                return;
            categoryId = q.categoryId;
        }
        if (!userCategoryStats[userId])
            userCategoryStats[userId] = {};
        if (!userCategoryStats[userId][categoryId])
            userCategoryStats[userId][categoryId] = { correct: 0, total: 0 };
        const s = userCategoryStats[userId][categoryId];
        s.total += 1;
        if (correct)
            s.correct += 1;
    }
    async getCategoryStats(userId) {
        let dbCategories = [];
        try {
            dbCategories = await this.prisma.quizCategory.findMany();
        }
        catch (_a) { }
        const catsToUse = dbCategories.length > 0
            ? dbCategories.map(c => ({ id: c.id, name: c.name, colorHex: c.colorHex }))
            : categories;
        const perCat = userCategoryStats[userId] || {};
        return catsToUse.map(c => {
            const s = perCat[c.id] || { correct: 0, total: 0 };
            const percent = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
            return { categoryId: c.id, name: c.name, colorHex: c.colorHex, correct: s.correct, total: s.total, percent };
        });
    }
    getLeaderboard(period, catId) {
        const now = Date.now();
        const ms = {
            daily: 1 * 24 * 60 * 60 * 1000,
            weekly: 7 * 24 * 60 * 60 * 1000,
            monthly: 30 * 24 * 60 * 60 * 1000,
            annual: 365 * 24 * 60 * 60 * 1000,
        }[period];
        const from = now - ms;
        const sums = {};
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
    async getAchievements(userId) {
        const evs = scoreEvents.filter(e => e.userId === userId).sort((a, b) => a.at - b.at);
        const totalCorrect = evs.filter(e => e.correct && e.delta > 0).length;
        let streak = 0;
        for (let i = evs.length - 1; i >= 0; i--) {
            if (evs[i].correct && evs[i].delta > 0)
                streak++;
            else
                break;
        }
        const perCat = await this.getCategoryStats(userId);
        const masters = perCat.filter(c => c.total >= 50 && c.percent >= 70).map(c => `Maestro ${c.name}`);
        const badges = [];
        if (streak >= 5)
            badges.push('Streak 5');
        if (streak >= 10)
            badges.push('Streak 10');
        if (streak >= 20)
            badges.push('Streak 20');
        if (totalCorrect >= 100)
            badges.push('100 Corrette');
        badges.push(...masters);
        return { totalCorrect, streak, badges };
    }
    createChallenge(creatorId, opponentId, categoryId, difficulty) {
        const ch = {
            id: challengeId++,
            creatorId,
            opponentId,
            categoryId,
            difficulty,
            seed: Math.floor(Math.random() * 1000000),
            status: 'PENDING',
            createdAt: Date.now(),
            scores: {}
        };
        challenges.push(ch);
        return ch;
    }
    acceptChallenge(chId, userId) {
        const ch = challenges.find(c => c.id === chId && c.opponentId === userId);
        if (!ch)
            return { success: false, message: 'Sfida non trovata' };
        if (ch.status !== 'PENDING')
            return { success: false, message: 'Sfida non più disponibile' };
        ch.status = 'ACCEPTED';
        return { success: true };
    }
    startChallenge(chId, userId) {
        const ch = challenges.find(c => c.id === chId && (c.creatorId === userId || c.opponentId === userId));
        if (!ch)
            return { success: false, message: 'Sfida non trovata' };
        if (ch.status === 'PENDING')
            ch.status = 'ACCEPTED';
        if (!ch.startedAt)
            ch.startedAt = Date.now();
        ch.status = 'IN_PROGRESS';
        return { success: true, seed: ch.seed, difficulty: ch.difficulty, categoryId: ch.categoryId };
    }
    submitChallengeScore(chId, userId, scoreDelta) {
        const ch = challenges.find(c => c.id === chId && (c.creatorId === userId || c.opponentId === userId));
        if (!ch)
            return { success: false, message: 'Sfida non trovata' };
        ch.scores[userId] = (ch.scores[userId] || 0) + scoreDelta;
        return { success: true };
    }
    finishChallenge(chId) {
        const ch = challenges.find(c => c.id === chId);
        if (!ch)
            return { success: false };
        ch.status = 'COMPLETED';
        ch.finishedAt = Date.now();
        const creatorScore = ch.scores[ch.creatorId] || 0;
        const opponentScore = ch.scores[ch.opponentId] || 0;
        const winnerId = creatorScore === opponentScore ? undefined : (creatorScore > opponentScore ? ch.creatorId : ch.opponentId);
        return { success: true, winnerId, creatorScore, opponentScore };
    }
    listChallenges(userId) {
        return challenges.filter(c => c.creatorId === userId || c.opponentId === userId);
    }
    async importFromJson(payload) {
        var _a;
        try {
            if (Array.isArray(payload === null || payload === void 0 ? void 0 : payload.categories)) {
                for (const c of payload.categories) {
                    if (!(c === null || c === void 0 ? void 0 : c.name) || !(c === null || c === void 0 ? void 0 : c.colorHex))
                        continue;
                    await this.prisma.quizCategory.upsert({
                        where: { name: c.name },
                        update: { colorHex: c.colorHex },
                        create: { name: c.name, colorHex: c.colorHex },
                    });
                }
            }
            const catList = await this.prisma.quizCategory.findMany();
            const nameToId = new Map(catList.map(c => [c.name, c.id]));
            let created = 0;
            if (Array.isArray(payload === null || payload === void 0 ? void 0 : payload.questions)) {
                for (const q of payload.questions) {
                    const categoryId = q.categoryId || nameToId.get(q.categoryName);
                    if (!categoryId || !(q === null || q === void 0 ? void 0 : q.questionText) || !Array.isArray(q === null || q === void 0 ? void 0 : q.answers) || q.answers.length === 0)
                        continue;
                    const createdQ = await this.prisma.quizQuestion.create({
                        data: {
                            categoryId,
                            questionText: q.questionText,
                            timerSeconds: (_a = q.timerSeconds) !== null && _a !== void 0 ? _a : 20,
                            answers: {
                                create: q.answers.map((a) => ({ answerText: a.text, isCorrect: !!a.isCorrect }))
                            }
                        }
                    });
                    if (createdQ)
                        created++;
                }
            }
            return { success: true, createdQuestions: created };
        }
        catch (e) {
            return { success: false, message: (e === null || e === void 0 ? void 0 : e.message) || 'Import failed' };
        }
    }
};
exports.QuizService = QuizService;
exports.QuizService = QuizService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], QuizService);
//# sourceMappingURL=quiz.service.js.map