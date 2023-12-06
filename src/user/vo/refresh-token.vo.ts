import { ApiProperty } from "@nestjs/swagger";


export class RefreshTokenVo {

  @ApiProperty({
    description: '放到请求头的 token'
  })
  accessToken: string;

  @ApiProperty({
    description: '刷新 token'
  })
  refreshToken: string;
}