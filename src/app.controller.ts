import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { KafkaService } from './modules/kafka/kafka.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly kafkaService: KafkaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
