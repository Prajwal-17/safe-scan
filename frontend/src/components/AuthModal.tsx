import { useState } from 'react'
import { signIn, signUp, forgetPassword, verifyEmail, sendVerificationEmail } from '../lib/auth-client'

type Tab = 'login' | 'register' | 'forgot' | 'verify'

interface Props {
  defaultTab?: 'login' | 'register'
  onClose: () => void
}

export default function AuthModal({ defaultTab = 'login', onClose }: Props) {
  const [tab, setTab] = useState<Tab>(defaultTab)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<'google' | 'github' | null>(null)

  function switchTab(t: Tab) {
    setTab(t)
    setError('')
    setSuccess('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Client-side validations for register
    if (tab === 'register') {
      // Name validation (only letters and spaces)
      const nameRegex = /^[a-zA-Z\s]+$/
      if (!nameRegex.test(name)) {
        setError('Name must contain only letters and spaces')
        return
      }

      const emailStr = email.toLowerCase()
      // Gmail check
      if (emailStr.includes('gmail.') && !emailStr.endsWith('@gmail.com')) {
        setError('Gmail addresses must end with @gmail.com')
        return
      }

      // Password length check
      if (password.length <= 8) {
        setError('Password must be more than 8 characters long')
        return
      }

      // Password alphanumeric check
      const hasLetter = /[a-zA-Z]/.test(password)
      const hasNumber = /[0-9]/.test(password)
      const isAlphanumeric = /^[a-zA-Z0-9]+$/.test(password)

      if (!hasLetter || !hasNumber || !isAlphanumeric) {
        setError('Password must contain both letters and numbers, with no special characters')
        return
      }

      // Confirm password check
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }
    }

    setLoading(true)
    try {
      if (tab === 'login') {
        const res = await signIn.email({ email, password })
        if (res.error) throw new Error(res.error.message ?? 'Login failed')
        onClose()
      } else if (tab === 'register') {
        const res = await signUp.email({ name, email, password })
        if (res.error) throw new Error(res.error.message ?? 'Sign up failed')
        setSuccess('Account created! Please enter the 6-digit OTP code sent to your email.')
        switchTab('verify')
      } else if (tab === 'forgot') {
        const res = await forgetPassword({
          email,
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (res.error) throw new Error(res.error.message ?? 'Could not send reset email')
        setSuccess('Check your email for a reset link.')
      } else if (tab === 'verify') {
        const res = await verifyEmail({
          query: {
            token: otp,
          },
        })
        if (res.error) throw new Error(res.error.message ?? 'OTP verification failed')
        setSuccess('Email verified successfully! You can now log in.')
        switchTab('login')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleResendOtp() {
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const res = await sendVerificationEmail({
        email,
        callbackURL: window.location.origin,
      })
      if (res.error) throw new Error(res.error.message ?? 'Failed to resend code')
      setSuccess('Verification OTP resent successfully!')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleSocial(provider: 'google' | 'github') {
    if (socialLoading) return
    setSocialLoading(provider)
    setError('')
    try {
      await signIn.social({
        provider,
        callbackURL: window.location.origin,
      })
    } catch {
      setError(`Could not sign in with ${provider}. Try again.`)
      setSocialLoading(null)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>

        {/* Close */}
        <button id="modal-close-btn" className="modal-close" onClick={onClose} aria-label="Close">×</button>

        {/* Tabs (only for login / register) */}
        {tab !== 'forgot' && tab !== 'verify' && (
          <div className="modal-tabs">
            <button className={`tab-btn ${tab === 'login' ? 'active' : ''}`} onClick={() => switchTab('login')}>
              Log in
            </button>
            <button className={`tab-btn ${tab === 'register' ? 'active' : ''}`} onClick={() => switchTab('register')}>
              Sign up
            </button>
          </div>
        )}

        {/* Forgot password heading */}
        {tab === 'forgot' && (
          <div className="forgot-header">
            <button className="back-btn" onClick={() => switchTab('login')}>← Back to log in</button>
            <p className="forgot-title">Reset password</p>
            <p className="forgot-sub">Enter your email and we'll send a reset link.</p>
          </div>
        )}

        {/* OTP verification heading */}
        {tab === 'verify' && (
          <div className="forgot-header">
            <button className="back-btn" onClick={() => switchTab('register')}>← Back to register</button>
            <p className="forgot-title">Verify Email</p>
            <p className="forgot-sub">Enter the 6-digit OTP sent to <strong>{email}</strong>.</p>
          </div>
        )}

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit}>

          {/* Name — register only */}
          {tab === 'register' && (
            <div className="field">
              <label htmlFor="auth-name">Name</label>
              <input
                id="auth-name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoFocus
                pattern="[A-Za-z\s]+"
                title="Name must contain only letters and spaces"
              />
            </div>
          )}

          {/* Email — login, register, forgot */}
          {tab !== 'verify' && (
            <div className="field">
              <label htmlFor="auth-email">Email</label>
              <input
                id="auth-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus={tab === 'login' || tab === 'forgot'}
              />
            </div>
          )}

          {/* Password — login, register */}
          {tab !== 'forgot' && tab !== 'verify' && (
            <div className="field">
              <div className="field-row">
                <label htmlFor="auth-password">Password</label>
                {tab === 'login' && (
                  <button type="button" className="forgot-link" onClick={() => switchTab('forgot')}>
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                id="auth-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
          )}

          {/* Confirm Password — register only */}
          {tab === 'register' && (
            <div className="field">
              <label htmlFor="auth-confirm">Confirm password</label>
              <input
                id="auth-confirm"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
          )}

          {/* OTP Code — verify only */}
          {tab === 'verify' && (
            <div className="field">
              <label htmlFor="auth-otp">Verification OTP</label>
              <input
                id="auth-otp"
                type="text"
                maxLength={6}
                pattern="[0-9]{6}"
                placeholder="123456"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                required
                autoFocus
              />
            </div>
          )}

          {error && <p className="auth-error">{error}</p>}
          {success && <p className="auth-success">{success}</p>}

          <button id="auth-submit-btn" className="btn-primary" type="submit" disabled={loading}>
            {loading
              ? 'Please wait…'
              : tab === 'login'
                ? 'Log in'
                : tab === 'register'
                  ? 'Create account'
                  : tab === 'forgot'
                    ? 'Send reset link'
                    : 'Verify OTP'}
          </button>

          {/* Resend OTP — verify only */}
          {tab === 'verify' && (
            <button
              type="button"
              className="forgot-link"
              style={{ alignSelf: 'center', marginTop: '8px' }}
              onClick={handleResendOtp}
              disabled={loading}
            >
              Didn't receive code? Resend OTP
            </button>
          )}
        </form>

        {/* Social — only for login / register */}
        {tab !== 'forgot' && tab !== 'verify' && (
          <>
            <div className="auth-divider"><span>or</span></div>
            <div className="social-btns">
              <button
                id="google-signin-btn"
                className="btn-social"
                type="button"
                disabled={socialLoading !== null}
                onClick={() => handleSocial('google')}
              >
                {socialLoading === 'google' ? (
                  <span className="spin" />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                Continue with Google
              </button>
              <button
                id="github-signin-btn"
                className="btn-social"
                type="button"
                disabled={socialLoading !== null}
                onClick={() => handleSocial('github')}
              >
                {socialLoading === 'github' ? (
                  <span className="spin" />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                )}
                Continue with GitHub
              </button>
            </div>
          </>
        )}
      </div>
      </div>
  )
}
