export interface DeviceActuatorStatus {
  device_id: string;
  actuator_type: 'light' | 'fan';
  status: boolean;
  timestamp: Date;
}
