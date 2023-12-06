import {BadRequestException, HttpException, HttpStatus, Inject, Injectable} from '@nestjs/common';
import { Like, Repository } from 'typeorm';
import { pick } from 'lodash'
import {User} from './entities/user.entity';
import {InjectRepository} from '@nestjs/typeorm';
import {RegisterUserDto} from './dto/register-user.dto';
import {RedisService} from 'src/redis/redis.service';
import {md5, uuid} from 'src/utils';
import { getRegisterCaptchaKey, getUpdateCaptchaKey, getPermissionsKey} from './utils';
import { Permission } from './entities/permission.entity';
import { Role } from './entities/role.entity';
import { LoginUserDto } from './dto/login-user.dto';
import { LoginUserVo } from './vo/login-user.vo';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserDetailInfoVo } from './vo/user-info.vo';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ToggleFreezeDto } from './dto/toggle-freeze.dto';
import { UserListDto } from './dto/user-list.dto';
import { UserListVo } from './vo/user-list.vo';

@Injectable()
export class UserService {
  @InjectRepository(User)
  private userRepository: Repository<User>;

  @InjectRepository(Role)
  private roleRepository: Repository<Role>;

  @InjectRepository(Permission)
  private permissionRepository: Repository<Permission>

  @Inject(RedisService)
  private redisService: RedisService;

  @Inject(JwtService)
  private jwtService: JwtService;

  @Inject(ConfigService)
  private configService: ConfigService

