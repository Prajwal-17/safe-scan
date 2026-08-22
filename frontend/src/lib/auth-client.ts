import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: 'http://localhost:5173',
})

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  verifyEmail,
  sendVerificationEmail,
} = authClient

// forgetPassword may not be on the base client type but is available at runtime
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const forgetPassword = (authClient as any).forgetPassword as (
  opts: { email: string; redirectTo: string }
) => Promise<{ error?: { message?: string } }>
