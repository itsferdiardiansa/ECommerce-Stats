import { useMutation } from '@tanstack/react-query'
import { authApi } from '../api/auth.api'

/** Thin, reusable mutation hooks over the auth API. Side effects (session
 * storage, navigation) live in the calling form components. */

export function useRegister() {
  return useMutation({ mutationFn: authApi.register })
}

export function useLogin() {
  return useMutation({ mutationFn: authApi.login })
}

export function useVerifyEmail() {
  return useMutation({ mutationFn: authApi.verifyEmail })
}

export function useResendVerification() {
  return useMutation({ mutationFn: authApi.resendVerification })
}

export function useForgotPassword() {
  return useMutation({ mutationFn: authApi.forgotPassword })
}

export function useResetPassword() {
  return useMutation({ mutationFn: authApi.resetPassword })
}

export function useLogout() {
  return useMutation({ mutationFn: authApi.logout })
}
