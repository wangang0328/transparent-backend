import {Controller, Get, HttpException, HttpStatus, Param, Query, SetMetadata} from '@nestjs/common';
import {AppService} from './app.service';
import { RequireLogin, RequirePermissions } from './custom.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    throw new HttpException('en', HttpStatus.UNAUTHORIZED);
  }


  @Get('testGet')
  testGet(@Query() params: any) {
    console.log('get params', params)
    throw new HttpException('垃圾请求', HttpStatus.BAD_GATEWAY)
  }

  @RequireLogin()
  @RequirePermissions('bbb')
  @Get('bbb')
  getAaa() {
    return 'bbb'
  }

  @SetMetadata('require-permission', ['ccc'])
  @SetMetadata('require-login', true)
  @Get('ccc')
  getBbb() {
    return 'ccc'
  }

  // @SetMetadata('require-permission', ['ddd'])
  // @SetMetadata('require-login', true)
  @RequireLogin()
  @RequirePermissions('ddd')
  @Get('ddd')
  getddd() {
    return 'ddd'
  }
}
