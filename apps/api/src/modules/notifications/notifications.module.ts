import { Global, Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { MailModule } from '@/modules/mail/mail.module'
import { NOTIFICATIONS_QUEUE } from './notification.types'
import { NotificationService } from './notification.service'
import { NotificationProcessor } from './notification.processor'

/**
 * Security notification pipeline: dedupe + enqueue (NotificationService) and a
 * BullMQ worker (NotificationProcessor) that delivers via the mail transport.
 * The BullMQ root connection is configured in AppModule.
 */
@Global()
@Module({
  imports: [
    BullModule.registerQueue({ name: NOTIFICATIONS_QUEUE }),
    MailModule,
  ],
  providers: [NotificationService, NotificationProcessor],
  exports: [NotificationService],
})
export class NotificationsModule {}
