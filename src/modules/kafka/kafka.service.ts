import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class KafkaService extends Logger {
  @Inject('KAFKA_SERVICE')
  private readonly clientKafka: ClientKafka;

  constructor() {
    super(KafkaService.name);
  }

  sendTopic(topic: string, payload: any): void {
    this.clientKafka.emit(topic, payload);

    this.log(`KAFKA - Sent to topic: ${topic} - ${JSON.stringify(payload)}`);
  }
}
