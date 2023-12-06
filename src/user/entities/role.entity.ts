import {Column, Entity, JoinTable, ManyToMany, PrimaryColumn} from 'typeorm';
import {Permission} from './permission.entity';

@Entity({
  name: 'roles'
})
export class Role {
  @PrimaryColumn({
    length: 26
  })
  id: string;

  @Column({
    length: 20,
    comment: '角色名'
  })
  name: string;

  @ManyToMany(() => Permission)
  @JoinTable({
    name: 'role_permissions',
    joinColumn: {name: 'role_id'},
    inverseJoinColumn: {name: 'permission_id'}
  })
  permissions: Permission[];
}
