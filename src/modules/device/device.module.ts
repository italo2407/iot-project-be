import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Device, DeviceSchema } from './schema/device.schema';
import { MqttModule } from '../mqtt/mqtt.module';
import { KafkaModule } from '../kafka/kafka.module';
import { DeviceService } from './device.service';
import { DeviceController } from './device.controller';
import { LogModule } from '../log/log.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Device.name, schema: DeviceSchema }]),
    MqttModule,
    KafkaModule,
    LogModule,
  ],
  controllers: [DeviceController],
  providers: [DeviceService],
  exports: [],
})
export class DeviceModule {}
