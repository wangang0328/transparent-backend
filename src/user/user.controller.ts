import {Body, Controller, Post, Get, Query, Inject, UnauthorizedException, HttpException, HttpStatus, BadRequestException, ParseIntPipe} from '@nestjs/common';
import {UserService} from './user.service';
import {RegisterUserDto} from './dto/register-user.dto';
import {RedisService} from 'src/redis/redis.service';
import {EmailService} from 'src/email/email.service';
import { getRegisterCaptchaKey, getUpdateCaptchaKey } from './utils';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { RequireLogin, RequirePermissions, UserInfo } from 'src/custom.decorator';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ToggleFreezeDto } from './dto/toggle-freeze.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginUserVo } from './vo/login-user.vo';
import { RefreshTokenVo } from './vo/refresh-token.vo';
import { UserDetailInfoVo } from './vo/user-info.vo';
import { UserListDto } from './dto/user-list.dto';
import { UserListVo } from './vo/user-list.vo';
import { CustomHttpStatus } from 'src/utils/custom-http-status';

@ApiTags('用户管理模块')
@Controller('user')
export class UserController {
  @Inject(RedisService)
  private redisService: RedisService;

  @Inject(EmailService)
  private emailService: EmailService;

  @Inject(JwtService)
  private jwtService: JwtService;

  constructor(private readonly userService: UserService) {}

  /**
   * 注册
   */
  @ApiOperation({ summary: '注册' })
  @ApiBody({ type: RegisterUserDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '注册成功',
    type: String
  })
  @Post('register')
  register(@Body() registerUser: RegisterUserDto) {
    return this.userService.register(registerUser);
  }

  /**
   * 注册-发送验证码
   */
  @ApiOperation({ summary: '注册-发送验证码' })
  @ApiQuery({
    name: 'address',
    type: String,
    description: '邮箱地址',
    required: true,
    example: 'XXX@qq.com'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '发送成功',
    type: String
  })
  @Get('registerCaptcha')
  async registerCaptcha(@Query('address') address: string) {
    if (!address) {
      throw new BadRequestException("邮箱不能为空");
    }
    const randomCode = Math.random().toString().slice(2, 8);
    await this.redisService.set(getRegisterCaptchaKey(address), randomCode, 5 * 60);
    await this.emailService.sendMail(
      address,
      '【前端监控平台】注册验证码',
      `<p>你的注册验证码 ${randomCode}, 5分钟内有效</p>`
    );
    return '发送成功';
  }

  /**
   * 修改信息-发送验证码
   */
  @ApiBearerAuth()
  @ApiOperation({ summary: '修改信息-发送验证码' })
  @ApiQuery({
    name: 'address',
    type: String,
    description: '邮箱地址',
    required: true,
    example: 'XXX@qq.com'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '发送成功',
    type: String
  })
  @RequireLogin()
  @Get('updateUserCaptcha')
  async updateUserCaptcha(@Query('address') address: string) {
    const randomKey = Math.random().toString().slice(2, 8);
    await this.redisService.set(getUpdateCaptchaKey(address), randomKey, 5 * 60);
    await this.emailService.sendMail(
      address,
      '【前端监控平台】修改用户信息验证码',
      `<p>你的验证码为 ${randomKey}, 5分钟内有效</p>`
    )
    return '发送成功'
  }

  /**
   * 数据初始化
   */
  @Get('init')
  async initData() {
    await this.userService.initData()
    return '成功'
  }

  /**
   * 登录
   */
  @ApiOperation({ summary: '登录' })
  @ApiBody({ type: LoginUserDto })
  @ApiResponse({
    type: LoginUserVo
  })
  @Post('login')
  login(@Body() loginUser: LoginUserDto) {
    return this.userService.login(loginUser)
  }

  // token的无感刷新
  @ApiOperation({ summary: '无感刷新' })
  @ApiQuery({
    name: 'token',
    description: '刷新的token',
    type: String,
    example: 'XXXXXXYYYYYYYZZZZZZZ'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '刷新成功',
    type: RefreshTokenVo
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'token 已失效，请重新登录'
  })
  @Get('refreshToken')
  async refreshToken(@Query('token') refreshToken: string) {
    if (!refreshToken) {
      throw new HttpException('缺少参数', CustomHttpStatus.NO_REFRESH_TOKEN);
    }
    try {
      const data = this.jwtService.verify<{ userId: string }>(refreshToken)
      const [accessToken, newRefreshToken] = this.userService.genToken(data.userId)
      return {
        accessToken,
        refreshToken: newRefreshToken
      }
    } catch (error) {
      throw new HttpException("token 已失效，请重新登录", CustomHttpStatus.REFRESH_TOKEN_EXPIRED)
    }
  }

  // 获取用户信息
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取登陆人信息' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '登陆人信息详情',
    type: UserDetailInfoVo
  })
  @Get('info')
  @RequireLogin()
  async userInfo(@UserInfo('userId') id: string) {
    return this.userService.findUserInfoById(id)
  }

  /**
   * 更新密码
   */
  @ApiBearerAuth()
  @ApiOperation({ summary: '修改密码' })
  @ApiBody({
    type: UpdateUserPasswordDto
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: String,
    description: 'success',
  })
  @Post('updatePassword')
  @RequireLogin()
  updatePassword(@UserInfo('userId') id: string, @Body() pwdDto: UpdateUserPasswordDto) {
    return this.userService.updatePassword(id, pwdDto)
  }

  /**
   * 更新用户信息
   */
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新当前登陆人信息' })
  @ApiBody({
    type: UpdateUserDto
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: String,
    description: 'success',
  })
  @Post('update')
  @RequireLogin()
  updateUser(@UserInfo('userId') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateUserInfo(id, updateUserDto)
  }

  /**
   * 冻结/解冻用户
   */
  @ApiBearerAuth()
  @ApiOperation({ summary: '冻结/解冻用户' })
  @ApiBody({
    type: ToggleFreezeDto
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: String,
    description: '冻结/解冻成功',
  })
  @Post('toggleFreeze')
  @RequireLogin()
  @RequirePermissions('toggleFreeze')
  toggleFreeze(@Body() freeezeData: ToggleFreezeDto) {
    return this.userService.toggleFreeze(freeezeData)
  }

  /**
   * 用户列表
   */
  @ApiBearerAuth()
  @ApiOperation({ summary: 'user 列表' })
  @ApiBody({
    type: UserListDto
  })
  @ApiResponse({
    type: UserListVo
  })
  @Get('list')
  @RequireLogin()
  @RequirePermissions('user_list')
  list(
    @Body() selectInfo: UserListDto
  ) {
    return this.userService.list(selectInfo);
  }
}
