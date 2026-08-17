import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const InviteStaffSchema = z.object({
  email: z.email(),
  name: z.string().min(2),
  roleKeys: z.array(z.string()).optional(),
})

export const AssignRoleSchema = z.object({
  roleKey: z.string().min(1),
})

export const ListStaffQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(['ALL', 'INVITED', 'ACTIVE', 'SUSPENDED']).default('ALL'),
  role: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
})

export const ListAuditQuerySchema = z.object({
  search: z.string().trim().optional(),
  action: z.string().trim().optional(),
  targetType: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export const ListInvitationsQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z
    .enum(['ALL', 'PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'])
    .default('ALL')
    .transform(v => (v === 'ALL' ? undefined : v)),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
})

const roleKeyPattern = /^[a-z][a-z0-9_]*$/

export const CreateRoleSchema = z.object({
  key: z
    .string()
    .min(2)
    .max(40)
    .regex(roleKeyPattern, 'Use lowercase letters, numbers and underscores'),
  name: z.string().min(2).max(60),
  description: z.string().max(200).optional(),
  permissionKeys: z.array(z.string()).default([]),
})

export const UpdateRoleSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  description: z.string().max(200).optional(),
  permissionKeys: z.array(z.string()).optional(),
})

export class InviteStaffDto extends createZodDto(InviteStaffSchema) {}
export class AssignRoleDto extends createZodDto(AssignRoleSchema) {}
export class ListStaffQueryDto extends createZodDto(ListStaffQuerySchema) {}
export class ListAuditQueryDto extends createZodDto(ListAuditQuerySchema) {}
export class ListInvitationsQueryDto extends createZodDto(
  ListInvitationsQuerySchema
) {}
export class CreateRoleDto extends createZodDto(CreateRoleSchema) {}
export class UpdateRoleDto extends createZodDto(UpdateRoleSchema) {}
