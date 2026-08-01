import { Injectable } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { MAIL_QUEUE, MailPriority } from './mail.constants'
import type { MailMessage } from './mail-transport.interface'

/**
 * Enqueues outbound email so the request path never blocks on a third-party
 * provider. A single worker delivers at a paced rate (retries + backpressure +
 * provider rate-limit protection). Interactive codes use HIGH priority so they
 * still arrive promptly.
 */
@Injectable()
export class MailQueueService {
  constructor(
    @InjectQueue(MAIL_QUEUE) private readonly queue: Queue<MailMessage>
  ) {}

  async enqueue(
    message: MailMessage,
    opts?: { priority?: number }
  ): Promise<void> {
    await this.queue.add('send', message, {
      priority: opts?.priority ?? MailPriority.NORMAL,
      attempts: 5,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
      removeOnFail: 500,
    })
  }
}
