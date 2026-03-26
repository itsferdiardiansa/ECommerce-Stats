import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export interface CurrentUserPayload {
  id: number
  email: string
  isStaff: boolean
  isActive: boolean
}

interface RequestWithUser {
  user?: CurrentUserPayload
}

/**
 * CurrentUser decorator - Extracts the authenticated user from the request
 *
 * Must be used with ActiveUserGuard to ensure user is authenticated
 *
 * Usage:
 * @Get('profile')
 * @UseGuards(ActiveUserGuard)
 * getProfile(@CurrentUser() user: CurrentUserPayload) {
 *   return user
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>()
    const user = request.user

    return data ? user?.[data] : user
  }
)
