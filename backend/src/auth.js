import 'dotenv/config'
import pg from 'pg'
import { betterAuth } from 'better-auth'
import { createAuthMiddleware, APIError } from 'better-auth/api'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // required for Supabase cloud connections
})

export const auth = betterAuth({
  database: pool,

  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  secret: process.env.BETTER_AUTH_SECRET,

  // Allow frontend origins as valid callbackURLs after OAuth
  trustedOrigins: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://localhost:5174',
  ],

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true, // Prevent user login until email verified by OTP
    sendResetPassword: async ({ user, url }) => {
      // TODO: add email provider (Resend / Nodemailer)
      console.log(`[Password Reset] ${user.email} → ${url}`)
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url, token }) => {
      // 1. Generate a 6-digit numeric OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString()

      // 2. Update the verification token in the database to be the OTP
      try {
        await pool.query(
          `UPDATE "verification" SET "value" = $1 WHERE "identifier" = $2 AND "value" = $3`,
          [otp, user.email, token]
        )

        // 3. Send the OTP code via email (or log it during development)
        console.log(`[Email Verification OTP] User: ${user.email} | OTP: ${otp}`)

        // In production, you would send this via Resend/Nodemailer:
        // await resend.emails.send({ ... })
      } catch (err) {
        console.error('Failed to update verification code to OTP:', err)
      }
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Always show account picker — allows choosing between multiple Google accounts
      prompt: 'select_account',
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      prompt: 'select_account',
    },
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === '/sign-up/email') {
        const { name, email, password } = ctx.body || {}

        // 1. Restrict name to alphabet strings and spaces only
        if (name) {
          const nameRegex = /^[a-zA-Z\s]+$/
          if (!nameRegex.test(name)) {
            throw new APIError('BAD_REQUEST', {
              message: 'Name must contain only letters and spaces',
            })
          }
        }

        // 2. Restrict Gmail domain to .com
        if (email) {
          const emailStr = email.toLowerCase()
          if (emailStr.includes('gmail.') && !emailStr.endsWith('@gmail.com')) {
            throw new APIError('BAD_REQUEST', {
              message: 'Gmail addresses must use the .com domain (e.g. @gmail.com)',
            })
          }
        }

        // 2. Enforce alphanumeric password > 8 characters
        if (password) {
          if (password.length <= 8) {
            throw new APIError('BAD_REQUEST', {
              message: 'Password must be more than 8 characters long',
            })
          }

          const hasLetter = /[a-zA-Z]/.test(password)
          const hasNumber = /[0-9]/.test(password)
          const isAlphanumeric = /^[a-zA-Z0-9]+$/.test(password)

          if (!hasLetter || !hasNumber || !isAlphanumeric) {
            throw new APIError('BAD_REQUEST', {
              message: 'Password must be alphanumeric (contain both letters and numbers, with no special characters)',
            })
          }
        }
      }
    }),
  },
})
