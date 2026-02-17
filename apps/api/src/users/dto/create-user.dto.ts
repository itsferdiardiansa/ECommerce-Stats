import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z
    .string({
      error: 'Email is required and must be a string',
    })
    .email({ message: 'Invalid email address' }),
  username: z
    .string({
      error: 'Username is required and must be a string',
    })
    .min(1, { message: 'Username is required' })
    .min(3, { message: 'Username must be at least 3 characters long' }),
  password: z
    .string({
      error: 'Password is required and must be a string',
    })
    .min(1, { message: 'Password is required' })
    .min(8, { message: 'Password must be at least 8 characters long' })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/, {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    }),
  name: z
    .string({
      error: 'Name is required and must be a string',
    })
    .min(3, { message: 'Name must be at least 3 characters long' }),
  avatar: z.string().optional().nullable(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone number' })
    .optional()
    .nullable(),
  isActive: z.boolean().default(false).optional(),
  isStaff: z.boolean().default(false).optional(),
  isTwoFactorEnabled: z.boolean().default(false).optional(),
});

export class CreateUserDto extends createZodDto(CreateUserSchema) {}
