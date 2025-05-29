import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Device {
  @Prop({ required: true, index: true, unique: true })
  device_id: string;

  @Prop()
  placa_id: string;

  @Prop({ default: 'ON' })
  status: string;

  @Prop({ type: Object })
  network_info: {
    ip: string;
    mac: string;
    ssid: string;
    rssi?: number;
  };

  @Prop({
    type: Object,
    default: {
      data_sending_interval: 2000, // 2 seconds
      check_threshold_interval: 120000, // 2 minutes
      temp_threshold_max: 28,
      ppm_threshold_max: 300,
    },
  })
  config: {
    data_sending_interval: number;
    check_threshold_interval: number;
    temp_threshold_max: number;
    ppm_threshold_max: number;
  };
}

export const DeviceSchema = SchemaFactory.createForClass(Device);
