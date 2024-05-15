import type { Service } from 'homebridge';
import type { AqaraHomebridgePlatform } from '../platform';

type GenerateServicesParams =
  | typeof Service
  | {
      service: typeof Service;
      subName: string;
    };
export class BaseAccessory {
  public services: Record<string, Service> = {};

  constructor(readonly platform: AqaraHomebridgePlatform, readonly accessory: AqaraPlatformAccessory) {
    const { deviceInfo } = this.accessory.context;
    const { Characteristic, Service } = this.platform;
    this.accessory
      .getService(Service.AccessoryInformation)!
      .setCharacteristic(Characteristic.Manufacturer, 'Aqara')
      .setCharacteristic(Characteristic.Model, deviceInfo.model)
      .setCharacteristic(Characteristic.SerialNumber, deviceInfo.did.split('.').pop()!.toUpperCase());
    this.init();
  }

  protected generateServices(services: Record<string, GenerateServicesParams>) {
    this.services = Object.entries(services).reduce<Record<string, Service>>((acc, [key, params]) => {
      const existingService = this.accessory.getService(key);
      if (existingService) {
        acc[key] = existingService;
      } else if ('subName' in params) {
        const { subName, service } = params;
        acc[key] = this.accessory.addService(service, `${this.accessory.displayName} - ${subName}`, key);
      } else {
        acc[key] = this.accessory.addService(params, this.accessory.displayName, key);
      }
      return acc;
    }, {});
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

  init() {
    // 暴露给子类
  }
}
