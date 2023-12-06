import {Module} from '@nestjs/common';
import {UserService} from './user.service';
import {UserController} from './user.controller';
import {TypeOrmModule} from '@nestjs/typeorm';
import {User} from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';

@Module({
  imports: [
    // 为了在servcie 里面使用 Repository, 如果用 entitymanager 不需要
    TypeOrmModule.forFeature([User, Role, Permission])
  ],
  controllers: [UserController],
  providers: [UserService]
})
export class UserModule {}
