import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException, Module, HttpException, HttpStatus } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { Request } from 'express'
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { CustomHttpStatus } from './utils/custom-http-status';

interface JwtUser {
  userId: string
}

declare module 'express' {
  interface Request {
    user: JwtUser
  }
}

@Injectable()
export class LoginGuard implements CanActivate {
  @Inject(Reflector)
  private reflector: Reflector;

  @Inject(JwtService)
  private jwtService: JwtService;

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: Request = context.switchToHttp().getRequest()

    const requireLogin = this.reflector.getAllAndOverride('require-login', [context.getClass(), context.getHandler()])

    if (!requireLogin) {
      // 不需要鉴权
      return true
    }
    const authorization = request.headers.authorization
    if (!authorization) {
      throw new HttpException('用户未登录', CustomHttpStatus.NO_ACCESS_TOKEN);
    }

    // 判断有效性
    try {
      const [, token] = authorization.split(' ')
      if (!token) {
        throw new HttpException('用户未登录', CustomHttpStatus.NO_ACCESS_TOKEN);
      }
      const data = this.jwtService.verify<JwtUser>(token)
      request.user = {
        userId: data.userId
      }
    } catch (error) {
      throw new HttpException('refresh token 过期', CustomHttpStatus.ACCESS_TOKEN_EXPIRED);
    }

    return true;
  }
}
