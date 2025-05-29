export interface CreateLogDto {
  device_id: string;
  type: 'INFO' | 'ERROR' | 'WARNING';
  topic?: string;
  message: string;
  payload?: any;
}
