import {Module} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core'
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as path from 'path'
import { JwtModule } from '@nestjs/jwt'
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {UserModule} from './user/user.module';
import {User} from './user/entities/user.entity';
import {Role} from './user/entities/role.entity';
import {Permission} from './user/entities/permission.entity';
import {RedisModule} from './redis/redis.module';
import {EmailModule} from './email/email.module';
import { LoginGuard } from './login.guard';
import { PermissionGuard } from './permission.guard';

const getEnvPath = () => {
  if (process.env.NODE_ENV === 'development') {
    return path.join(__dirname, '../env/.development.env')
  }
  return path.join(__dirname, '../env/.production.env')
}

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory(configService: ConfigService) {
        return {
          type: 'mysql',
          username: configService.get('mysql_server_username'),
          password: configService.get('mysql_server_password'),
          host: configService.get('mysql_server_host'),
          database: configService.get('mysql_server_database'),
          port: configService.get('mysql_server_port'),
          synchronize: true,
          logging: false,
          entities: [User, Role, Permission],
          poolSize: 10,
          connectorPackage: 'mysql2',
          extra: {
            // authPlugin: 'sha256_password',
          }
        }
      },
      inject: [ConfigService]
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: getEnvPath()
    }),
    JwtModule.registerAsync({
      global: true,
      useFactory(configService: ConfigService) {
        return {
          secret: configService.get('jwt_secret'),
          signOptions: {
            expiresIn: '30m' // 默认 30 分钟过期
          }
        }
      },
      inject: [ConfigService]
    }),
    UserModule,
    RedisModule,
    EmailModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: LoginGuard
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard
    }
  ]
})
export class AppModule {}
