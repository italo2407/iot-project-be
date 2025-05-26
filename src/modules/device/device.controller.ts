import {
  Body,
  Controller,
  Get,
  Logger,
  MessageEvent,
  Param,
  Post,
  Sse,
} from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { KafkaService } from '../kafka/kafka.service';
import { DeviceService } from './device.service';
import { map, Observable } from 'rxjs';
import { SaveDeviceDto } from './dto/save-device.dto';
import { DeviceDataDto } from './dto/device-data.dto';
import { DeviceActuatorStatus } from './dto/device-actuator-status';
import { MqttService } from '../mqtt/mqtt.service';

@Controller('devices')
export class DeviceController extends Logger {
  constructor(
    private readonly kafkaService: KafkaService,
    private readonly deviceService: DeviceService,
    private readonly mqttService: MqttService,
  ) {
    super(DeviceController.name);
  }

  /************* Read mqtt topics *********************/
  // Event handler for sensor data
  // it is triggered when a message is received on the 'sensor/air-quality' topic
  @EventPattern('sensor/data')
  handleAirQualitySensor(@Payload() data: DeviceDataDto) {
    this.log('Received air quality data:', data);
    this.kafkaService.sendTopic('sensor-data', data);
    this.deviceService.emitData(data);
  }

  // Event handler for device status
  // it is triggered when a message is received on the 'sensor/status' topic
  @EventPattern('sensor/status')
  async handleDeviceStatus(@Payload() data: SaveDeviceDto) {
    this.log('Received device status:', data);
    await this.deviceService.create(data);
  }

  @EventPattern('sensor/actuator/status')
  async handleActuatorsStatus(@Payload() data: DeviceActuatorStatus) {
    this.log('Received device actuator status:', data);
    this.deviceService.emitActuatorStatus(data);
  }
  /************* End Read mqtt topics *********************/

  /************* Expose endpoints to Web *********************/
  @Get('latest')
  async getLatestDevices() {
    const devices = await this.deviceService.findLatestUniqueDevices();
    return devices;
  }

  @Post(':deviceId/actuator')
  async controlActuator(
    @Param('deviceId') deviceId: string,
    @Body() body: { actuator: string; command: 'ON' | 'OFF' },
  ) {
    this.log(`Sending MQTT command to device ${deviceId}:`, body);

    // Publica el comando al topic MQTT correspondiente
    this.mqttService.publish(
      `sensor/${deviceId}/actuator/${body.actuator}/cmd`,
      JSON.stringify({ command: body.command }),
    );

    return { status: 'command sent' };
  }
  /************* End expose endpoints to Web *********************/

  /************* Async Events to update UI Web *********************/
  @Sse('events/status')
  sse(): Observable<MessageEvent> {
    return this.deviceService.getDeviceCreatedObservable().pipe(
      map((device) => ({
        data: device,
      })),
    );
  }

  @Sse('events/data')
  data(): Observable<MessageEvent> {
    return this.deviceService.getDataObservable().pipe(
      map((data) => ({
        data,
      })),
    );
  }

  @Sse('events/actuator-status')
  actuatorStatus(): Observable<MessageEvent> {
    return this.deviceService.getActuatorStatusObservable().pipe(
      map((data) => ({
        data,
      })),
    );
  }

  /************* End Async Events to update UI Web *********************/
}
