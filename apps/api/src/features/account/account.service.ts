import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common'
import { I18nContext } from 'nestjs-i18n'
import {
  getUserProfile,
  upsertUserProfile,
  getUserSettings,
  upsertUserSettings,
  listUserAddresses,
  getUserAddressById,
  createUserAddress,
  updateUserAddress,
  deleteUserAddress,
  setUserAddressAsDefault,
  type UserProfileWriteInput,
  type UserSettingsWriteInput,
} from '@rufieltics/db/domains/identity/user'
import { UpdateAccountSettingsDto } from './dto/update-settings.dto'
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto'

@Injectable()
export class AccountService {
  async getSettings(userId: number) {
    const [profile, settings] = await Promise.all([
      getUserProfile(userId),
      getUserSettings(userId),
    ])
    return {
      bio: profile.bio,
      birthDate: profile.birthDate,
      gender: profile.gender,
      languagePref: profile.languagePref,
      currencyPref: profile.currencyPref,
      marketingOptIn: profile.marketingOptIn,
      defaultTimezone: settings.defaultTimezone,
      weekStartsOn: settings.weekStartsOn,
      dateFormat: settings.dateFormat,
      alertsEmail: settings.alertsEmail,
      weeklyReport: settings.weeklyReport,
    }
  }

  async updateSettings(userId: number, dto: UpdateAccountSettingsDto) {
    const profileData: UserProfileWriteInput = {}
    if (dto.bio !== undefined) profileData.bio = dto.bio
    if (dto.birthDate !== undefined)
      profileData.birthDate = dto.birthDate ? new Date(dto.birthDate) : null
    if (dto.gender !== undefined) profileData.gender = dto.gender
    if (dto.languagePref !== undefined)
      profileData.languagePref = dto.languagePref
    if (dto.currencyPref !== undefined)
      profileData.currencyPref = dto.currencyPref
    if (dto.marketingOptIn !== undefined)
      profileData.marketingOptIn = dto.marketingOptIn

    const settingsData: UserSettingsWriteInput = {}
    if (dto.defaultTimezone !== undefined)
      settingsData.defaultTimezone = dto.defaultTimezone
    if (dto.weekStartsOn !== undefined)
      settingsData.weekStartsOn = dto.weekStartsOn
    if (dto.dateFormat !== undefined) settingsData.dateFormat = dto.dateFormat
    if (dto.alertsEmail !== undefined)
      settingsData.alertsEmail = dto.alertsEmail
    if (dto.weeklyReport !== undefined)
      settingsData.weeklyReport = dto.weeklyReport

    await Promise.all([
      Object.keys(profileData).length
        ? upsertUserProfile(userId, profileData)
        : Promise.resolve(),
      Object.keys(settingsData).length
        ? upsertUserSettings(userId, settingsData)
        : Promise.resolve(),
    ])

    return this.getSettings(userId)
  }

  async listAddresses(userId: number) {
    const result = await listUserAddresses({ userId, limit: 100 })
    return result.data
  }

  async createAddress(userId: number, dto: CreateAddressDto) {
    return createUserAddress({ ...dto, user: { connect: { id: userId } } })
  }

  async updateAddress(
    userId: number,
    id: number,
    dto: UpdateAddressDto,
    i18n: I18nContext
  ) {
    await this.ensureOwnership(userId, id, i18n)
    if (dto.isDefault === true) await setUserAddressAsDefault(id, userId)
    return updateUserAddress(id, dto)
  }

  async deleteAddress(userId: number, id: number, i18n: I18nContext) {
    await this.ensureOwnership(userId, id, i18n)
    await deleteUserAddress(id)
  }

  async setDefaultAddress(userId: number, id: number, i18n: I18nContext) {
    await this.ensureOwnership(userId, id, i18n)
    await setUserAddressAsDefault(id, userId)
    return this.listAddresses(userId)
  }

  private async ensureOwnership(userId: number, id: number, i18n: I18nContext) {
    const address = await getUserAddressById(id)
    if (!address) {
      throw new NotFoundException(i18n.t('account.address.not_found'))
    }
    if (address.userId !== userId) {
      throw new ForbiddenException(i18n.t('common.errors.forbidden'))
    }
    return address
  }
}
