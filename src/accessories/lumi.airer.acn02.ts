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

    this.services[1].getCharacteristic(this.platform.Characteristic.CurrentPosition).onGet(this.getPosition.bind(this));

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
    return this.getResourceValue('14.2.85')
      .then(({ value }) => {
        this.lightbulbOn = value === '1';
        return this.lightbulbOn;
      })
      .catch(() => this.lightbulbOn);
  }

  async setLightbulbOn(value) {
    this.setResourceValue('14.2.85', value ? '1' : '0').then(() => {
      this.lightbulbOn = value;
    });
  }

  position = 0;

  async getPosition() {
    return this.getResourceValue('1.1.85')
      .then(({ value }) => {
        this.position = parseInt(value);
        return this.position;
      })
      .catch(() => this.position);
  }

  async setPosition(value) {
    this.setResourceValue('1.1.85', value.toString()).then(() => {
      this.position = value;
    });
  }

  positionState = this.platform.Characteristic.PositionState.STOPPED;

  private positionStateMap = {
    '1': this.platform.Characteristic.PositionState.DECREASING,
    '2': this.platform.Characteristic.PositionState.INCREASING,
    '0': this.platform.Characteristic.PositionState.STOPPED,
  };

  async getPositionState() {
    return this.getResourceValue('14.1.85')
      .then(({ value }) => {
        this.positionState = this.positionStateMap[value];
        return this.positionState;
      })
      .catch(() => this.positionState);
  }
}
