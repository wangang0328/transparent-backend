import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Response } from 'express';

// 拦截，统一返回格式
@Injectable()
export class FormatResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse<Response>();
    // 抛出的异常还是由内置的 Exception Filter 来处理
    return next.handle().pipe(map(data => {
      return {
        statusCode: response.statusCode,
        message: 'success',
        data
      }
    }));
  }
}
