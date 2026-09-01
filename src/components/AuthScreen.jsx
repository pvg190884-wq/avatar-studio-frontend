import { useState } from 'react'
import { supabase } from '../supabaseClient'

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

  return (
    <div className="auth-shell">
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
        </div>

        <div className="footer-note">Avatar Studio — продукт BestConsulting.AI</div>
      </div>
    </div>
  )
}
