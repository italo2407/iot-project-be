import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MqttService } from './mqtt.service';

@Module({
  imports: [
    ClientsModule.registerAsync({
      clients: [
        {
          useFactory: (configService: ConfigService) => ({
            transport: Transport.MQTT,
            options: {
              url:
                configService.get<string>('MQTT_URL_CONECCTION') ??
                'localhost:9092',
            },
          }),
          inject: [ConfigService],
          name: 'MQTT_SERVICE',
        },
      ],
    }),
  ],
  controllers: [],
  providers: [MqttService],
  exports: [MqttService],
})
export class MqttModule {}
