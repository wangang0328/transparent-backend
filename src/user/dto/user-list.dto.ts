import { ApiProperty } from "@nestjs/swagger";

export class UserListDto {

  @ApiProperty()
  pageNo: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty({
    required: false
  })
  username: string;

  @ApiProperty({
    required: false
  })
  nickName: string;

  @ApiProperty({
    required: false
  })
  email: string;
}