import { ApiProperty } from "@nestjs/swagger";

class User {
  @ApiProperty()
  id: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phoneNumber: string;

  @ApiProperty()
  isFrozen: boolean;

  @ApiProperty()
  isAdmin: boolean;

  @ApiProperty()
  createTime: Date;

  @ApiProperty()
  updateTime: Date;
}

export class UserListVo {
  @ApiProperty({
    // 如果不加该类型， [string]
    type: [User]
  })
  list: User[];

  @ApiProperty()
  total: number;
}