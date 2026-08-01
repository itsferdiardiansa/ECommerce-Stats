import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export interface CurrentUserPayload {
  id: number
  sub: number
  email: string
  isStaff: boolean
  isActive: boolean
  role: string | null
  orgId: string | null
  jti: string
}

interface RequestWithUser {
  user?: CurrentUserPayload
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>()
    const user = request.user

    return data ? user?.[data] : user
  }
)
