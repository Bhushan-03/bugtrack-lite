import { Bug, ChartNoAxesCombined, Rocket, CheckCircle2,} from 'lucide-react'

import { useState } from 'react'
import API_BASE_URL from '../api';

export default function AuthScreen({ onAuthSuccess }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isRegister = mode === 'register'

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/${mode === 'login' ? 'login' : 'register'}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...(isRegister ? { name } : {}),
            email,
            password,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed.')
      }

      onAuthSuccess(data)
    } catch (err) {
      setError(
        err.message === 'Failed to fetch'
          ? 'Cannot connect to the server. Make sure your backend is running on port 5000.'
          : err.message
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <div className="brand">
          <span className="brand-mark">B</span>
          <span>BugTrack<span className="brand-accent"> Lite</span></span>
        </div>

        <div className="visual-content">
          <span className="eyebrow">BUILT FOR BETTER WORKFLOWS</span>
          <h1>Find the issue.<br />Fix what matters.</h1>
          <p>
            Keep your team's bugs organized, track progress,
            and turn problems into solutions.
          </p>

          <div className="visual-stats">
            <div><strong>01</strong><span>Report issues</span></div>
            <div><strong>02</strong><span>Track progress</span></div>
            <div><strong>03</strong><span>Ship confidently</span></div>
          </div>
        </div>

        <p className="visual-footer">A simpler way to manage software issues.</p>
      </section>

      <section className="auth-panel">
        <div className="auth-form-wrap">
          <div className="mobile-brand">
            <span className="brand-mark">B</span>
            <strong>BugTrack Lite</strong>
          </div>

          <span className="eyebrow">
            {isRegister ? 'GET STARTED' : 'WELCOME BACK'}
          </span>

          <h2>{isRegister ? 'Create your account' : 'Sign in to your workspace'}</h2>
          <p className="auth-subtitle">
            {isRegister
              ? 'Create an account to start tracking bugs.'
              : 'Enter your details to access your bug dashboard.'}
          </p>

          <div className="auth-tabs">
            <button
              type="button"
              className={!isRegister ? 'auth-tab active' : 'auth-tab'}
              onClick={() => {
                setMode('login')
                setError('')
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              className={isRegister ? 'auth-tab active' : 'auth-tab'}
              onClick={() => {
                setMode('register')
                setError('')
              }}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {isRegister && (
              <label>
                Full name
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  minLength={2}
                  maxLength={60}
                  required
                />
              </label>
            )}

            <label>
              Email address
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                required
              />
            </label>

            {error && <div className="auth-error" role="alert">{error}</div>}

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading
                ? 'Please wait...'
                : isRegister
                  ? 'Create account →'
                  : 'Sign in →'}
            </button>
          </form>

          <p className="auth-terms">
            Secure access to your bug tracking workspace.
          </p>
        </div>
      </section>
    </main>
  )
}
