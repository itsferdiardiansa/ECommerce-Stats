import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  BadRequestException,
} from '@nestjs/common'
import { I18n, I18nContext } from 'nestjs-i18n'
import { UsersService } from './users.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() dto: CreateUserDto, @I18n() i18n: I18nContext) {
    console.log('Creating user with data:', dto)
    const user = await this.usersService.create(dto)
    return {
      message: i18n.t('users.create.success'),
      data: user,
    }
  }

  @Get()
  async list(@Query() query: any, @I18n() i18n: I18nContext) {
    const users = await this.usersService.list(query)
    return {
      message: i18n.t('common.success.generic'),
      data: users,
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @I18n() i18n: I18nContext) {
    const user = await this.usersService.findOne(Number(id))
    if (!user) {
      throw new BadRequestException(i18n.t('common.errors.notFound'))
    }
    return {
      message: i18n.t('common.success.generic'),
      data: user,
    }
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @I18n() i18n: I18nContext
  ) {
    const user = await this.usersService.update(Number(id), dto)
    return {
      message: i18n.t('users.update.success'),
      data: user,
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @I18n() i18n: I18nContext) {
    await this.usersService.remove(Number(id))
    return {
      message: i18n.t('users.delete.success'),
    }
  }
}
