import { Controller, Post, Body, BadRequestException, Get, Req, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { RegisterUserDto } from '../dto/register-user.dto';
import { LoginUserDto } from '../dto/login-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterUserDto) {
    const res = await this.authService.register(dto);
    if (!res.success) throw new BadRequestException(res.message);
    return { message: 'Registrazione avvenuta con successo', ...res.data };
  }

  @Post('login')
  async login(@Body() dto: LoginUserDto) {
    const res = await this.authService.login(dto);
    if (!res.success) throw new BadRequestException(res.message);
    return res.data;
  }

  @Get('me')
  async me(@Req() req) {
    const auth = req.headers['authorization'];
    const token = (auth || '').replace('Bearer ', '');
    const userId = this.authService.getUserIdFromToken(token);
    if (!userId) throw new UnauthorizedException();
    const user = this.authService.getUserById(userId);
    if (!user) throw new UnauthorizedException();
    return { id: user.id, email: user.email, username: user.username };
  }
}
