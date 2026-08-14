import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common'
import { success } from '@rufieltics/api-core'

@Controller('health')
export class HealthController {
  @Get()
  @HttpCode(HttpStatus.OK)
  check() {
    return success('OK', {
      service: 'platform-api',
      time: new Date().toISOString(),
    })
  }
}
