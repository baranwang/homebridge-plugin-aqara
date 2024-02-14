import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { AqaraApi, AqaraApiOption } from './api';
import path from 'path';
import fs from 'fs';

interface AqaraPlatformConfig extends PlatformConfig, AqaraApiOption {
  account?: string;
}

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class AqaraHomebridgePlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  public readonly aqaraApi!: AqaraApi;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  private tokenRefreshTimer?: NodeJS.Timeout;

  constructor(public readonly log: Logger, public readonly config: PlatformConfig, public readonly api: API) {
    this.log.debug('Finished initializing platform:', this.config.name);
    const { account } = this.config as AqaraPlatformConfig;
    if (account) {
      const accountConfigPath = path.resolve(this.api.user.storagePath(), 'aqara', `${account}.json`);
      this.aqaraApi = new AqaraApi({
        ...(this.config as AqaraPlatformConfig),
        accountConfigPath,
      });
      this.api.on('didFinishLaunching', () => {
        this.tokenRefreshTimer = setInterval(() => {
          this.aqaraApi.refreshToken();
        }, 1000 * 60 * 60 * 24);

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

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    this.accessories.push(accessory);
  }

  discoverDevices() {
    this.aqaraApi.getAllDevices().then((devices) => {
      devices.forEach((device) => this.handleDevice(device));
    });
  }

  private handleDevice(device: Aqara.DeviceInfo) {
    // Aqara智能晾衣机 Lite
    if (device.model === 'lumi.airer.acn02') {
      console.log(device);
    }
  }
}
