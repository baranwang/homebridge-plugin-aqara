import { API, Characteristic, DynamicPlatformPlugin, Logger, PlatformConfig, Service } from 'homebridge';

import { LumiAirerAcn001, LumiAirerAcn02, VirtualIrTv } from './accessories';
import { AqaraApi, AqaraApiOption } from './api';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings';

interface AqaraPlatformConfig extends PlatformConfig, AqaraApiOption {
  positionId?: string;
}

export class AqaraHomebridgePlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  public readonly aqaraApi!: AqaraApi;

  public readonly accessories: AqaraPlatformAccessory[] = [];

  private tokenRefreshTimer?: NodeJS.Timeout;

  constructor(public readonly log: Logger, public readonly config: AqaraPlatformConfig, public readonly api: API) {
    this.log.debug('Finished initializing platform:', this.config.name);
    const { account } = this.config;
    if (account) {
      this.aqaraApi = new AqaraApi({
        ...this.config,
        storagePath: this.api.user.storagePath(),
      });
      this.api.on('didFinishLaunching', () => {
        this.tokenRefreshTimer = setInterval(() => {
          this.aqaraApi.refreshToken();
        }, 1000 * 60 * 60 * 24 * 7);

        this.discoverDevices();
      });

      this.api.on('shutdown', () => {
        if (this.tokenRefreshTimer) {
          clearTimeout(this.tokenRefreshTimer);
        }
      });
    } else {
      this.log.error('Missing account');
    }
  }

  configureAccessory(accessory: AqaraPlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    this.accessories.push(accessory);
  }

  discoverDevices() {
    // this.aqaraApi.request('query.ir.info', { did: 'ir.1235995976809168896' }).then(console.log);
    // this.aqaraApi.request('query.ir.keys', { did: 'ir.1235995976809168896' }).then(console.log);
    this.aqaraApi.getAllDevices(this.config.positionId).then((devices) => {
      console.log('devices', devices);
      devices.forEach((device) => this.handleDevice(device));
    });
  }

  private handleDevice(device: Aqara.DeviceInfo) {
    const AccessoryClass = this.getAccessoryClass(device);
    if (!AccessoryClass) {
      return;
    }
    const uuid = this.api.hap.uuid.generate(device.did);
    const existingAccessory = this.accessories.find((accessory) => accessory.UUID === uuid);
    if (existingAccessory) {
      this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
      existingAccessory.context = {
        deviceInfo: device,
      };
      this.api.updatePlatformAccessories([existingAccessory]);
      new AccessoryClass(this, existingAccessory);
    } else {
      this.log.info('Adding new accessory:', device.deviceName);
      const accessory = new this.api.platformAccessory<AqaraPlatformAccessoryContext>(device.deviceName, uuid);
      accessory.context = {
        deviceInfo: device,
      };
      new AccessoryClass(this, accessory);
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }
  }

  private getAccessoryClass(deviceInfo: Aqara.DeviceInfo) {
    switch (deviceInfo.model) {
      case 'lumi.airer.acn001':
        return LumiAirerAcn001;
      case 'lumi.airer.acn02':
        return LumiAirerAcn02;
      case 'virtual.ir.tv':
        return VirtualIrTv;
      default:
        return undefined;
    }
  }
}
