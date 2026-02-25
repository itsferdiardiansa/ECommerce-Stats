import { Injectable, BadRequestException } from '@nestjs/common'
import {
  createUser,
  deleteUser,
  getUserById,
  listUsers,
  updateUser,
} from '@rufieltics/db/domains/identity/user'
import * as argon2 from 'argon2'
import type { CreateUserDto } from './dto/create-user.dto'
import type { UpdateUserDto } from './dto/update-user.dto'

@Injectable()
export class UsersService {
  async create(data: CreateUserDto) {
    try {
      const { password, ...rest } = data
      const passwordHash = await argon2.hash(password)
      return await createUser({
        ...rest,
        passwordHash,
      })
    } catch (err) {
      throw new BadRequestException((err as Error).message)
    }
  }

  async findOne(id: number) {
    return getUserById(id)
  }

  async update(id: number, data: UpdateUserDto) {
    if (data.passwordHash) {
      data.passwordHash = await argon2.hash(data.passwordHash)
    }
    return updateUser(id, data)
  }

  async remove(id: number) {
    return deleteUser(id)
  }

  async list(params?: any) {
    return listUsers(params)
  }
}
