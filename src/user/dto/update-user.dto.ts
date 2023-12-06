import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty } from "class-validator";

export class UpdateUserDto {

  @ApiProperty()
  headPic: string;

  @ApiProperty()
  nickName: string;

  @ApiProperty()
  @IsNotEmpty({
    message: '邮箱不能为空'
  })
  @IsEmail({}, { message: '邮箱不合法' })
  email: string;

  @ApiProperty()
  @IsNotEmpty({
    message: '手机号不能为空'
  })
  phoneNumber: string;

  // 邮箱修改时，必传
  @ApiProperty({
    required: false,
    description: '邮箱修改时，必传'
  })
  captcha: string;
}