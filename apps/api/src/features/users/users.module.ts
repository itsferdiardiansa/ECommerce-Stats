import { Module } from '@nestjs/common'
import { UsersService } from './users.service'
import { UsersController } from './users.controller'
import { UsersAdminController } from './users-admin.controller'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [AuthModule],
  controllers: [UsersController, UsersAdminController],
  providers: [UsersService],
})
export class UsersModule {}
