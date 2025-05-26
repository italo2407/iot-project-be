export interface SaveDeviceDto {
  device_id: string;
  placa_id?: string;
  status: string;
  network_info: {
    ip: string;
    mac: string;
    ssid: string;
    rssi?: number;
  };
}
