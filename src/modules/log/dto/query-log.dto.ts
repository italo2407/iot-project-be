import { CreateLogDto } from './create-log.dto';

export interface QueryLogDto
  extends Partial<Pick<CreateLogDto, 'device_id' | 'type'>> {
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}
