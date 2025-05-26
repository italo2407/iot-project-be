import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KafkaService } from './kafka.service';

@Module({
  imports: [
    ClientsModule.registerAsync({
      clients: [
        {
          useFactory: (configService: ConfigService) => ({
            transport: Transport.KAFKA,
            options: {
              client: {
                brokers: [
                  configService.get<string>('KAFKA_BROKER') ?? 'test:9092',
                ],
              },
              consumer: {
                groupId: 'kafka-consumer',
              },
            },
          }),
          inject: [ConfigService],
          name: 'KAFKA_SERVICE',
        },
      ],
    }),
  ],
  controllers: [],
  providers: [KafkaService],
  exports: [KafkaService],
})
export class KafkaModule {}
