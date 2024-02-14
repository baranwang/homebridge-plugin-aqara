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
}
