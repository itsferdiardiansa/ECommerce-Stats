import { z } from 'zod'

export const preferencesSchema = z.object({
  languagePref: z.enum(['en', 'id']),
  currencyPref: z.enum(['USD', 'EUR', 'GBP', 'IDR', 'SGD']),
  defaultTimezone: z.string().min(1, 'Please choose a time zone.'),
  dateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']),
  weekStartsOn: z.enum(['Sunday', 'Monday']),
})

export type PreferencesValues = z.infer<typeof preferencesSchema>
