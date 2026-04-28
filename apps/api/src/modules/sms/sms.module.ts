import { Module } from '@nestjs/common'
import { SmsProvider } from './sms.provider'
import { ConsoleSmsProvider } from './console-sms.provider'

@Module({
  providers: [
    {
      provide: SmsProvider,
      useClass: ConsoleSmsProvider,
    },
  ],
  exports: [SmsProvider],
})
export class SmsModule {}
