import { BaseAccessory } from './base';

enum Operation {
  Lightbulb = '4.21.85',
  /** 风干 */
  AirDry = '4.66.85',
  /** 烘干 */
  Dry = '4.67.85',
  /** 消毒 */
  Disinfection = '4.22.85',
  /** 运动控制 */
  Control = '14.1.85',
}

enum OpenClose {
  Close = '0',
  Open = '1',
}

export class LumiAirerAcn001 extends BaseAccessory {
  init() {
    const { Lightbulb, WindowCovering, Fanv2, Switch } = this.platform.Service;
    this.generateServices({
      lightbulb: Lightbulb,
      airer: WindowCovering,
      fan: {
        service: Fanv2,
        subName: '风干/烘干',
      },
      disinfection: {
        service: Switch,
        subName: '消毒',
      },
    });

    this.services.lightbulb
      .getCharacteristic(this.platform.Characteristic.On)
      .onGet(this.getLightbulbOn.bind(this))
      .onSet(this.setLightbulbOn.bind(this));

    this.services.airer.getCharacteristic(this.platform.Characteristic.CurrentPosition).onGet(() => 50);

    this.services.airer
      .getCharacteristic(this.platform.Characteristic.TargetPosition)
      .onGet(() => 50)
      .onSet((value) => {
        this.setResourceValue(Operation.Control, (value as number) > 50 ? '2' : '1');
      });

    this.services.airer
      .getCharacteristic(this.platform.Characteristic.PositionState)
      .onGet(() => this.getResourceValue(Operation.Control).then(({ value }) => this.positionStateMap[value]));

    this.services.fan
      .getCharacteristic(this.platform.Characteristic.Active)
      .onGet(() =>
        Promise.allSettled([this.getResourceValue(Operation.AirDry), this.getResourceValue(Operation.Dry)]).then(
          ([airDry, dry]) => {
            return (
              (airDry.status === 'fulfilled' && airDry.value.value === OpenClose.Open) ||
              (dry.status === 'fulfilled' && dry.value.value === OpenClose.Open)
            );
          },
        ),
      )
      .onSet((value) => {
        if (value) {
          this.setResourceValue(Operation.AirDry, OpenClose.Open);
        } else {
          Promise.allSettled([
            this.setResourceValue(Operation.AirDry, OpenClose.Close),
            this.setResourceValue(Operation.Dry, OpenClose.Close),
          ]);
        }
      });

    this.services.disinfection
      .getCharacteristic(this.platform.Characteristic.On)
      .onGet(() => this.getResourceValue(Operation.Disinfection).then(({ value }) => value === OpenClose.Open))
      .onSet((value) => {
        this.setResourceValue(Operation.Disinfection, value ? OpenClose.Open : OpenClose.Close);
      });
  }

  async getLightbulbOn() {
    return this.getResourceValue(Operation.Lightbulb).then(({ value }) => value === OpenClose.Open);
  }

  async setLightbulbOn(value) {
    this.setResourceValue(Operation.Lightbulb, value ? OpenClose.Open : OpenClose.Close);
  }

  private positionStateMap = {
    '1': this.platform.Characteristic.PositionState.DECREASING,
    '2': this.platform.Characteristic.PositionState.INCREASING,
    '0': this.platform.Characteristic.PositionState.STOPPED,
  };
}
