import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Log {
  @Prop({ required: true, index: true })
  device_id: string;

  @Prop()
  type: 'INFO' | 'ERROR' | 'WARNING';

  @Prop({ nullable: true, required: false })
  topic: string;

  @Prop()
  message: string;

  @Prop({ type: Object, nullable: true, required: false })
  payload: any;
}

export const LogSchema = SchemaFactory.createForClass(Log);
