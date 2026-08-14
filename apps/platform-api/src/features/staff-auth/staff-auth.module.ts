import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { StaffAuthController } from './staff-auth.controller'
import { StaffAuthService } from './staff-auth.service'
import { StaffTokenService } from './staff-token.service'
import { StaffAuthGuard } from './guards/staff-auth.guard'
import { StaffPermissionGuard } from './guards/staff-permission.guard'

@Module({
  imports: [JwtModule.register({})],
  controllers: [StaffAuthController],
  providers: [
    StaffTokenService,
    StaffAuthService,
    StaffAuthGuard,
    StaffPermissionGuard,
  ],
  exports: [StaffTokenService, StaffAuthGuard, StaffPermissionGuard],
})
export class StaffAuthModule {}
