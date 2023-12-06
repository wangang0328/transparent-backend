import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException, Module } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { Request } from 'express'
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

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
      throw new UnauthorizedException('用户未登录');
    }

    // 判断有效性
    try {
      const [, token] = authorization.split(' ')
      const data = this.jwtService.verify<JwtUser>(token)
      request.user = {
        userId: data.userId
      }
    } catch (error) {
      throw new UnauthorizedException('token 失效，请重新登录');
    }

    return true;
  }
}
