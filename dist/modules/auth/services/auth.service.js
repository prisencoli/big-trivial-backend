"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const users = [];
let idCounter = 1;
const sessions = {};
const friends = {};
function generateJwtMock(userId) {
    return 'mockedjwt.' + userId + '.' + Math.floor(Math.random() * 1000000);
}
let AuthService = class AuthService {
    async register(dto) {
        if (users.find(u => u.email === dto.email)) {
            return { success: false, message: 'Email già registrata' };
        }
        const passwordHash = 'mockhash-' + dto.password;
        const user = { id: idCounter++, email: dto.email, username: dto.username, passwordHash };
        users.push(user);
        return { success: true, data: { id: user.id, email: user.email, username: user.username } };
    }
    async login(dto) {
        const user = users.find(u => u.email === dto.email);
        if (!user)
            return { success: false, message: 'Credenziali non valide' };
        const ok = user.passwordHash === 'mockhash-' + dto.password;
        if (!ok)
            return { success: false, message: 'Credenziali non valide' };
        const token = generateJwtMock(user.id);
        sessions[token] = user.id;
        return {
            success: true,
            data: {
                token,
                user: { id: user.id, email: user.email, username: user.username }
            }
        };
    }
    getUserIdFromToken(token) {
        return sessions[token] || null;
    }
    getUserById(id) {
        return users.find(u => u.id === id);
    }
    getUserByUsername(username) {
        return users.find(u => { var _a; return ((_a = u.username) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === username.toLowerCase(); });
    }
    addFriend(userId, friendUsername) {
        const friend = this.getUserByUsername(friendUsername);
        if (!friend)
            return { success: false, message: 'Utente non trovato' };
        if (friend.id === userId)
            return { success: false, message: 'Non puoi aggiungere te stesso' };
        friends[userId] = friends[userId] || [];
        if (!friends[userId].includes(friend.id))
            friends[userId].push(friend.id);
        return { success: true };
    }
    listFriends(userId) {
        const ids = friends[userId] || [];
        return ids.map(id => {
            const u = this.getUserById(id);
            return u ? { id: u.id, username: u.username } : { id, username: `Utente #${id}` };
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)()
], AuthService);
//# sourceMappingURL=auth.service.js.map