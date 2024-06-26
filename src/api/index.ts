import axios, { AxiosInstance } from 'axios';
import { createHash } from 'crypto';
import path from 'path';
import fs from 'fs';
import { Logger } from 'homebridge/lib/logger';
import { BatchRequestManager } from 'batch-request-manager';
import { API_DOMAIN } from './constants';
import { inspect } from 'util';

export interface AqaraApiOption extends Aqara.AppConfig {
  region: 'cn' | 'us' | 'kr' | 'ru' | 'eu' | 'sg';
  account: string;
  storagePath: string;
}

export class AqaraApi {
  axios!: AxiosInstance;

  logger = new Logger('AqaraApi');

  get configPath() {
    const { storagePath, account } = this.option;
    const configDir = path.resolve(storagePath, 'aqara');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir);
    }
    return path.resolve(configDir, `${account}.json`);
  }

  get accountConfig() {
    if (!fs.existsSync(this.configPath)) {
      return null;
    }
    const accountConfigStr = fs.readFileSync(this.configPath, 'utf-8');
    try {
      const accountConfig = JSON.parse(accountConfigStr);
      return accountConfig as Omit<Aqara.GetTokenResponse, 'expiresIn'> & { expiresAt: number; account: string };
    } catch (error) {
      return null;
    }
  }

  get accessToken() {
    if (!this.accountConfig) {
      return undefined;
    }
    if (this.accountConfig.expiresAt < Date.now()) {
      return undefined;
    }
    return this.accountConfig.accessToken;
  }

  retry = false;

  constructor(private option: AqaraApiOption) {
    const { region, appId, keyId } = option;
    this.axios = axios.create({
      baseURL: `https://${API_DOMAIN[region]}`,
    });
    this.axios.interceptors.request.use((config) => {
      config.headers['Content-Type'] = 'application/json';
      config.headers['Appid'] = appId;
      config.headers['Keyid'] = keyId;
      const accessToken = !config.data.intent?.startsWith('config.auth') ? this.accessToken : undefined;
      const { nonce, timestamp, sign } = this.sign(accessToken);
      config.headers['Nonce'] = nonce;
      config.headers['Time'] = timestamp;
      config.headers['Sign'] = sign;
      if (accessToken) {
        config.headers['Accesstoken'] = accessToken;
      }
      return config;
    });
    this.axios.interceptors.response.use(
      (response) => {
        if (response.data.code === 108 && response.config?.data?.intent !== 'config.auth.refreshToken' && !this.retry) {
          this.retry = true;
          return this.refreshToken()
            .then(() => this.axios(response.config))
            .finally(() => {
              this.retry = false;
            });
        }
        if (response.data.code !== 0) {
          const errorMessage = `[${response.data.code}] ${response.data.message}`;
          this.logger.error(errorMessage);
          throw new Error(errorMessage);
        }
        return response.data.result;
      },
      (error) => {
        this.logger.error(error);
      },
    );
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

  request<T>(intent: string, data: any) {
    this.logger.info('Request:', intent, inspect(data, true, Infinity));
    return this.axios.post('/v3.0/open/api', {
      intent,
      data,
    }) as Promise<T>;
  }

  getAuthCode(account: string) {
    return this.request('config.auth.getAuthCode', {
      account,
      accountType: 0,
      accessTokenValidity: '1y',
    });
  }

  getToken(account: string, authCode: string) {
    return this.request<Aqara.GetTokenResponse>('config.auth.getToken', {
      account,
      accountType: 0,
      authCode,
    }).then((res) => {
      this.saveAccountConfig(res);
      return res;
    });
  }

  refreshToken(refreshToken: string = this.accountConfig?.refreshToken || '') {
    return this.request<Aqara.GetTokenResponse>('config.auth.refreshToken', {
      refreshToken,
    }).then((res) => {
      this.saveAccountConfig(res);
      return res;
    });
  }

  private saveAccountConfig({ expiresIn, ...rest }: Aqara.GetTokenResponse) {
    const expiresAt = Date.now() + parseInt(expiresIn) * 1000;
    const result = { ...rest, expiresAt, account: this.option.account };
    fs.writeFileSync(this.configPath, JSON.stringify(result, null, 2));
  }

  queryDeviceInfo(params: Aqara.QueryDeviceInfoRequest) {
    return this.request<Aqara.QueryDeviceInfoResponse>('query.device.info', params);
  }

  async getAllDevices(positionId?: string) {
    try {
      const pageSize = 100;
      const result: Aqara.DeviceInfo[] = [];
      const { data, totalCount } = await this.queryDeviceInfo({
        pageNum: 1,
        pageSize,
        positionId,
      });
      result.push(...data);
      if (totalCount > pageSize) {
        const pageCount = Math.ceil(totalCount / pageSize);
        for (let i = 2; i <= pageCount; i++) {
          const { data } = await this.queryDeviceInfo({
            pageNum: i,
            pageSize,
            positionId,
          });
          result.push(...data);
        }
      }
      return result;
    } catch (error) {
      return [];
    }
  }

  getResourceBrm = new BatchRequestManager<
    { subjectId: string; resourceIds: string[] }[],
    { subjectId: string; resourceId: string },
    Aqara.ResourceValue[]
  >(
    (resources) => {
      return this.request<Aqara.ResourceValue[]>('query.resource.value', { resources });
    },
    (requests) => {
      return requests.reduce<{ subjectId: string; resourceIds: string[] }[]>((acc, item) => {
        const index = acc.findIndex((i) => i.subjectId === item.subjectId);
        if (index === -1) {
          acc.push({ subjectId: item.subjectId, resourceIds: [item.resourceId] });
        } else {
          acc[index].resourceIds.push(item.resourceId);
        }
        return acc;
      }, []);
    },
  );

  getResourceValue(subjectId: string, resourceId: string) {
    return this.getResourceBrm.request({ subjectId, resourceId });
  }

  setResourceBrm = new BatchRequestManager<
    Aqara.SetResourceValueRequest[],
    { subjectId: string; resourceId: string; value: string },
    void
  >(
    (params) => this.request<void>('write.resource.device', params),
    (requests) => {
      return requests.reduce<Aqara.SetResourceValueRequest[]>((acc, item) => {
        const index = acc.findIndex((i) => i.subjectId === item.subjectId);
        if (index === -1) {
          acc.push({ subjectId: item.subjectId, resources: [{ resourceId: item.resourceId, value: item.value }] });
        } else {
          acc[index].resources.push({ resourceId: item.resourceId, value: item.value });
        }
        return acc;
      }, []);
    },
  );

  setResourceValue(subjectId: string, resourceId: string, value: string) {
    return this.setResourceBrm.request({ subjectId, resourceId, value });
  }

  queryIrInfo(did: string) {
    return this.request<Aqara.QueryIrInfoResponse>('query.ir.info', { did });
  }

  queryIrKeys(did: string) {
    return this.request<Aqara.QueryIrKeysResponse>('query.ir.keys', { did });
  }
}
