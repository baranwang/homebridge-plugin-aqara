import { BaseAccessory } from './base';

export class LumiAirerAcn02 extends BaseAccessory {

  constructor(platform, accessory) {
    super(platform, accessory);

    this.init();

  }

  init() {
    const { Lightbulb, WindowCovering } = this.platform.Service;
    this.generateServices([Lightbulb, WindowCovering]);

    this.services[0]
      .getCharacteristic(this.platform.Characteristic.On)
      .onGet(this.getLightbulbOn.bind(this));
  }

  getLightbulbOn() {
    this.getResourceValue('14.2.85');
    return true;
  }
}