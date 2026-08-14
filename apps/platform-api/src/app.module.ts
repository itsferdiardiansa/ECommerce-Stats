import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { I18nModule } from './modules/i18n/i18n.module'
import { MailModule } from './modules/mail/mail.module'
import { HealthModule } from './features/health/health.module'
import { StaffAuthModule } from './features/staff-auth/staff-auth.module'
import { StaffModule } from './features/staff/staff.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60 * 1000, limit: 100 }]),
    I18nModule,
    MailModule,
    HealthModule,
    StaffAuthModule,
    StaffModule,
  ],
})
export class AppModule {}
