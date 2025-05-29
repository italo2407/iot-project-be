import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KafkaModule } from './modules/kafka/kafka.module';
import { MqttModule } from './modules/mqtt/mqtt.module';
import { MongooseModule } from '@nestjs/mongoose';
import { DeviceModule } from './modules/device/device.module';
import { AuthModule } from './modules/auth/auth.module';
import { LogModule } from './modules/log/log.module';

@Module({
  imports: [
    // Configs (Env vars)
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // MongoDB (MongoDB)
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        uri:
          configService.get<string>('MONGODB_URI') ??
          'mongodb://localhost:27017',
      }),
      inject: [ConfigService],
    }),

    KafkaModule,
    MqttModule,
    DeviceModule,
    AuthModule,
    LogModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
