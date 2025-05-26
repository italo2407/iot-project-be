import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Device {
  @Prop({ required: true, index: true })
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
}

export const DeviceSchema = SchemaFactory.createForClass(Device);
