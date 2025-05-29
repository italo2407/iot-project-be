import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Log } from './schema/log.schema';
import { FilterQuery, Model } from 'mongoose';
import { CreateLogDto } from './dto/create-log.dto';

@Injectable()
export class LogService {
  constructor(@InjectModel(Log.name) private logModel: Model<Log>) {}

  async createLog(createLogDto: CreateLogDto): Promise<Log> {
    const log = new this.logModel(createLogDto);
    return log.save();
  }

  async findLogs(
    device_id?: string | null,
    type?: string | null,
    from?: Date | null,
    to?: Date | null,
    page = 1,
    limit = 10,
  ): Promise<{ data: Log[]; total: number }> {
    const filter: FilterQuery<Log> = {};

    if (device_id) filter.device_id = device_id;
    if (type) filter.type = type;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = from;
      if (to) filter.createdAt.$lte = to;
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.logModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.logModel.countDocuments(filter),
    ]);

    return { data, total };
  }
}
