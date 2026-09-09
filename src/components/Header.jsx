import { supabase } from '../supabaseClient'

export default function Header({ balance, loadingBalance, onRefreshBalance, onOpenTopUp, onOpenAbout }) {
  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <div className="top-header">
      <div className="brand-mini">
        <div className="eyebrow"><strong>BestConsulting</strong> · AI Studio</div>
        <div className="name">Avatar Studio</div>
      </div>

      <div className="account-box">
        <div className="balance-pill">
          {balance === null ? '—' : `$${Number(balance).toFixed(2)}`}
          <span
            className={`refresh ${loadingBalance ? 'spinning' : ''}`}
            onClick={onRefreshBalance}
            title="Обновить баланс"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M21 12a9 9 0 1 1-2.64-6.36M21 4v6h-6" />
            </svg>
          </span>
        </div>
        <button className="icon-btn" onClick={onOpenAbout}>О программе</button>
        <button className="icon-btn" onClick={onOpenTopUp}>Пополнить</button>
        <button className="icon-btn" onClick={handleLogout}>Выйти</button>
      </div>
    </div>
  )
}
