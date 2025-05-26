import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import * as session from 'express-session';
import * as passport from 'passport';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const configMqtt = {
    transport: Transport.MQTT,
    options: {
      url: configService.get<string>('MQTT_URL_CONECCTION'),
    },
  };

  app.connectMicroservice(configMqtt);
  app.enableCors({
    origin: configService.get<string>('FE_URL'),
    credentials: true,
  });

  app.use(cookieParser());
  app.use(
    session({
      secret: 'mi_super_secreto', // cambia esto en producción
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false, sameSite: 'lax' }, // usa true en https
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  await app.startAllMicroservices();

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
