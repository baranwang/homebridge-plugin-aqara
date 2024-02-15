import { HomebridgePluginUiServer, RequestError } from '@homebridge/plugin-ui-utils';
// @ts-ignore
import { AqaraApi, AqaraApiOption } from '@api/index';

class UiServer extends HomebridgePluginUiServer {
  aqaraApi!: AqaraApi;

  constructor() {
    super();
    this.onRequest('/auth-code', this.getAuthCode.bind(this));
    this.onRequest('/token', this.getToken.bind(this));
    this.onRequest('/token/local', this.getLocalToken.bind(this));
    this.ready();
  }

  getAuthCode(config: AqaraApiOption & { account: string }) {
    const aqaraApi = this.getAqaraApi(config);
    return aqaraApi.getAuthCode(config.account);
  }

  async getToken(config: AqaraApiOption & { authCode: string }) {
    const aqaraApi = this.getAqaraApi(config);
    try {
      const result = await aqaraApi.getToken(config.account, config.authCode);
      return result;
    } catch (error) {
      const e = error as Error;
      throw new RequestError(e.message, { status: 500 });
    }
  }

  getLocalToken({ account }: { account: string }) {
    if (!this.aqaraApi) {
      return Promise.resolve(null);
    }
    this.aqaraApi.setAccount(account);
    const config = this.aqaraApi.accountConfig;
    if (!config) {
      return Promise.resolve(null);
    }
    if (config.expiresAt < Date.now()) {
      return Promise.resolve(null);
    }
    return Promise.resolve(config);
  }

  private getAqaraApi(config: AqaraApiOption) {
    if (!this.aqaraApi) {
      this.aqaraApi = new AqaraApi({
        ...config,
        storagePath: this.homebridgeStoragePath || '',
      });
    }
    return this.aqaraApi;
  }
}

(() => {
  return new UiServer();
})();
