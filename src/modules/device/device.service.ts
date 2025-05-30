import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Device } from './schema/device.schema';
import { Model } from 'mongoose';
import { Subject } from 'rxjs';
import { SaveDeviceDto } from './dto/save-device.dto';
import { DeviceDataDto } from './dto/device-data.dto';
import { DeviceActuatorStatus } from './dto/device-actuator-status';

@Injectable()
export class DeviceService {
  private deviceCreated$ = new Subject<Device>();
  private data$ = new Subject<DeviceDataDto>();
  private actuatorStatus$ = new Subject<DeviceActuatorStatus>();

  constructor(@InjectModel(Device.name) private deviceModel: Model<Device>) {}

  async create(createDeviceDto: SaveDeviceDto): Promise<Device> {
    // If the device already exists, update its status and network info
    const deviceUpdated = await this.deviceModel
      .findOneAndUpdate(
        { device_id: createDeviceDto.device_id },
        {
          status: createDeviceDto.status,
          network_info: createDeviceDto.network_info,
        },
        { new: true, upsert: true },
      )
      .exec();

    this.deviceCreated$.next(deviceUpdated);

    return deviceUpdated;
  }

  async updateDeviceConfig(
    deviceId: string,
    config: Partial<{
      data_sending_interval: number;
      check_threshold_interval: number;
      temp_threshold_max: number;
      ppm_threshold_max: number;
    }>,
  ): Promise<Device | null> {
    const updatedDevice = await this.deviceModel
      .findOneAndUpdate(
        { device_id: deviceId },
        {
          $set: {
            'config.data_sending_interval': config.data_sending_interval,
            'config.check_threshold_interval': config.check_threshold_interval,
            'config.temp_threshold_max': config.temp_threshold_max,
            'config.ppm_threshold_max': config.ppm_threshold_max,
          },
        },
        { new: true },
      )
      .exec();
    return updatedDevice;
  }

  async findByDeviceId(deviceId: string): Promise<Device | null> {
    return this.deviceModel.findOne({ device_id: deviceId }).exec();
  }

  async findDevices(): Promise<Device[]> {
    const result: Device[] = await this.deviceModel.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$device_id',
          doc: { $first: '$$ROOT' },
        },
      },
      { $replaceRoot: { newRoot: '$doc' } },
    ]);

    return result;
  }

  getDeviceCreatedObservable() {
    return this.deviceCreated$.asObservable();
  }

  getDataObservable() {
    return this.data$.asObservable();
  }

  emitData(data: DeviceDataDto) {
    this.data$.next(data);
  }

  emitActuatorStatus(data: DeviceActuatorStatus) {
    this.actuatorStatus$.next(data);
  }

  getActuatorStatusObservable() {
    return this.actuatorStatus$.asObservable();
  }
}
