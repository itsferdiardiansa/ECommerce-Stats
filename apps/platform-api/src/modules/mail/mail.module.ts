import { Global, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MAIL_TRANSPORT, type MailTransport } from './mail-transport.interface'
import { LogMailTransport } from './transports/log.transport'
import { SmtpMailTransport } from './transports/smtp.transport'
import { MailService } from './mail.service'

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: MAIL_TRANSPORT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): MailTransport =>
        config.get<string>('SMTP_HOST')
          ? new SmtpMailTransport(config)
          : new LogMailTransport(),
    },
    MailService,
  ],
  exports: [MailService],
})
export class MailModule {}
