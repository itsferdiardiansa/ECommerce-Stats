import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { AuthController } from './auth.controller'
import { AuthAdminController } from './auth-admin.controller'
import { SudoController } from './sudo.controller'
import { MfaController } from './mfa.controller'
import { AuthService } from './auth.service'
import { RedisModule } from '@/modules/redis/redis.module'
import { SessionCleanupService } from './scheduler/session-cleanup.service'
import { LoginAnomalyService } from './services/login-anomaly.service'
import { SudoService } from './services/sudo.service'
import { TotpService } from './services/totp.service'
import { MfaService } from './services/mfa.service'
import { TrustedDeviceService } from './services/trusted-device.service'
import { AuthAuditListener } from './listeners/auth-audit.listener'
import { SecurityAlertListener } from './listeners/security-alert.listener'

@Module({
  imports: [RedisModule, ScheduleModule.forRoot()],
  controllers: [
    AuthController,
    AuthAdminController,
    SudoController,
    MfaController,
  ],
  providers: [
    AuthService,
    SudoService,
    TotpService,
    MfaService,
    TrustedDeviceService,
    SessionCleanupService,
    LoginAnomalyService,
    AuthAuditListener,
    SecurityAlertListener,
  ],
  exports: [AuthService],
})
export class AuthModule {}
