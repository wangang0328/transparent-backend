import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class CustomExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    response.statusCode = HttpStatus.OK
    const { message } = exception.getResponse() as { message: any }

    response.json({
      code: exception.getStatus(),
      message: message?.join?.(',') || exception.message,
      data: null
    }).end();
  }
}
