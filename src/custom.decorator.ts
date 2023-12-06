import { ExecutionContext, SetMetadata, createParamDecorator } from "@nestjs/common";
import { Request } from 'express'

/**
 * 登录校验
 * @returns
 */
export const RequireLogin = () => SetMetadata('require-login', true);

/**
 * 鉴权, 如果设置了permissions，一定是要校验登录的
 * @param permissions
 * @returns
 */
export const RequirePermissions = (...permissions: string[]) => SetMetadata('require-permissions', permissions);

export const UserInfo = createParamDecorator(
  (key: string | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<Request>()
    if (!request.user) {
      return null
    }
    return key ? request.user[key] : request.user
  }
)
