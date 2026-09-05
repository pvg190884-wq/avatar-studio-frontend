import { useEffect, useState } from 'react'
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
  const [balanceTick, setBalanceTick] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.access_token) return
    getBalance(session.access_token)
      .then((data) => setBalance(data?.balance_usd ?? null))
      .catch(() => setBalance(null))
  }, [session, balanceTick])

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
      <Header session={session} onOpenTopUp={() => setTopUpOpen(true)} onOpenAbout={() => setAboutOpen(true)} />

      {activeCase === null && <CaseSelect onSelect={setActiveCase} />}
      {activeCase === 1 && <CaseOneForm onBack={() => setActiveCase(null)} session={session} onGenerated={() => setBalanceTick((t) => t + 1)} />}
      {activeCase === 2 && <CaseTwoForm onBack={() => setActiveCase(null)} balance={balance} session={session} onGenerated={() => setBalanceTick((t) => t + 1)} />}
      {activeCase === 3 && <CaseThreeForm onBack={() => setActiveCase(null)} balance={balance} session={session} onGenerated={() => setBalanceTick((t) => t + 1)} />}

      {topUpOpen && (
        <TopUpModal
          session={session}
          onClose={() => setTopUpOpen(false)}
          onPaid={() => {
            setBalanceTick((t) => t + 1)
            setTopUpOpen(false)
          }}
        />
      )}

      <div className="footer-note">Avatar Studio — продукт BestConsulting.AI</div>
    </div>
  )
}
