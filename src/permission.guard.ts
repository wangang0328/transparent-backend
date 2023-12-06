import { getPermissionsKey } from './user/utils';
import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisService } from './redis/redis.service';

@Injectable()
export class PermissionGuard implements CanActivate {

  @Inject(Reflector)
  private reflector: Reflector;

  @Inject(RedisService)
  private redisService: RedisService;

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean>{
    const request = context.switchToHttp().getRequest()
    const user = request.user
    if (!request.user) {
      // 没有user，说明loginGuard 过了， 不需要登录，所以也就不用校验权限
      return true;
    }

    try {
      const permissionsStr = await this.redisService.get(getPermissionsKey(user.userId))
      console.log('permissionStr', permissionsStr, getPermissionsKey(user.userId))
      const permissions = JSON.parse(permissionsStr) || []
      const requiredPermissions = this.reflector.getAllAndOverride<string[]>('require-permissions', [context.getClass(), context.getHandler()]);
      if (!requiredPermissions) {
        return true
      }
      for (let i = 0; i < requiredPermissions.length; i++) {
        const curPermission = requiredPermissions[i];
        const found = permissions.find(({ code }) => code === curPermission)
        if (!found) {
          throw new UnauthorizedException('您没有该接口的访问权限')
        }
      }
    } catch (error) {
      throw error;
    }
    return true;
  }
}
