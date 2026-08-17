import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { LoginLockout } from '@rufieltics/auth-server'
import { StaffAuthController } from './staff-auth.controller'
import { StaffAuthService } from './staff-auth.service'
import { StaffTokenService } from './staff-token.service'
import { StaffAuthGuard } from './guards/staff-auth.guard'
import { StaffPermissionGuard } from './guards/staff-permission.guard'
import { StaffLockoutStore } from './stores/staff-lockout.store'
import { StaffSetupStore } from './stores/staff-setup.store'

@Module({
  imports: [JwtModule.register({})],
  controllers: [StaffAuthController],
  providers: [
    StaffTokenService,
    StaffAuthService,
    StaffAuthGuard,
    StaffPermissionGuard,
    StaffLockoutStore,
    StaffSetupStore,
    {
      provide: LoginLockout,
      inject: [StaffLockoutStore, ConfigService],
      useFactory: (store: StaffLockoutStore, config: ConfigService) =>
        new LoginLockout(store, {
          maxAttempts: config.get<number>('STAFF_LOCKOUT_MAX_ATTEMPTS', 5),
          windowSeconds: config.get<number>('STAFF_LOCKOUT_WINDOW', 900),
          lockSeconds: config.get<number>('STAFF_LOCKOUT_DURATION', 900),
        }),
    },
  ],
  exports: [StaffTokenService, StaffAuthGuard, StaffPermissionGuard],
})
export class StaffAuthModule {}
