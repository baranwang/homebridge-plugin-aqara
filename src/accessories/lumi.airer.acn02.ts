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
      .onGet(this.getLightbulbOn.bind(this))
      .onSet(this.setLightbulbOn.bind(this));

    this.services[1]
      .getCharacteristic(this.platform.Characteristic.CurrentPosition)
      .onGet(this.getPosition.bind(this));

    this.services[1]
      .getCharacteristic(this.platform.Characteristic.TargetPosition)
      .onGet(this.getPosition.bind(this))
      .onSet(this.setPosition.bind(this));

    this.services[1]
      .getCharacteristic(this.platform.Characteristic.PositionState)
      .onGet(this.getPositionState.bind(this));
  }

  lightbulbOn = false;

  async getLightbulbOn() {
    try {
      const { value } = await this.getResourceValue('14.2.85');
      this.lightbulbOn = value === '1';
    } catch (error) {}
    return this.lightbulbOn;
  }

  async setLightbulbOn(value) {
    try {
      await this.setResourceValue('14.2.85', value ? '1' : '0');
      this.lightbulbOn = value;
    } catch (error) {}
  }

  position = 0;

  async getPosition() {
    try {
      const { value } = await this.getResourceValue('1.1.85');
      this.position = parseInt(value);
    } catch (error) {}
    return this.position;
  }

  async setPosition(value) {
    try {
      await this.setResourceValue('1.1.85', value.toString());
    } catch (error) {}
  }

  positionState = this.platform.Characteristic.PositionState.STOPPED;

  private positionStateMap = {
    '1': this.platform.Characteristic.PositionState.DECREASING,
    '2': this.platform.Characteristic.PositionState.INCREASING,
    '0': this.platform.Characteristic.PositionState.STOPPED,
  };

  async getPositionState() {
    try {
      const { value } = await this.getResourceValue('14.1.85');
      this.positionState = this.positionStateMap[value];
    } catch (error) {}
    return this.positionState;
  }
}
