type AqaraPlatformAccessory = import('homebridge').PlatformAccessory<AqaraPlatformAccessoryContext>;

interface AqaraPlatformAccessoryContext {
  deviceInfo: Aqara.DeviceInfo;
}

declare namespace Aqara {
  interface AppConfig {
    appId: string;
    appKey: string;
    keyId: string;
  }

  interface GetTokenResponse {
    expiresIn: string;
    openId: string;
    accessToken: string;
    refreshToken: string;
  }

  interface QueryDeviceInfoRequest {
    dids?: string[];
    positionId?: string;
    pageNum?: number;
    pageSize?: number;
  }

  /**
   * 设备信息
   */
  interface DeviceInfo {
    /** 设备id */
    did: string;
    /** 网关id */
    parentDid: string;
    /** 物模型 */
    model: string;
    /** 1：可挂子设备的网关；2：不可挂子设备的网关；3：子设备 */
    modelType: number;
    /** 在线状态：1-在线 0-离线 */
    state: number;
    /** 时区 */
    timeZone: string;
    /** 固件版本号 */
    firmwareVersion: string;
    /** 入网时间 */
    createTime: number;
    /** 更新时间 */
    updateTime: number;
    /** 设备名称 */
    deviceName: string;
  }

  interface QueryDeviceInfoResponse {
    data: DeviceInfo[];
    /** 设备数量 */
    totalCount: number;
  }

  interface ResourceValue {
    /** 设备id */
    subjectId: string;
    /** 资源id */
    resourceId: string;
    /** 资源值 */
    value: string;
    /** 时间戳(毫秒) */
    timeStamp: string;
  }

  interface SetResourceValueRequest {
    subjectId: string;
    resources: {
      resourceId: string;
      value: string;
    }[];
  }
}
