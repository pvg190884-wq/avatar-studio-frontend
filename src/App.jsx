import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { getBalance } from './api'
import AuthScreen from './components/AuthScreen'
import Header from './components/Header'
import CaseSelect from './components/CaseSelect'
import CaseOneForm from './components/CaseOneForm'
import CaseTwoForm from './components/CaseTwoForm'
import CaseThreeForm from './components/CaseThreeForm'
import TopUpModal from './components/TopUpModal'
import AboutPage from './components/AboutPage'
import './styles.css'

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = ещё загружается
  const [activeCase, setActiveCase] = useState(null)
  const [topUpOpen, setTopUpOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [balance, setBalance] = useState(null)
  const [loadingBalance, setLoadingBalance] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  // ЕДИНСТВЕННОЕ место во всём приложении, которое запрашивает баланс —
  // раньше это дублировалось ещё и внутри Header.jsx, и нестабильная
  // ссылка на объект session вызывала бесконечный повторный запрос
  // /api/billing/balance, забивая собой лимит одновременных соединений
  // браузера к бэкенду и вызывая "зависание" тяжёлых запросов генерации
  // в очереди (видно как "Connection Start: Stalled" в DevTools).
  const refreshBalance = useCallback(async (token) => {
    if (!token) return
    setLoadingBalance(true)
    try {
      const data = await getBalance(token)
      setBalance(data?.balance_usd ?? null)
    } catch (err) {
      console.error('Не удалось получить баланс:', err)
    } finally {
      setLoadingBalance(false)
    }
  }, [])

  const accessToken = session?.access_token
  useEffect(() => {
    if (!accessToken) return
    refreshBalance(accessToken)
  }, [accessToken, refreshBalance])

  if (session === undefined) {
    return <div className="app-shell" />
  }

  if (!session) {
    return <AuthScreen />
  }

  if (aboutOpen) {
    return <AboutPage onClose={() => setAboutOpen(false)} />
  }

  return (
    <div className="app-shell">
      <Header
        balance={balance}
        loadingBalance={loadingBalance}
        onRefreshBalance={() => refreshBalance(accessToken)}
        onOpenTopUp={() => setTopUpOpen(true)}
        onOpenAbout={() => setAboutOpen(true)}
      />

      {activeCase === null && <CaseSelect onSelect={setActiveCase} />}
      {activeCase === 1 && <CaseOneForm onBack={() => setActiveCase(null)} session={session} onGenerated={() => refreshBalance(accessToken)} />}
      {activeCase === 2 && <CaseTwoForm onBack={() => setActiveCase(null)} balance={balance} session={session} onGenerated={() => refreshBalance(accessToken)} />}
      {activeCase === 3 && <CaseThreeForm onBack={() => setActiveCase(null)} balance={balance} session={session} onGenerated={() => refreshBalance(accessToken)} />}

      {topUpOpen && (
        <TopUpModal
          session={session}
          onClose={() => setTopUpOpen(false)}
          onPaid={() => {
            refreshBalance(accessToken)
            setTopUpOpen(false)
          }}
        />
      )}

      <div className="footer-note">Avatar Studio — продукт BestConsulting.AI</div>
    </div>
  )
}
