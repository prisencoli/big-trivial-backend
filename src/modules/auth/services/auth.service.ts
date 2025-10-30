import { Injectable } from '@nestjs/common';
import { RegisterUserDto } from '../dto/register-user.dto';
import { LoginUserDto } from '../dto/login-user.dto';
import { User } from '../entities/user.entity';
// import * as bcrypt from 'bcryptjs';

const users: User[] = [];
let idCounter = 1;

const sessions: Record<string, number> = {};
const friends: Record<number, number[]> = {};

function generateJwtMock(userId: number): string {
  return 'mockedjwt.' + userId + '.' + Math.floor(Math.random() * 1000000);
}

@Injectable()
export class AuthService {
  async register(dto: RegisterUserDto): Promise<{ success: boolean; data?: any; message?: string }> {
    if (users.find(u => u.email === dto.email)) {
      return { success: false, message: 'Email già registrata' };
    }
    // const passwordHash = await bcrypt.hash(dto.password, 10);
    const passwordHash = 'mockhash-' + dto.password; // MOCK
    const user: User = { id: idCounter++, email: dto.email, username: dto.username, passwordHash };
    users.push(user);
    return { success: true, data: { id: user.id, email: user.email, username: user.username } };
  }

  async login(dto: LoginUserDto) {
    const user = users.find(u => u.email === dto.email);
    if (!user) return { success: false, message: 'Credenziali non valide' };
    // const ok = await bcrypt.compare(dto.password, user.passwordHash)
    const ok = user.passwordHash === 'mockhash-' + dto.password;
    if (!ok) return { success: false, message: 'Credenziali non valide' };
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

  getUserIdFromToken(token: string): number | null {
    // MOCK, production: verify JWT
    return sessions[token] || null;
  }

  getUserById(id: number): User | undefined {
    return users.find(u => u.id === id);
  }

  getUserByUsername(username: string): User | undefined {
    return users.find(u => u.username?.toLowerCase() === username.toLowerCase());
  }

  addFriend(userId: number, friendUsername: string) {
    const friend = this.getUserByUsername(friendUsername);
    if (!friend) return { success: false, message: 'Utente non trovato' };
    if (friend.id === userId) return { success: false, message: 'Non puoi aggiungere te stesso' };
    friends[userId] = friends[userId] || [];
    if (!friends[userId].includes(friend.id)) friends[userId].push(friend.id);
    return { success: true };
  }

  listFriends(userId: number) {
    const ids = friends[userId] || [];
    return ids.map(id => {
      const u = this.getUserById(id);
      return u ? { id: u.id, username: u.username } : { id, username: `Utente #${id}` };
    });
  }
}
