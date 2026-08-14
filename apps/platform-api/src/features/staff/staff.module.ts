import { Module } from '@nestjs/common'
import { StaffController } from './staff.controller'
import { StaffService } from './staff.service'
import { StaffAuthModule } from '../staff-auth/staff-auth.module'

@Module({
  imports: [StaffAuthModule],
  controllers: [StaffController],
  providers: [StaffService],
})
export class StaffModule {}
