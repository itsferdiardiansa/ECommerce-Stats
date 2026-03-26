import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
  ParseIntPipe,
} from '@nestjs/common'
import { I18n, I18nContext } from 'nestjs-i18n'
import { ActiveUserGuard } from '@/common/guards/active-user.guard'
import { AdminGuard } from '@/common/guards/admin.guard'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
import type { CurrentUserPayload } from '@/common/decorators/current-user.decorator'
import { success } from '@/common/helpers/api-response.helper'
import { ListLocksoutsDto } from './dto/list-lockouts.dto'
import {
  LockoutListResponseDto,
  LockoutResponseDto,
} from './dto/lockout-response.dto'
import { Verification } from '@rufieltics/db/domains/auth'
import { RedisService } from '@/modules/redis/redis.service'

@Controller('admin')
@UseGuards(ActiveUserGuard, AdminGuard)
export class AuthAdminController {
  constructor(private readonly redisService: RedisService) {}

  @Get('lockouts')
  @HttpCode(HttpStatus.OK)
  async listLockouts(
    @Query() dto: ListLocksoutsDto,
    @I18n() i18n: I18nContext
  ) {
    const result = await Verification.listVerificationLockouts({
      page: dto.page,
      limit: dto.limit,
      status: dto.status,
      email: dto.email,
      reason: dto.reason,
      startDate: dto.startDate,
      endDate: dto.endDate,
      sortBy: dto.sortBy,
      sortOrder: dto.sortOrder,
    })

    const transformedData: LockoutResponseDto[] = result.data.map(lockout => {
      const now = new Date()
      const remainingMs = lockout.expires.getTime() - now.getTime()
      const remainingSeconds =
        lockout.clearedAt === null && remainingMs > 0
          ? Math.ceil(remainingMs / 1000)
          : null

      return {
        id: lockout.id,
        email: lockout.email,
        reason: lockout.reason,
        ipAddress: lockout.ipAddress,
        userAgent: lockout.userAgent,
        lockedAt: lockout.lockedAt.toISOString(),
        expires: lockout.expires.toISOString(),
        remainingSeconds,
        clearedAt: lockout.clearedAt?.toISOString() || null,
        clearedBy: lockout.clearedBy,
      }
    })

    const response: LockoutListResponseDto = {
      data: transformedData,
      meta: result.meta,
    }

    return success(i18n.t('admin.lockouts.list_success'), response)
  }

  @Get('lockouts/:id')
  @HttpCode(HttpStatus.OK)
  async getLockoutById(
    @Param('id', ParseIntPipe) id: number,
    @I18n() i18n: I18nContext
  ) {
    const lockout = await Verification.findVerificationLockoutById(id)

    if (!lockout) {
      throw new NotFoundException(i18n.t('admin.lockouts.not_found'))
    }

    const now = new Date()
    const remainingMs = lockout.expires.getTime() - now.getTime()
    const remainingSeconds =
      lockout.clearedAt === null && remainingMs > 0
        ? Math.ceil(remainingMs / 1000)
        : null

    const response: LockoutResponseDto = {
      id: lockout.id,
      email: lockout.email,
      reason: lockout.reason,
      ipAddress: lockout.ipAddress,
      userAgent: lockout.userAgent,
      lockedAt: lockout.lockedAt.toISOString(),
      expires: lockout.expires.toISOString(),
      remainingSeconds,
      clearedAt: lockout.clearedAt?.toISOString() || null,
      clearedBy: lockout.clearedBy,
    }

    return success(i18n.t('admin.lockouts.get_success'), response)
  }

  @Delete('lockouts/:id')
  @HttpCode(HttpStatus.OK)
  async clearLockout(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserPayload,
    @I18n() i18n: I18nContext
  ) {
    const lockout = await Verification.findVerificationLockoutById(id)

    if (!lockout) {
      throw new NotFoundException(i18n.t('admin.lockouts.not_found'))
    }

    if (lockout.clearedAt) {
      throw new NotFoundException(i18n.t('admin.lockouts.already_cleared'))
    }

    await Verification.clearAllActiveLocksForEmail(lockout.email, user.id)

    const redisKey = `verification:lockout:${lockout.email.toLowerCase()}`
    await this.redisService.del(redisKey)

    return success(i18n.t('admin.lockouts.cleared_success'), {
      id,
      email: lockout.email,
      clearedBy: user.id,
      clearedAt: new Date().toISOString(),
    })
  }
}
