import axios, { AxiosInstance } from 'axios';
import { createHash } from 'crypto';
import { Logger } from 'homebridge/lib/logger';
import fs from 'fs';

export interface AqaraApiOption extends Aqara.AppConfig {
  region: 'cn' | 'us' | 'kr' | 'ru' | 'eu' | 'sg';
  accountConfigPath?: string;
}

const API_DOMAIN = {
  cn: 'open-cn.aqara.com',
  us: 'open-usa.aqara.com',
  kr: 'open-kr.aqara.com',
  ru: 'open-ru.aqara.com',
  eu: 'open-ger.aqara.com',
  sg: 'open-sg.aqara.com',
};

export class AqaraApi {
  axios!: AxiosInstance;

  logger = new Logger('AqaraApi');

  get accountConfig() {
    const { accountConfigPath } = this.option;
    if (!accountConfigPath) {
      return null;
    }
    const accountConfigStr = fs.readFileSync(accountConfigPath, 'utf-8');
    try {
      const accountConfig = JSON.parse(accountConfigStr);
      return accountConfig;
    } catch (error) {
      return null;
    }
  }

  get accessToken() {
    return this.accountConfig?.accessToken;
  }

  constructor(private option: AqaraApiOption) {
    const { region, appId, keyId } = option;
    this.axios = axios.create({
      baseURL: `https://${API_DOMAIN[region]}`,
    });
    this.axios.interceptors.request.use((config) => {
      config.headers['Content-Type'] = 'application/json';
      config.headers['Appid'] = appId;
      config.headers['Keyid'] = keyId;
      const accessToken = !config.data.intent.startsWith('config.auth') ? this.accessToken : undefined;
      const { nonce, timestamp, sign } = this.sign(accessToken);
      config.headers['Nonce'] = nonce;
      config.headers['Time'] = timestamp;
      config.headers['Sign'] = sign;
      if (accessToken) {
        config.headers['Accesstoken'] = accessToken;
      }
      return config;
    });
    this.axios.interceptors.response.use((response) => {
      if (response.data.code !== 0) {
        throw new Error(`[${response.data.code}] ${response.data.message}`);
      }
      return response.data.result;
    });
  }

  private sign(accessToken?: string) {
    const { appId, keyId, appKey } = this.option;
    const nonce = Math.random().toString(36).slice(2);
    const timestamp = Date.now();
    const signStr = `${accessToken ? `Accesstoken=${accessToken}&` : ''}${[
      ['Appid', appId],
      ['Keyid', keyId],
      ['Nonce', nonce],
      ['Time', timestamp],
    ]
      .map(([key, value]) => `${key}=${value}`)
      .join('&')}${appKey}`.toLowerCase();
    const sign = createHash('md5').update(signStr).digest('hex').toLowerCase();
    return {
      nonce,
      timestamp,
      sign,
    };
  }

  private request<T>(intent: string, data: any) {
    this.logger.info('Request:', intent, JSON.stringify(data));
    return this.axios.post('/v3.0/open/api', {
      intent,
      data,
    }) as Promise<T>;
  }

  getAuthCode(account: string) {
    return this.request('config.auth.getAuthCode', {
      account,
      accountType: 0,
      accessTokenValidity: '1h',
    });
  }

  getToken(account: string, authCode: string) {
    return this.request('config.auth.getToken', {
      account,
      accountType: 0,
      authCode,
    });
  }

  refreshToken(refreshToken: string = this.accountConfig?.refreshToken) {
    return this.request('config.auth.refreshToken', {
      refreshToken,
    });
  }

  queryDeviceInfo(params: Aqara.QueryDeviceInfoRequest) {
    return this.request<Aqara.QueryDeviceInfoResponse>('query.device.info', params);
  }

  async getAllDevices() {
    const pageSize = 100;
    const result: Aqara.DeviceInfo[] = [];
    const { data, totalCount } = await this.queryDeviceInfo({
      pageNum: 1,
      pageSize,
    });
    result.push(...data);
    if (totalCount > pageSize) {
      const pageCount = Math.ceil(totalCount / pageSize);
      for (let i = 2; i <= pageCount; i++) {
        const { data } = await this.queryDeviceInfo({
          pageNum: i,
          pageSize,
        });
        result.push(...data);
      }
    }
    return result;
  }

  getResourceValue(subjectId: string, resourceIds: string[]) {
    return this.request('query.resource.value', {
      subjectId,
      resourceIds,
    });
  }

  setResourceValue(subjectId: string, resources: Array<{ resourceId: string; value: string }>) {
    return this.request('write.resource.device', {
      subjectId,
      resources,
    });
  }

}
