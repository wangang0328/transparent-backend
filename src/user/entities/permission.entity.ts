import {Column, Entity, PrimaryColumn} from 'typeorm';

@Entity({
  name: 'permissions'
})
export class Permission {
  @PrimaryColumn({
    length: 26
  })
  id: string;

  @Column({
    length: 20,
    comment: '权限代码'
  })
  code: string;

  @Column({
    length: 100,
    comment: '权限描述'
  })
  description: string;
}
