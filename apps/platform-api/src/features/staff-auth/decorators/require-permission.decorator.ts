import { SetMetadata } from '@nestjs/common'

export const PERMISSION_METADATA = 'staff_required_permission'

export const RequirePermission = (key: string) =>
  SetMetadata(PERMISSION_METADATA, key)
