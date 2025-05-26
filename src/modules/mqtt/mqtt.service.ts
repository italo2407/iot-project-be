import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class MqttService extends Logger {
  @Inject('MQTT_SERVICE')
  private readonly mqttClient: ClientProxy;

  constructor() {
    super(MqttService.name);
  }

  publish(topic: string, payload: any): void {
    this.mqttClient.emit(topic, payload);

    this.log(`MQTT - Sent to topic: ${topic} - ${JSON.stringify(payload)}`);
  }
}
