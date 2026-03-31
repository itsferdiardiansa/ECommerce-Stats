import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { AuthController } from './auth.controller'
import { AuthAdminController } from './auth-admin.controller'
import { AuthService } from './auth.service'
import { RedisModule } from '@/modules/redis/redis.module'
import { SessionCleanupService } from './scheduler/session-cleanup.service'
import { AuthEventsListener } from './listeners/auth-events.listener'

@Module({
  imports: [RedisModule, ScheduleModule.forRoot()],
  controllers: [AuthController, AuthAdminController],
  providers: [AuthService, SessionCleanupService, AuthEventsListener],
  exports: [AuthService],
})
export class AuthModule {}
