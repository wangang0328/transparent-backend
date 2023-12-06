import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryColumn,
  UpdateDateColumn
} from 'typeorm';
import {Role} from './role.entity';

// const Genv = (target: Object, propertyKey: string | symbol) => {
//   let data = 'aa'
//   Object.defineProperty(target, propertyKey, {
//     set(v) {
//       console.log('set---', v)
//       data = v
//     },
//     get() {
//       return data
//     },
//   })
//   console.log('target----', target, propertyKey)
//     ; (target as any).test = 'aaa'
// }

const Ctest = (target: Function) => {
  target.prototype.sayHi = () => {
    console.log('hi')
  }
  let data = 'aa'
  Object.defineProperty(target, 'name', {
    set(v) {
      console.log('set---', v)
      data = v
    },
    get() {
      return data
    },
  })
  target.prototype.name =' helll'
  // console.log(target.prototype.name = 1, target)
}

@Entity({
  name: 'users'
})
@Ctest
export class User {
  @PrimaryColumn({
    length: 26
  })
  // @Genv
  id: string;

  @Column({
    length: 30,
    comment: '用户名'
  })
  username: string;

  @Column({
    length: 50,
    comment: '密码'
  })
  password: string;

  @Column({
    length: 30,
    comment: '昵称',
    nullable: true,
    name: 'nick_name'
  })
  nickName: string;

  @Column({
    length: 50,
    comment: '邮箱'
  })
  email: string;

  @Column({
    length: 20,
    comment: '手机号',
    name: 'phone_number'
  })
  phoneNumber: string;

  @Column({
    length: 100,
    comment: '头像',
    nullable: true,
    name: 'head_pic'
  })
  headPic: string;

  // boolean 会自动被转成 tinyint类型
  @Column({
    comment: '是否冻结',
    default: false,
    name: 'is_frozen'
  })
  isFrozen: boolean;

  // 后续要废弃
  @Column({
    comment: '是否管理员',
    default: false,
    name: 'is_admin'
  })
  isAdmin: boolean;

  @CreateDateColumn({
    name: 'create_time'
  })
  createTime: Date;

  @UpdateDateColumn({
    name: 'update_time'
  })
  updateTime: Date;

  @ManyToMany(() => Role, {createForeignKeyConstraints: false})
  @JoinTable({
    name: 'user_roles',
    joinColumn: {name: 'user_id'},
    inverseJoinColumn: {name: 'role_id'}
  })
  roles: Role[];
}
