import {NestExpressApplication} from '@nestjs/platform-express';
import {ValidationPipe} from '@nestjs/common';
import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import { ConfigService } from '@nestjs/config';
import { FormatResponseInterceptor } from './format-response.interceptor';
import { InvokeRecordInterceptor } from './invoke-record.interceptor';
import { CustomExceptionFilter } from './custom-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  // 格式化-拦截器
  app.useGlobalInterceptors(new FormatResponseInterceptor());
  // 访问记录-拦截器
  app.useGlobalInterceptors(new InvokeRecordInterceptor());
  // 处理 HttpException 类型的数据
  app.useGlobalFilters(new CustomExceptionFilter);
  app.enableCors()

  // 配置 swagger
  const config = new DocumentBuilder()
    .setTitle('Transparent前端监控平台')
    .setDescription('api 接口文档')
    .setVersion('1.0.0')
    .addBearerAuth({
      type: 'http',
      description: '基于 jwt 的认证'
    })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('apiDoc', app, document);

  const configService = app.get(ConfigService);
  await app.listen(configService.get('nest_server_port'));
}

bootstrap();
