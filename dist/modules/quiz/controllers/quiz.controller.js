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
exports.QuizController = void 0;
const common_1 = require("@nestjs/common");
const quiz_service_1 = require("../services/quiz.service");
const auth_service_1 = require("../../auth/services/auth.service");
let QuizController = class QuizController {
    constructor(quiz, auth) {
        this.quiz = quiz;
        this.auth = auth;
    }
    getCategories() {
        return this.quiz.getCategories();
    }
    getRandom(catId, exclude, diff) {
        const excludeIds = (exclude || '')
            .split(',')
            .map(s => Number(s.trim()))
            .filter(n => !!n);
        const d = (diff || 'medium').toLowerCase();
        const allowed = ['easy', 'medium', 'hard'];
        const difficulty = allowed.includes(d) ? d : 'medium';
        return this.quiz.getRandomQuestion(catId ? Number(catId) : undefined, excludeIds, difficulty);
    }
    getDailyNext(catId, exclude, diff) {
        const excludeIds = (exclude || '')
            .split(',')
            .map(s => Number(s.trim()))
            .filter(n => !!n);
        const d = (diff || 'medium').toLowerCase();
        const allowed = ['easy', 'medium', 'hard'];
        const difficulty = allowed.includes(d) ? d : 'medium';
        return this.quiz.getDailyQuestion(catId ? Number(catId) : undefined, excludeIds, difficulty);
    }
    async checkAnswer(req, body) {
        const authHeader = req.headers['authorization'];
        const token = (authHeader || '').replace('Bearer ', '');
        const userId = this.auth.getUserIdFromToken(token) || 1;
        const ok = await this.quiz.checkAnswer(body.questionId, body.answerId);
        await this.quiz.updateCategoryStats(userId, body.questionId, ok);
        if (ok) {
            const d = (body.difficulty || 'medium').toLowerCase();
            const delta = d === 'hard' ? 3 : d === 'easy' ? 1 : 2;
            this.quiz.addScore(userId, delta, body.questionId, true);
        }
        else {
            this.quiz.addScore(userId, 0, body.questionId, false);
        }
        return { correct: ok };
    }
    getScore(req) {
        const authHeader = req.headers['authorization'];
        const token = (authHeader || '').replace('Bearer ', '');
        const userId = this.auth.getUserIdFromToken(token) || 1;
        return this.quiz.getScore(userId);
    }
    async getStats(req) {
        const authHeader = req.headers['authorization'];
        const token = (authHeader || '').replace('Bearer ', '');
        const userId = this.auth.getUserIdFromToken(token) || 1;
        return this.quiz.getCategoryStats(userId);
    }
    getLeaderboard(period, cat) {
        const p = (period || 'weekly').toLowerCase();
        const allowed = ['daily', 'weekly', 'monthly', 'annual'];
        const safe = allowed.includes(p) ? p : 'weekly';
        const entries = this.quiz.getLeaderboard(safe, cat ? Number(cat) : undefined);
        return entries.map(e => {
            const user = this.auth.getUserById(e.userId);
            const username = (user === null || user === void 0 ? void 0 : user.username) || `Utente #${e.userId}`;
            const avatar = { initials: (username || 'U').slice(0, 2).toUpperCase() };
            return Object.assign(Object.assign({}, e), { username, avatar });
        });
    }
    async getAchievements(req) {
        const authHeader = req.headers['authorization'];
        const token = (authHeader || '').replace('Bearer ', '');
        const userId = this.auth.getUserIdFromToken(token) || 1;
        return this.quiz.getAchievements(userId);
    }
    createChallenge(req, body) {
        const token = (req.headers['authorization'] || '').toString().replace('Bearer ', '');
        const userId = this.auth.getUserIdFromToken(token) || 1;
        let opponentId = body.opponentId;
        if (!opponentId && body.opponentUsername) {
            const u = this.auth.getUserByUsername(body.opponentUsername);
            if (!u)
                return { success: false, message: 'Utente non trovato' };
            opponentId = u.id;
        }
        if (!opponentId)
            return { success: false, message: 'Specificare opponentUsername' };
        return this.quiz.createChallenge(userId, opponentId, body.categoryId, body.difficulty);
    }
    listChallenges(req) {
        const token = (req.headers['authorization'] || '').toString().replace('Bearer ', '');
        const userId = this.auth.getUserIdFromToken(token) || 1;
        return this.quiz.listChallenges(userId);
    }
    acceptChallenge(req, id) {
        const token = (req.headers['authorization'] || '').toString().replace('Bearer ', '');
        const userId = this.auth.getUserIdFromToken(token) || 1;
        return this.quiz.acceptChallenge(Number(id), userId);
    }
    startChallenge(req, id) {
        const token = (req.headers['authorization'] || '').toString().replace('Bearer ', '');
        const userId = this.auth.getUserIdFromToken(token) || 1;
        return this.quiz.startChallenge(Number(id), userId);
    }
    submitChallenge(req, id, body) {
        const token = (req.headers['authorization'] || '').toString().replace('Bearer ', '');
        const userId = this.auth.getUserIdFromToken(token) || 1;
        return this.quiz.submitChallengeScore(Number(id), userId, body.delta || 0);
    }
    finishChallenge(id) {
        return this.quiz.finishChallenge(Number(id));
    }
    adminImport(body) {
        return this.quiz.importFromJson(body);
    }
    listFriendsApi(req) {
        const token = (req.headers['authorization'] || '').toString().replace('Bearer ', '');
        const userId = this.auth.getUserIdFromToken(token) || 1;
        return this.auth.listFriends(userId);
    }
    addFriendApi(req, body) {
        const token = (req.headers['authorization'] || '').toString().replace('Bearer ', '');
        const userId = this.auth.getUserIdFromToken(token) || 1;
        return this.auth.addFriend(userId, body.username);
    }
};
exports.QuizController = QuizController;
__decorate([
    (0, common_1.Get)('categories'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], QuizController.prototype, "getCategories", null);
__decorate([
    (0, common_1.Get)('question/random'),
    __param(0, (0, common_1.Query)('cat')),
    __param(1, (0, common_1.Query)('exclude')),
    __param(2, (0, common_1.Query)('difficulty')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], QuizController.prototype, "getRandom", null);
__decorate([
    (0, common_1.Get)('daily/next'),
    __param(0, (0, common_1.Query)('cat')),
    __param(1, (0, common_1.Query)('exclude')),
    __param(2, (0, common_1.Query)('difficulty')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], QuizController.prototype, "getDailyNext", null);
__decorate([
    (0, common_1.Post)('answer'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], QuizController.prototype, "checkAnswer", null);
__decorate([
    (0, common_1.Get)('score'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], QuizController.prototype, "getScore", null);
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QuizController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('leaderboard'),
    __param(0, (0, common_1.Query)('period')),
    __param(1, (0, common_1.Query)('cat')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], QuizController.prototype, "getLeaderboard", null);
__decorate([
    (0, common_1.Get)('achievements'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QuizController.prototype, "getAchievements", null);
__decorate([
    (0, common_1.Post)('challenges'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], QuizController.prototype, "createChallenge", null);
__decorate([
    (0, common_1.Get)('challenges'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], QuizController.prototype, "listChallenges", null);
__decorate([
    (0, common_1.Post)('challenges/:id/accept'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], QuizController.prototype, "acceptChallenge", null);
__decorate([
    (0, common_1.Post)('challenges/:id/start'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], QuizController.prototype, "startChallenge", null);
__decorate([
    (0, common_1.Post)('challenges/:id/submit'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], QuizController.prototype, "submitChallenge", null);
__decorate([
    (0, common_1.Post)('challenges/:id/finish'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QuizController.prototype, "finishChallenge", null);
__decorate([
    (0, common_1.Post)('admin/import'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], QuizController.prototype, "adminImport", null);
__decorate([
    (0, common_1.Get)('friends'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], QuizController.prototype, "listFriendsApi", null);
__decorate([
    (0, common_1.Post)('friends'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], QuizController.prototype, "addFriendApi", null);
exports.QuizController = QuizController = __decorate([
    (0, common_1.Controller)('quiz'),
    __metadata("design:paramtypes", [quiz_service_1.QuizService, auth_service_1.AuthService])
], QuizController);
//# sourceMappingURL=quiz.controller.js.map