/**
 * 获取注册验证码的key
 */
export const getRegisterCaptchaKey = (v: string) => `register_captcha_${v}`;
export const getUpdateCaptchaKey = (v: string) => `update_captcha_${v}`;

export const getPermissionsKey = (v: string) => `permissions_${v}`;
