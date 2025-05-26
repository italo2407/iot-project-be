import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { GoogleStrategy } from './google.strategy';
import { SessionSerializer } from './session.serializer';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PassportModule.register({ session: true }),
    JwtModule.register({
      secret: 'mi_super_secreto_jwt',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [GoogleStrategy, SessionSerializer],
})
export class AuthModule {}
