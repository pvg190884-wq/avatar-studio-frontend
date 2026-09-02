import { useState } from 'react'
import { supabase } from '../supabaseClient'
import StarField from './StarField'

export default function AuthScreen() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setInfo('Готово! Если в проекте включено подтверждение почты — проверь ящик и перейди по ссылке, потом просто войди.')
      }
    } catch (err) {
      setError(err.message || 'Что-то пошло не так')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setError(null)
    setInfo(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) setError(error.message)
    // при успехе браузер сам уходит на страницу Google — сюда управление не вернётся
  }

  return (
    <div className="auth-shell">
      <div className="bg-scene hero" aria-hidden="true">
        <div className="bg-photo" />
        <StarField />
        <div className="bg-vignette" />
      </div>
      <div className="auth-card">
        <div className="brand-mini" style={{ marginBottom: 28, alignItems: 'center', textAlign: 'center' }}>
          <div className="eyebrow"><strong>BestConsulting</strong> · AI Studio</div>
          <div className="name" style={{ fontSize: 26 }}>Avatar Studio</div>
        </div>

        <div className="panel">
          <div className="auth-tabs">
            <div
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setError(null); setInfo(null) }}
            >
              Вход
            </div>
            <div
              className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => { setMode('signup'); setError(null); setInfo(null) }}
            >
              Регистрация
            </div>
          </div>

          {error && <div className="error-box">{error}</div>}
          {info && <div className="cost-banner">{info}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="field">
              <label>Пароль</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
              {loading ? 'Подождите…' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
            </button>
          </form>

          <div className="divider-row">
            <span />
            <span className="divider-label">или</span>
            <span />
          </div>

          <button className="btn btn-ghost btn-block" type="button" onClick={handleGoogleLogin}>
            <svg width="17" height="17" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.7 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6 29.5 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.4 0 10.3-1.8 14-5l-6.5-5.4C29.4 35.4 26.8 36 24 36c-5.2 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4 5.7l6.5 5.4C40.9 36.4 44 30.8 44 24c0-1.3-.1-2.7-.4-3.5z"/>
            </svg>
            Продолжить с Google
          </button>
        </div>

        <div className="footer-note">Avatar Studio — продукт BestConsulting.AI</div>
      </div>
    </div>
  )
}
