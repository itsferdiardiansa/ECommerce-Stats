import { Global, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { BullModule } from '@nestjs/bullmq'
import { MAIL_TRANSPORT, MailTransport } from './mail-transport.interface'
import { LogMailTransport } from './transports/log.transport'
import { SmtpMailTransport } from './transports/smtp.transport'
import { MailService } from './mail.service'
import { MailQueueService } from './mail-queue.service'
import { MailProcessor } from './mail.processor'
import { MAIL_QUEUE } from './mail.constants'

/**
 * Chooses the mail transport from config (SMTP when SMTP_HOST is set, otherwise
 * a log-only transport) and provides the outbound mail delivery queue. All
 * email is enqueued via MailQueueService and delivered by MailProcessor off the
 * request path.
 */
@Global()
@Module({
  imports: [ConfigModule, BullModule.registerQueue({ name: MAIL_QUEUE })],
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
    MailQueueService,
    MailProcessor,
  ],
  exports: [MailService, MailQueueService, MAIL_TRANSPORT],
})
export class MailModule {}
