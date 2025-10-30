"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizService = void 0;
const common_1 = require("@nestjs/common");
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
    getCategories() { return categories; }
    getRandomQuestion(catId, excludeIds = [], difficulty = 'medium') {
        var _a;
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
        const timerSeconds = (_a = timers[difficulty]) !== null && _a !== void 0 ? _a : q.timerSeconds;
        return Object.assign(Object.assign({}, q), { timerSeconds, answers: answers.filter(a => a.questionId === q.id).map(({ id, answerText }) => ({ id, answerText })) });
    }
    getDailyQuestion(catId, excludeIds = [], difficulty = 'medium') {
        var _a;
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
        const timerSeconds = (_a = timers[difficulty]) !== null && _a !== void 0 ? _a : q.timerSeconds;
        return Object.assign(Object.assign({}, q), { timerSeconds, answers: answers.filter(a => a.questionId === q.id).map(({ id, answerText }) => ({ id, answerText })) });
    }
    checkAnswer(questionId, answerId) {
        var _a, _b;
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
    updateCategoryStats(userId, questionId, correct) {
        const q = questions.find(q => q.id === questionId);
        if (!q)
            return;
        if (!userCategoryStats[userId])
            userCategoryStats[userId] = {};
        if (!userCategoryStats[userId][q.categoryId])
            userCategoryStats[userId][q.categoryId] = { correct: 0, total: 0 };
        const s = userCategoryStats[userId][q.categoryId];
        s.total += 1;
        if (correct)
            s.correct += 1;
    }
    getCategoryStats(userId) {
        const perCat = userCategoryStats[userId] || {};
        return categories.map(c => {
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
    getAchievements(userId) {
        const evs = scoreEvents.filter(e => e.userId === userId).sort((a, b) => a.at - b.at);
        const totalCorrect = evs.filter(e => e.correct && e.delta > 0).length;
        let streak = 0;
        for (let i = evs.length - 1; i >= 0; i--) {
            if (evs[i].correct && evs[i].delta > 0)
                streak++;
            else
                break;
        }
        const perCat = this.getCategoryStats(userId);
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
};
exports.QuizService = QuizService;
exports.QuizService = QuizService = __decorate([
    (0, common_1.Injectable)()
], QuizService);
//# sourceMappingURL=quiz.service.js.map