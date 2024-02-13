import axios, { AxiosInstance } from 'axios';
import { createHash } from 'crypto';

export interface AqaraApiOption {
    region: 'cn' | 'us' | 'kr' | 'ru' | 'eu' | 'sg';
    appId: string;
    appKey: string;
    keyId: string;
}

const API_DOMAIN = {
  'cn': 'open-cn.aqara.com',
  'us': 'open-usa.aqara.com',
  'kr': 'open-kr.aqara.com',
  'ru': 'open-ru.aqara.com',
  'eu': 'open-ger.aqara.com',
  'sg': 'open-sg.aqara.com',
};

export class AqaraApi {
  axios!: AxiosInstance;

  constructor(private option: AqaraApiOption) {
    const { region, appId, keyId } = option;
    this.axios = axios.create({
      baseURL: `https://${API_DOMAIN[region]}/v3.0/open/api`,
    });
    this.axios.interceptors.request.use((config) => {
      config.headers['Content-Type'] = 'application/json';
      config.headers['Appid'] = appId;
      config.headers['Keyid'] = keyId;
      const { nonce, timestamp, sign } = this.sign();
      config.headers['Nonce'] = nonce;
      config.headers['Time'] = timestamp;
      config.headers['Sign'] = sign;
      return config;
    });
  }

  sign(accessToken?: string) {
    const { appId, keyId, appKey } = this.option;
    const nonce = Math.random().toString(36).slice(2);
    const timestamp = Date.now();
    const signStr = `${accessToken ? `Accesstoken=${accessToken}&` : ''}${[
      ['Appid', appId],
      ['Keyid', keyId],
      ['Nonce', nonce],
      ['Time', timestamp],
    ].map(([key, value]) => `${key}=${value}`).join('&')}${appKey}`.toLowerCase();
    const sign = createHash('md5').update(signStr).digest('hex').toLowerCase();
    return {
      nonce,
      timestamp,
      sign,
    };
  }
}