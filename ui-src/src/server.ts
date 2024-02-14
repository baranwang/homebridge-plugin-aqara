import { HomebridgePluginUiServer, RequestError } from '@homebridge/plugin-ui-utils';
// @ts-expect-error
import { AqaraApi, AqaraApiOption } from '@api';
import path from 'path';
import fs from 'fs';

class UiServer extends HomebridgePluginUiServer {
  aqaraApi!: AqaraApi;

  _configPath = path.resolve(this.homebridgeStoragePath ?? '', 'aqara');

  get configPath() {
    if (!fs.existsSync(this._configPath)) {
      fs.mkdirSync(this._configPath);
    }
    return this._configPath;
  }

  constructor() {
    super();
    this.onRequest('/auth-code', this.getAuthCode.bind(this));
    this.onRequest('/token', this.getToken.bind(this));
    this.onRequest('/token/local', this.getLocalToken.bind(this));
    this.ready();
  }

  getAuthCode(config: AqaraApiOption & { account: string }) {
    console.log(this.homebridgeStoragePath);
    const aqaraApi = this.getAqaraApi(config);
    return aqaraApi.getAuthCode(config.account);
  }

  async getToken(config: AqaraApiOption & { account: string; authCode: string }) {
    const aqaraApi = this.getAqaraApi(config);
    try {
      const res: Aqara.GetTokenResponse = await aqaraApi.getToken(config.account, config.authCode);
      const { expiresIn, ...rest } = res;
      const expiresAt = Date.now() + parseInt(expiresIn) * 1000;
      const result = { ...rest, expiresAt, account: config.account };
      const configPath = path.resolve(this.configPath, `${config.account}.json`);
      fs.writeFileSync(configPath, JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      const e = error as Error;
      throw new RequestError(e.message, { status: 500 });
    }
  }

  getLocalToken({ account }: { account: string }) {
    const configPath = path.resolve(this.configPath, `${account}.json`);
    if (!fs.existsSync(configPath)) {
      return null;
    }
    const configStr = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configStr);
    if (config.expiresAt < Date.now()) {
      return null;
    }
    return config;
  }

  private getAqaraApi(config: AqaraApiOption) {
    if (!this.aqaraApi) {
      this.aqaraApi = new AqaraApi(config);
    }
    return this.aqaraApi;
  }
}

(() => {
  return new UiServer();
})();
