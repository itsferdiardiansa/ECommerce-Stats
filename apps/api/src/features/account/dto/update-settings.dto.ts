import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const UpdateAccountSettingsSchema = z.object({
  bio: z
    .string()
    .max(500, { message: 'common.validation.maxLength' })
    .nullish(),
  birthDate: z.string().nullish(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).nullish(),
  languagePref: z.enum(['en', 'id']).optional(),
  currencyPref: z.enum(['USD', 'EUR', 'GBP', 'IDR', 'SGD']).optional(),
  defaultTimezone: z.string().max(64).optional(),
  weekStartsOn: z.enum(['Sunday', 'Monday']).optional(),
  dateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']).optional(),
  alertsEmail: z.boolean().optional(),
  weeklyReport: z.boolean().optional(),
  marketingOptIn: z.boolean().optional(),
})

export class UpdateAccountSettingsDto extends createZodDto(
  UpdateAccountSettingsSchema
) {}
