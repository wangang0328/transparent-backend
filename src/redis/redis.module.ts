import {Global, Module} from '@nestjs/common';
import {RedisService} from './redis.service';
import {createClient} from 'redis';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  providers: [
    RedisService,
    {
      provide: 'REDIS_CLIENT',
      async useFactory(configService: ConfigService) {
        const client = createClient({
          socket: {
            port: configService.get('redis_server_port'),
            host: configService.get('redis_server_host')
          },
          password: configService.get('redis_server_password'),
          // 一个命名空间的概念， 避免冲突
          database: configService.get('redis_server_db')
        });
        await client.connect();
        return client;
      },
      inject: [ConfigService]
    },
  ],
  exports: [RedisService]
})
export class RedisModule {}
