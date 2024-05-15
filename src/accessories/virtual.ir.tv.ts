import { BaseAccessory } from './base';

export class VirtualIrTv extends BaseAccessory {
  get did() {
    return this.accessory.context.deviceInfo.did;
  }

  info?: Aqara.QueryIrInfoResponse;

  keys: Aqara.QueryIrKeysResponse['keys'] = [];

  get keyMap() {
    const keyMap = new Map<string, Aqara.QueryIrKeysResponse['keys'][number]>();
    this.keys.forEach((key) => {
      keyMap.set(key.keyName, key);
    });
    return keyMap;
  }

  async init() {
    const { Characteristic, Service } = this.platform;

    await Promise.allSettled([
      this.platform.aqaraApi.queryIrInfo(this.did),
      this.platform.aqaraApi.queryIrKeys(this.did),
    ]).then(([info, keys]) => {
      if (info.status === 'fulfilled') {
        this.accessory
          .getService(Service.AccessoryInformation)!
          .setCharacteristic(Characteristic.Manufacturer, info.value.brandName);
        this.info = info.value;
      }
      if (keys.status === 'fulfilled') {
        this.keys = keys.value.keys;
      }
    });

    this.generateServices({
      tv: Service.Television,
    });

    this.services.tv.getCharacteristic(Characteristic.Active).onSet(this.setActive.bind(this));

    this.services.tv.getCharacteristic(Characteristic.RemoteKey).onSet(this.setRemoteKey.bind(this));
  }

  setActive() {
    this.writeIrClick('POWER');
  }

  setRemoteKey(value) {
    const { RemoteKey } = this.platform.Characteristic;
    const keyMap = {
      [RemoteKey.REWIND]: 'REWIND',
      [RemoteKey.FAST_FORWARD]: 'FAST_FORWARD',
      [RemoteKey.NEXT_TRACK]: 'NEXT',
      [RemoteKey.PREVIOUS_TRACK]: 'PREVIOUS',
      [RemoteKey.ARROW_UP]: 'NAVIGATE_UP',
      [RemoteKey.ARROW_DOWN]: 'NAVIGATE_DOWN',
      [RemoteKey.ARROW_LEFT]: 'NAVIGATE_LEFT',
      [RemoteKey.ARROW_RIGHT]: 'NAVIGATE_RIGHT',
      [RemoteKey.SELECT]: 'OK',
      [RemoteKey.BACK]: 'BACK',
      [RemoteKey.EXIT]: 'BACK',
      [RemoteKey.PLAY_PAUSE]: 'PAUSE',
      [RemoteKey.INFORMATION]: 'DISPLAY',
    };
    const keyName = keyMap[value];
    if (keyName) {
      this.writeIrClick(keyName);
    }
  }

  private writeIrClick(keyName: string) {
    const keyInfo = this.keyMap.get(keyName);
    if (!keyInfo) {
      this.platform.log.error(`Key ${keyName} not found`);
      return;
    }
    const { controllerId, keyId } = keyInfo;
    const { did, brandId } = this.info!;
    return this.platform.aqaraApi.request('write.ir.click', {
      did,
      brandId,
      controllerId,
      keyId,
    });
  }
}
