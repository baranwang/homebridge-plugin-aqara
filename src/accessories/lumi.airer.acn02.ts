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
      .onGet(this.getCurrentPosition.bind(this))
      .onSet(this.setCurrentPosition.bind(this));
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

  currentPosition = 0;

  async getCurrentPosition() {
    try {
      const { value } = await this.getResourceValue('1.1.85');
      this.currentPosition = parseInt(value);
    } catch (error) {}
    return this.currentPosition;
  }

  async setCurrentPosition(value) {
    try {
      await this.setResourceValue('1.1.85', value.toString());
      this.currentPosition = value;
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

  async setPositionState(value) {
    try {
      const [aqaraValue] = Object.entries(this.positionStateMap).find(([_, val]) => val === value) ?? [];
      if (aqaraValue) {
        await this.setResourceValue('14.1.85', aqaraValue);
        this.positionState = value;
      }
    } catch (error) {}
  }
}
