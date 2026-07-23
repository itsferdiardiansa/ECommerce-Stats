import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { AuthController } from './auth.controller'
import { AuthAdminController } from './auth-admin.controller'
import { AuthService } from './auth.service'
import { RedisModule } from '@/modules/redis/redis.module'
import { SessionCleanupService } from './scheduler/session-cleanup.service'
import { LoginAnomalyService } from './services/login-anomaly.service'
import { AuthAuditListener } from './listeners/auth-audit.listener'
import { SecurityAlertListener } from './listeners/security-alert.listener'

@Module({
  imports: [RedisModule, ScheduleModule.forRoot()],
  controllers: [AuthController, AuthAdminController],
  providers: [
    AuthService,
    SessionCleanupService,
    LoginAnomalyService,
    AuthAuditListener,
    SecurityAlertListener,
  ],
  exports: [AuthService],
})
export class AuthModule {}
