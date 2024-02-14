import axios, { AxiosInstance } from 'axios';
import { createHash } from 'crypto';


export interface AqaraApiOption extends Aqara.AppConfig {
  region: 'cn' | 'us' | 'kr' | 'ru' | 'eu' | 'sg';
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

  private sign(accessToken?: string) {
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

  async getAuthCode() {
    const { data } = await this.axios.post('/', {
      "intent": "config.auth.getAuthCode",
      "data": {
        "account": "189000123456",
        "accountType": 0,
        "accessTokenValidity": "1h"
      }
    });
    return data;
  }
}