import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, MinLength } from "class-validator";

export class UpdateUserPasswordDto {

  @ApiProperty()
  @IsNotEmpty({
    message: '原始密码不能为空'
  })
  @MinLength(6, {
    message: '密码不能低于 6 位'
  })
  password: string;

  @ApiProperty()
  @IsNotEmpty({
    message: '新密码不能为空'
  })
  @MinLength(6, {
    message: '密码不能低于 6 位'
  })
  newPassword: string;
}