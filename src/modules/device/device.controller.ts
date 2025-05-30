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
import { map, Observable, tap } from 'rxjs';
import { SaveDeviceDto } from './dto/save-device.dto';
import { DeviceDataDto } from './dto/device-data.dto';
import { DeviceActuatorStatus } from './dto/device-actuator-status';
import { MqttService } from '../mqtt/mqtt.service';
import { LogService } from '../log/log.service';
import { DeviceErrorDto } from './dto/device-error';

@Controller('devices')
export class DeviceController extends Logger {
  constructor(
    private readonly kafkaService: KafkaService,
    private readonly deviceService: DeviceService,
    private readonly mqttService: MqttService,
    private readonly logService: LogService,
  ) {
    super(DeviceController.name);
  }

  /************* Read mqtt topics *********************/
  // Event handler for sensor data
  // it is triggered when a message is received on the 'sensor/air-quality' topic
  @EventPattern('sensor/data')
  async handleAirQualitySensor(@Payload() data: any) {
    const parsedData: DeviceDataDto =
      typeof data === 'string' ? JSON.parse(data) : data;

    await this.logService.createLog({
      type: 'INFO',
      topic: `sensor/data`,
      message: `Device ${parsedData.device_id} sent data`,
      device_id: parsedData.device_id,
      payload: parsedData,
    });

    this.kafkaService.sendTopic('sensor-data', parsedData);
    this.deviceService.emitData(parsedData);
  }

  // Event handler for device status
  // it is triggered when a message is received on the 'sensor/status' topic
  @EventPattern('sensor/conexion/status')
  async handleDeviceStatus(@Payload() data: any) {
    const parsedData: SaveDeviceDto =
      typeof data === 'string' ? JSON.parse(data) : data;

    const device = await this.deviceService.create(parsedData);
    await this.logService.createLog({
      type: device.status === 'ON' ? 'INFO' : 'WARNING',
      topic: 'sensor/conexion/status',
      message: `Device ${device.device_id} status updated to ${device.status}`,
      device_id: device.device_id,
      payload: parsedData,
    });

    if (device.status === 'ON') {
      if (device.config) {
        this.mqttService.publish(
          `sensor/${device.device_id}/config`,
          JSON.stringify(device.config),
        );
        await this.logService.createLog({
          type: 'INFO',
          topic: `sensor/${device.device_id}/config`,
          message: `Device ${device.device_id} updated with configuration`,
          device_id: device.device_id,
          payload: device.config,
        });
      } else {
        await this.logService.createLog({
          type: 'WARNING',
          message: `Device ${device.device_id} has no configuration`,
          device_id: device.device_id,
          payload: device.config,
        });
      }
    }
  }

  @EventPattern('sensor/actuator/status')
  async handleActuatorsStatus(@Payload() data: any) {
    const parsedData: DeviceActuatorStatus =
      typeof data === 'string' ? JSON.parse(data) : data;

    await this.logService.createLog({
      type: 'INFO',
      topic: 'sensor/actuator/status',
      message: `Device ${parsedData.device_id} actuator status updated to ${parsedData.status}`,
      device_id: parsedData.device_id,
      payload: parsedData,
    });

    this.deviceService.emitActuatorStatus(parsedData);
  }

  @EventPattern('sensor/error')
  async handleError(@Payload() data: any) {
    const parsedData: DeviceErrorDto =
      typeof data === 'string' ? JSON.parse(data) : data;

    await this.logService.createLog({
      type: 'ERROR',
      topic: 'sensor/error',
      message: `Device ${parsedData.device_id} error: ${parsedData.error}`,
      device_id: parsedData.device_id,
      payload: parsedData,
    });
  }
  /************* End Read mqtt topics *********************/

  /************* Expose endpoints to Web *********************/
  @Get('')
  async getLatestDevices() {
    const devices = await this.deviceService.findDevices();
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

    await this.logService.createLog({
      type: 'INFO',
      topic: `sensor/${deviceId}/actuator/${body.actuator}/cmd`,
      message: `Device ${deviceId} actuator ${body.actuator} command sent: ${body.command}`,
      device_id: deviceId,
      payload: body,
    });

    return { status: 'command sent' };
  }

  @Post(':deviceId/config')
  async setDeviceConfig(
    @Param('deviceId') deviceId: string,
    @Body()
    body: {
      data_sending_interval: number;
      check_threshold_interval: number;
      temp_threshold_max: number;
      ppm_threshold_max: number;
    },
  ) {
    this.log(`Sending MQTT to device ${deviceId} config:`, body);

    // Actualiza la configuración del dispositivo en la base de datos
    const updatedDevice = await this.deviceService.updateDeviceConfig(
      deviceId,
      body,
    );
    // Publica el comando al topic MQTT correspondiente
    this.mqttService.publish(
      `sensor/${deviceId}/config`,
      JSON.stringify(updatedDevice?.config),
    );

    await this.logService.createLog({
      type: 'INFO',
      topic: `sensor/${deviceId}/config`,
      message: `Device ${deviceId} updated with configuration`,
      device_id: deviceId,
      payload: updatedDevice?.config,
    });

    return { status: 'config sent' };
  }
  /************* End expose endpoints to Web *********************/

  /************* Async Events to update UI Web *********************/
  @Sse('events/status')
  sse(): Observable<MessageEvent> {
    return this.deviceService.getDeviceCreatedObservable().pipe(
      tap((device) => {
        this.logService
          .createLog({
            type: 'INFO',
            topic: 'events/status',
            message: `SSE Event: Device ${device.device_id} status updated to ${device.status}`,
            device_id: device.device_id,
            payload: device,
          })
          .then()
          .catch((error) => {
            this.error(`Error creating log for SSE event: ${error.message}`);
          });
      }),
      map((device) => ({
        data: device,
      })),
    );
  }

  @Sse('events/data')
  data(): Observable<MessageEvent> {
    return this.deviceService.getDataObservable().pipe(
      tap((data) => {
        this.logService
          .createLog({
            type: 'INFO',
            topic: 'events/data',
            message: `SSE Event: Device ${data.device_id} data received`,
            device_id: data.device_id,
            payload: data,
          })
          .then()
          .catch((error) => {
            this.error(`Error creating log for SSE event: ${error.message}`);
          });
      }),
      map((data) => ({
        data,
      })),
    );
  }

  @Sse('events/actuators')
  actuatorStatus(): Observable<MessageEvent> {
    return this.deviceService.getActuatorStatusObservable().pipe(
      tap((data) => {
        this.logService
          .createLog({
            type: 'INFO',
            topic: 'events/actuators',
            message: `SSE Event: Device ${data.device_id} actuator ${data.actuator_type} status updated to ${data.status}`,
            device_id: data.device_id,
            payload: data,
          })
          .then()
          .catch((error) => {
            this.error(`Error creating log for SSE event: ${error.message}`);
          });
      }),
      map((data) => ({
        data,
      })),
    );
  }

  /************* End Async Events to update UI Web *********************/
}
