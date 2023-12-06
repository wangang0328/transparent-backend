import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  MinLength,
  IsEmail,
  isNotEmpty,
  IsPhoneNumber
} from 'class-validator';
// dto 是封装body里的请求参数的

export class RegisterUserDto {
  @IsNotEmpty({
    message: '用户名不能为空'
  })
  @ApiProperty({
    example: 'zhangsan'
  })
  username: string;

  @ApiProperty({
    required: false,
    example: '张三丰'
  })
  nickName: string;

  @IsNotEmpty({
    message: '密码不能为空'
  })
  @ApiProperty({
    example: '123456'
  })
  @MinLength(6, {message: '密码最低6位'})
  password: string;

  @IsNotEmpty({
    message: '邮箱不能为空'
  })
  @ApiProperty({
    example: '**@qq.com'
  })
  @IsEmail(
    {},
    {
      message: '不合法的邮箱格式'
    }
  )
  email: string;

  @IsNotEmpty({
    message: '手机号不能为空'
  })
  @IsPhoneNumber('CN', {
    message: '不合法的手机号'
  })
  @ApiProperty({
    description: '手机号，后续需要用手机号发短信校验',
    example: '13100000000'
  })
  phoneNumber: string;

  /**
   * 验证码
   */
  @IsNotEmpty({
    message: '验证码不能为空'
  })
  @ApiProperty({
    example: '123456'
  })
  captcha: string;
}
