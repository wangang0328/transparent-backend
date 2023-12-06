import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Logger, Inject } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express'

// 打印日志
@Injectable()
export class InvokeRecordInterceptor implements NestInterceptor {

  private readonly logger = new Logger(InvokeRecordInterceptor.name)

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const userAgent = request.headers['user-agent']
    const { ip, method, path } = request

    // TODO: 使用 Winston 打印日志
    this.logger.debug(`${method} ${path} ${ip} ${userAgent}: ${context.getClass().name} ${context.getHandler().name}`)
    const requestTime = Date.now();

    return next.handle().pipe(tap((res) => {
      this.logger.debug(`${method} ${path} ${ip} ${userAgent}: ${response.statusCode}: ${Date.now() - requestTime}`)
    }));
  }
}
