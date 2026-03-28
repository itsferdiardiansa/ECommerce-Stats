import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common'
import { I18nContext } from 'nestjs-i18n'
import * as argon2 from 'argon2'
import {
  deleteUser,
  getUserById,
  listUsers,
  updateUser,
} from '@rufieltics/db/domains/identity/user'
import type { UserFilterParams } from '@rufieltics/db/domains/identity/user'
import type { UpdateUserDto } from './dto/update-user.dto'
import type { AdminUpdateUserDto } from './dto/admin-update-user.dto'
import type { ListUserDto } from './dto/list-user.dto'

@Injectable()
export class UsersService {
  async findOne(id: number, i18n: I18nContext) {
    const user = await getUserById(id)

    if (!user) {
      throw new NotFoundException(i18n.t('users.errors.user_not_found'))
    }

    return user
  }

  async update(
    id: number,
    data: UpdateUserDto | AdminUpdateUserDto,
    i18n: I18nContext,
    requestingUserId: number,
    isAdmin = false
  ) {
    const existingUser = await getUserById(id)

    if (!existingUser) {
      throw new NotFoundException(i18n.t('users.errors.user_not_found'))
    }

    if (existingUser.deletedAt) {
      throw new BadRequestException(
        i18n.t('users.errors.cannot_update_deleted_user')
      )
    }

    if (!isAdmin && existingUser.id !== requestingUserId) {
      throw new ForbiddenException(i18n.t('common.errors.forbidden'))
    }

    const { password, ...rest } = data
    const payload: Record<string, unknown> = { ...rest }

    if (password) {
      payload.passwordHash = await argon2.hash(password)
      payload.passwordChangedAt = new Date()
    }

    try {
      return await updateUser(id, payload)
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('Record to update not found')
      ) {
        throw new NotFoundException(i18n.t('users.errors.user_not_found'))
      }
      throw error
    }
  }

  async remove(id: number, i18n: I18nContext) {
    try {
      return await deleteUser(id)
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') {
        throw new NotFoundException(i18n.t('users.errors.user_not_found'))
      }
      throw error
    }
  }

  async list(params: ListUserDto) {
    return listUsers(params as unknown as UserFilterParams)
  }
}
