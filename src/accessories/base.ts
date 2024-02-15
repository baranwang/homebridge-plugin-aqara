import type { Service } from 'homebridge';
import type { AqaraHomebridgePlatform } from '../platform';

export class BaseAccessory {
  public services: Service[] = [];

  constructor(readonly platform: AqaraHomebridgePlatform, readonly accessory: AqaraPlatformAccessory) {
    const { deviceInfo } = this.accessory.context;
    const { Characteristic, Service } = this.platform;
    this.accessory
      .getService(Service.AccessoryInformation)!
      .setCharacteristic(Characteristic.Manufacturer, 'Aqara')
      .setCharacteristic(Characteristic.Model, deviceInfo.model)
      .setCharacteristic(Characteristic.SerialNumber, deviceInfo.did.split('.').pop()!.toUpperCase());
  }

  protected generateServices<T extends typeof Service>(services: T[]) {
    this.services = services.map(
      (service) => this.accessory.getService(service as any) || this.accessory.addService(service as any),
    );
  }

  protected getResourceValue(resourceId: string) {
    const subjectId = this.accessory.context.deviceInfo.did;
    return this.platform.aqaraApi.getResourceValue(subjectId, resourceId).then((res) => {
      const item = res.find((item) => item.subjectId === subjectId && item.resourceId === resourceId);
      if (!item) {
        throw new Error('Resource not found');
      }
      return item;
    });
  }

  protected setResourceValue(resourceId: string, value: string) {
    try {
      return this.platform.aqaraApi.setResourceValue(this.accessory.context.deviceInfo.did, resourceId, value);
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
