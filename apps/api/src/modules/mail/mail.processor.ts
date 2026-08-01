import { Logger } from '@nestjs/common'
import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Job } from 'bullmq'
import { MAIL_QUEUE } from './mail.constants'
import { MailService } from './mail.service'
import type { MailMessage } from './mail-transport.interface'

/**
 * The single choke point for outbound email: every message is delivered here,
 * off the request path. Concurrency + rate limiter protect the provider (tune
 * `limiter` to your ESP's limit — e.g. Resend/SES per-second caps). A thrown
 * send re-queues with exponential backoff.
 */
@Processor(MAIL_QUEUE, {
  concurrency: 10,
  limiter: { max: 50, duration: 1000 },
})
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name)

  constructor(private readonly mail: MailService) {
    super()
  }

  async process(job: Job<MailMessage>): Promise<void> {
    await this.mail.send(job.data)
  }
}
