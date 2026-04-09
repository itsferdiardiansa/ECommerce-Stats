import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
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
import { ListLoginLockoutsDto } from './dto/list-login-lockouts.dto'
import { CreateLoginLockoutDto } from './dto/create-login-lockout.dto'
import {
  LockoutListResponseDto,
  LockoutResponseDto,
} from './dto/lockout-response.dto'
import { Verification, LoginLockouts } from '@rufieltics/db/domains/auth'
import { RedisService } from '@/modules/redis/redis.service'
import { VerificationService } from './verification.service'

@Controller('admin')
@UseGuards(ActiveUserGuard, AdminGuard)
export class AuthAdminController {
  constructor(
    private readonly redisService: RedisService,
    private readonly verificationService: VerificationService
  ) {}

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

  @Post('login-lockouts')
  @HttpCode(HttpStatus.CREATED)
  async createLoginLockout(
    @Body() dto: CreateLoginLockoutDto,
    @CurrentUser() user: CurrentUserPayload,
    @I18n() i18n: I18nContext
  ) {
    await this.verificationService.setLoginLockout(
      dto.email,
      undefined,
      undefined,
      'MANUAL_LOCK',
      dto.ttlSeconds
    )

    return success(i18n.t('admin.login_lockouts.created_success'), {
      email: dto.email,
      reason: 'MANUAL_LOCK',
      createdBy: user.id,
    })
  }

  @Get('login-lockouts')
  @HttpCode(HttpStatus.OK)
  async listLoginLockouts(
    @Query() dto: ListLoginLockoutsDto,
    @I18n() i18n: I18nContext
  ) {
    const result = await LoginLockouts.list(dto)

    const now = new Date()
    const data: LockoutResponseDto[] = result.data.map(lockout => ({
      id: lockout.id,
      email: lockout.email,
      reason: lockout.reason,
      ipAddress: lockout.ipAddress,
      userAgent: lockout.userAgent,
      lockedAt: lockout.lockedAt.toISOString(),
      expires: lockout.expires.toISOString(),
      remainingSeconds:
        lockout.clearedAt === null && lockout.expires > now
          ? Math.ceil((lockout.expires.getTime() - now.getTime()) / 1000)
          : null,
      clearedAt: lockout.clearedAt?.toISOString() ?? null,
      clearedBy: lockout.clearedBy,
    }))

    const response: LockoutListResponseDto = { data, meta: result.meta }

    return success(i18n.t('admin.login_lockouts.list_success'), response)
  }

  @Get('login-lockouts/:id')
  @HttpCode(HttpStatus.OK)
  async getLoginLockoutById(
    @Param('id', ParseIntPipe) id: number,
    @I18n() i18n: I18nContext
  ) {
    const lockout = await LoginLockouts.findById(id)

    if (!lockout) {
      throw new NotFoundException(i18n.t('admin.login_lockouts.not_found'))
    }

    const now = new Date()
    return success(i18n.t('admin.login_lockouts.get_success'), {
      id: lockout.id,
      email: lockout.email,
      reason: lockout.reason,
      ipAddress: lockout.ipAddress,
      userAgent: lockout.userAgent,
      lockedAt: lockout.lockedAt.toISOString(),
      expires: lockout.expires.toISOString(),
      remainingSeconds:
        lockout.clearedAt === null && lockout.expires > now
          ? Math.ceil((lockout.expires.getTime() - now.getTime()) / 1000)
          : null,
      clearedAt: lockout.clearedAt?.toISOString() || null,
      clearedBy: lockout.clearedBy,
    })
  }

  @Delete('login-lockouts/:id')
  @HttpCode(HttpStatus.OK)
  async clearLoginLockout(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserPayload,
    @I18n() i18n: I18nContext
  ) {
    const lockout = await LoginLockouts.findById(id)

    if (!lockout) {
      throw new NotFoundException(i18n.t('admin.login_lockouts.not_found'))
    }

    if (lockout.clearedAt) {
      throw new NotFoundException(
        i18n.t('admin.login_lockouts.already_cleared')
      )
    }

    await LoginLockouts.clearAllForEmail(lockout.email, user.id)

    const redisKey = `login:lockout:${lockout.email.toLowerCase()}`
    await this.redisService.del(redisKey)

    return success(i18n.t('admin.login_lockouts.cleared_success'), {
      id,
      email: lockout.email,
      clearedBy: user.id,
      clearedAt: new Date().toISOString(),
    })
  }
}
