import { SetMetadata } from '@nestjs/common'

export const REQUIRE_SUDO_KEY = 'requireSudo'

/** Marks a route as needing recent re-authentication (see SudoGuard). */
export const RequireSudo = () => SetMetadata(REQUIRE_SUDO_KEY, true)
