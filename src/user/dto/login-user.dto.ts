import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class LoginUserDto {

  @ApiProperty({
    example: '张三'
  })
  @IsNotEmpty({
    message: '用户名不能为空'
  })
  username: string;

  @ApiProperty({
    example: '123456'
  })
  @IsNotEmpty({
    message: '密码不能为空'
  })
  password: string;
}