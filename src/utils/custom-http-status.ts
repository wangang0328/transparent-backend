export enum CustomHttpStatus {
  /**
   * 未获取到 accesstoken
   */
  NO_ACCESS_TOKEN = 1002,

  /**
   * accessToken 失效
   */
  ACCESS_TOKEN_EXPIRED = 1003,

  /**
   * 未获取到 refresh token
   */
  NO_REFRESH_TOKEN = 1004,

  /**
   * refreshToken 登录信息失效
   */
  REFRESH_TOKEN_EXPIRED = 1005
}
