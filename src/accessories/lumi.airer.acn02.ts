import { BaseAccessory } from './base';

export class LumiAirerAcn02 extends BaseAccessory {
  init() {
    const { Lightbulb, WindowCovering } = this.platform.Service;
    this.generateServices({
      lightbulb: Lightbulb,
      airer: WindowCovering,
    });

    this.services.lightbulb
      .getCharacteristic(this.platform.Characteristic.On)
      .onGet(this.getLightbulbOn.bind(this))
      .onSet(this.setLightbulbOn.bind(this));

    this.services.airer
      .getCharacteristic(this.platform.Characteristic.CurrentPosition)
      .onGet(this.getPosition.bind(this));

    this.services.airer
      .getCharacteristic(this.platform.Characteristic.TargetPosition)
      .onGet(this.getPosition.bind(this))
      .onSet(this.setPosition.bind(this));

    this.services.airer
      .getCharacteristic(this.platform.Characteristic.PositionState)
      .onGet(this.getPositionState.bind(this));
  }

  async getLightbulbOn() {
    return this.getResourceValue('14.2.85').then(({ value }) => value === '1');
  }

  async setLightbulbOn(value) {
    this.setResourceValue('14.2.85', value ? '1' : '0');
  }

  async getPosition() {
    return this.getResourceValue('1.1.85').then(({ value }) => parseInt(value));
  }

  async setPosition(value) {
    this.setResourceValue('1.1.85', value.toString());
  }

  private positionStateMap = {
    '1': this.platform.Characteristic.PositionState.DECREASING,
    '2': this.platform.Characteristic.PositionState.INCREASING,
    '0': this.platform.Characteristic.PositionState.STOPPED,
  };

  async getPositionState() {
    return this.getResourceValue('14.1.85').then(({ value }) => this.positionStateMap[value]);
  }
}
