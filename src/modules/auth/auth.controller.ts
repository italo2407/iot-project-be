// src/auth/auth.controller.ts
import {
  Controller,
  Get,
  Req,
  UseGuards,
  Res,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';

@Controller('api/auth')
export class AuthController {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    console.log('Iniciando autenticación con Google');
    // inicia redirección a Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    // Redirige al frontend
    console.log('Callback de Google');
    console.log(req.user);

    const user = req.user;

    // Genera el JWT
    const jwt = this.jwtService.sign(user || {}); // Asegúrate de inyectar JwtService

    // Redirige al frontend con el token
    res.redirect(
      `${this.configService.get<string>('FE_URL')}/login?token=${jwt}`,
    );
  }

  @Get('me')
  getProfile(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
  ) {
    if (!authHeader) throw new UnauthorizedException('No token provided');

    const token = authHeader.replace('Bearer ', '');

    try {
      const payload = this.jwtService.verify(token); // Decodifica y verifica
      return { user: payload };
    } catch (e: any) {
      throw new UnauthorizedException('Token inválido');
    }
  }

  @Get('logout')
  logout(@Req() req: Request, @Res() res: Response) {
    req.logout(() => {
      res.clearCookie('connect.sid');
      res.send({ message: 'Sesión cerrada' });
    });
  }
}
