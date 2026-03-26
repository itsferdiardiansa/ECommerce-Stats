import { Module } from '@nestjs/common'
import { AuthController } from './auth.controller'
import { AuthAdminController } from './auth-admin.controller'
import { AuthService } from './auth.service'
import { RedisModule } from '@/modules/redis/redis.module'

@Module({
  imports: [RedisModule],
  controllers: [AuthController, AuthAdminController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