  /**
   * 注册
   */
  async register(user: RegisterUserDto) {
    const {email, captcha, username, password, nickName, phoneNumber} = user;
    // 1. 先校验验证码， redis
    const captchaValue = await this.redisService.get(getRegisterCaptchaKey(email));
    if (!captchaValue) {
      throw new HttpException('验证码已失效', HttpStatus.BAD_REQUEST);
    }
    if (captchaValue !== captcha) {
      throw new HttpException('验证码错误', HttpStatus.BAD_REQUEST);
    }

    // 2. 判断用户名是否被注册过了
    const foundUser = await this.userRepository.findOneBy({username});
    if (foundUser) {
      throw new HttpException('用户名已存在', HttpStatus.BAD_REQUEST);
    }

    // 3. 保存到数据库
    const toSaveUser = new User();
    toSaveUser.email = email;
    toSaveUser.username = username;
    toSaveUser.password = md5(password);
    toSaveUser.nickName = nickName;
    toSaveUser.phoneNumber = phoneNumber;
    toSaveUser.id = uuid();

    try {
      await this.userRepository.save(toSaveUser);
      return '注册成功';
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.EXPECTATION_FAILED);
    }
  }

  /**
   * 登录
   */
  async login(loginUser: LoginUserDto) {
    const foundUser = await this.userRepository.findOne({
      where: {
        username: loginUser.username
      },
      relations: ['roles', 'roles.permissions']
    })

    if (!foundUser) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);
    }

    if (foundUser.password !== md5(loginUser.password)) {
      throw new HttpException('密码错误', HttpStatus.BAD_REQUEST);
    }

    const vo = new LoginUserVo()
    // @ts-ignore
    vo.userInfo = pick(foundUser, ['username', 'id', 'nickName', 'email', 'phoneNumber', 'headPic', 'createTime', 'isAdmin', 'isFrozen'])
    const roles: string[] = []
    const permissions: Permission[] = []
    foundUser.roles.forEach((role) => {
      roles.push(role.name)
      role.permissions.forEach((p) => {
        if (!permissions.find((item) => item.id === p.id)) {
          permissions.push(p)
        }
      })
    })
    vo.userInfo.roles = roles
    vo.userInfo.permissions = permissions
    const [accessToken, refreshToken] = this.genToken(vo.userInfo.id)
    vo.accessToken = accessToken
    vo.refreshToken = refreshToken

    return vo
  }

  /**
   * 根据id获取用户详情
   */
  async findUserInfoById(id: string) {
    // 用户密码不能返回
    const user = await this.userRepository.findOne({ where: { id } })
    if (!user) {
      throw new BadRequestException('没有找到该用户');
    }
    const vo = new UserDetailInfoVo();
    vo.id = user.id;
    vo.email = user.email;
    vo.username = user.username;
    vo.headPic = user.headPic;
    vo.phoneNumber = user.phoneNumber;
    vo.nickName = user.nickName;
    vo.createTime = user.createTime;
    vo.isFrozen = user.isFrozen;
    return vo
  }

  /**
   * 修改密码
   */
  async updatePassword(id: string, pwdDto: UpdateUserPasswordDto) {
    const user = await this.userRepository.findOneBy({
      id
    })
    if (!user) {
      throw new HttpException('获取登录信息有误', HttpStatus.BAD_REQUEST)
    }

    if (md5(pwdDto.password) !== user.password) {
      throw new HttpException('密码错误', HttpStatus.BAD_REQUEST);
    }

    user.password = md5(pwdDto.newPassword)

    try {
      await this.userRepository.save(user)
      return '密码修改成功'
    } catch (error) {
      throw new HttpException('密码修改失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 更新用户信息
   */
  async updateUserInfo(
    id: string,
    { nickName, headPic, phoneNumber, email, captcha }: UpdateUserDto
  ) {
    const user = await this.userRepository.findOneBy({ id: id })
    if (!user) {
      throw new HttpException('获取登录信息有误', HttpStatus.BAD_REQUEST)
    }

    if (email !== user.email) {
      // 修改了邮箱， 校验验证码
      if (!captcha) {
        throw new HttpException('验证码不能为空', HttpStatus.BAD_REQUEST)
      }
      const code = await this.redisService.get(getUpdateCaptchaKey(email))
      if (!code) {
        throw new HttpException('验证码失效', HttpStatus.BAD_REQUEST)
      }
      if (code !== captcha) {
        throw new HttpException('验证码错误', HttpStatus.BAD_REQUEST)
      }
    }

    user.nickName = nickName
    user.headPic = headPic
    user.phoneNumber = phoneNumber
    user.email = email
    try {
      await this.userRepository.save(user)
      return 'success'
    } catch (error) {
      throw new HttpException('用户信息修改失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 冻结/解冻用户
   */
  async toggleFreeze({ userId, isFreeze }: ToggleFreezeDto) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new HttpException('用户id错误', HttpStatus.BAD_REQUEST);
    }
    // TODO: 自动转换
    user.isFrozen = isFreeze;

    await this.userRepository.save(user)
    return 'success'
  }

  /**
   * 查找用户列表
   */
  async list(
   { pageNo,
    pageSize,
    username,
    nickName,
    email }: UserListDto
  ) {
    const skipCount = (pageNo - 1) * pageSize;
    const condition: Record<string, any> = {};
    if (username) {
      condition.username = Like(`%${username}%`)
    }
    if (nickName) {
      condition.nickName = Like(`%${nickName}%`)
    }
    if (email) {
      condition.email = email
    }
    const [list, total] = await this.userRepository.findAndCount({
      skip: skipCount,
      take: pageSize,
      select: ['id', 'username', 'nickName', 'email', 'phoneNumber', 'isFrozen', 'isAdmin', 'createTime', 'updateTime'],
      where: condition
    })

    const userListVo = new UserListVo()
    userListVo.list = list
    userListVo.total = total
    return userListVo
  }

  /**
   * 初始化数据
   */
  async initData() {
    const user1 = new User() as any;
    user1.username = "zhangsan";
    user1.password = md5("111111");
    user1.email = "xxx@xx.com";
    user1.isAdmin = true;
    user1.nickName = '张三';
    user1.phoneNumber = '13233323333';
    user1.id = uuid()
    user1.sayHi()
    console.log('use1--', user1)

    const user2 = new User();
    user2.username = 'lisi';
    user2.password = md5("222222");
    user2.email = "yy@yy.com";
    user2.nickName = '李四';
    user2.phoneNumber = '13233323334';
    user2.id = uuid()

    const role1 = new Role();
    role1.name = '管理员';
    role1.id = uuid()

    const role2 = new Role();
    role2.name = '普通用户';
    role2.id = uuid()

    const permission1 = new Permission();
    permission1.code = 'ccc';
    permission1.description = '访问 ccc 接口';
    permission1.id = uuid()

    const permission2 = new Permission();
    permission2.code = 'ddd';
    permission2.description = '访问 ddd 接口';
    permission2.id = uuid()

    user1.roles = [role1];
    user2.roles = [role2];

    role1.permissions = [permission1, permission2];
    role2.permissions = [permission1];

    await this.permissionRepository.save([permission1, permission2]);
    await this.roleRepository.save([role1, role2]);
    await this.userRepository.save([user1, user2]);
  }

  /**
   * 获取jwt的token
   */
  genToken(userId: string) {
    const accessToken = this.jwtService.sign({
      userId
    }, {
      expiresIn: this.configService.get('jwt_access_token_expires') || '30m'
    })

    const refreshToken = this.jwtService.sign({
      userId
    }, {
      expiresIn: this.configService.get('jwt_refresh_token_expires') || '7d'
    })
    this.cachePermissions(userId)
    return [accessToken, refreshToken]
  }

  /**
   * 缓存权限到 redis 中
   */
  async cachePermissions(userId: string) {
    // 如果 有 permissions, 直接保存redis
    // 如果没有，先根据userId 请求userInfo 然后保存 到redis
    const foundUser = await this.userRepository.findOne({
      where: {
        id: userId
      },
      relations: ['roles', 'roles.permissions']
    })
    if (!foundUser) {
      return
    }
    const permissions = foundUser.roles.reduce((arr, role) => {
      role.permissions.forEach((p) => {
        if (!arr.find((item) => item.id === p.id)) {
          arr.push(p)
        }
      })
      return arr
    }, [])
    // TODO: 根据refreshToken的过期时间来，不能在此写死
    // 第二个问题：如果在30 min 期间，修改了角色对应的权限，不会刷新最新的
    this.redisService.set(getPermissionsKey(userId), JSON.stringify(permissions), 30 * 60)
  }
}
