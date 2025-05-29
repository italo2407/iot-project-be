import { Controller, Get, Query } from '@nestjs/common';
import { QueryLogDto } from './dto/query-log.dto';
import { LogService } from './log.service';

@Controller('logs')
export class LogController {
  constructor(private readonly logService: LogService) {}
  @Get()
  getLogs(@Query() query: QueryLogDto) {
    console.log('Query parameters:', query);
    const { device_id, type, from, to, page, limit } = query;
    return this.logService.findLogs(
      device_id || null,
      type || null,
      from ? new Date(from) : null,
      to ? new Date(to) : null,
      page,
      limit,
    );
  }
}
