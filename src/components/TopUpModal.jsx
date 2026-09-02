import { useEffect, useRef, useState } from 'react'
import { createDeposit, checkDeposit, sbpRequest } from '../api'

const CRYPTO_METHODS = [
  { id: 'USDT', label: 'USDT' },
  { id: 'TON', label: 'TON' },
  { id: 'BTC', label: 'BTC' },
]

export default function TopUpModal({ session, onClose, onPaid }) {
  const [tab, setTab] = useState('crypto') // 'crypto' | 'sbp'
  const [amount, setAmount] = useState('10')
  const [method, setMethod] = useState('USDT')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [invoice, setInvoice] = useState(null) // { invoice_id, pay_url, ... }
  const [sbpInfo, setSbpInfo] = useState(null)
  const pollRef = useRef(null)

  useEffect(() => {
    return () => clearInterval(pollRef.current)
  }, [])

  async function handleCreateInvoice(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const data = await createDeposit(session.access_token, Number(amount), method)
      setInvoice(data)
      const invoiceId = data.invoice_id ?? data.id
      pollRef.current = setInterval(async () => {
        try {
          const status = await checkDeposit(invoiceId)
          if (status?.status === 'paid' || status?.paid === true) {
            clearInterval(pollRef.current)
            onPaid?.()
          }
        } catch (err) {
          // тихо продолжаем опрос
        }
      }, 4000)
    } catch (err) {
      setError(err.message || 'Не удалось создать счёт')
    } finally {
      setLoading(false)
    }
  }

  async function handleSbpRequest(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const data = await sbpRequest(session.access_token, Number(amount))
      setSbpInfo(data)
    } catch (err) {
      setError(err.message || 'Не удалось создать заявку')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontSize: 18 }}>Пополнение баланса</h3>
          <span className="modal-close" onClick={onClose}>×</span>
        </div>

        <div className="auth-tabs">
          <div className={`auth-tab ${tab === 'crypto' ? 'active' : ''}`} onClick={() => setTab('crypto')}>
            Crypto Pay
          </div>
          <div className={`auth-tab ${tab === 'sbp' ? 'active' : ''}`} onClick={() => setTab('sbp')}>
            СБП
          </div>
        </div>

        {error && <div className="error-box">{error}</div>}

        {tab === 'crypto' && !invoice && (
          <form onSubmit={handleCreateInvoice}>
            <div className="field">
              <label>Сумма, USD</label>
              <input type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div className="field">
              <label>Валюта</label>
              <div className="method-grid">
                {CRYPTO_METHODS.map((m) => (
                  <div key={m.id} className={`method-chip ${method === m.id ? 'active' : ''}`} onClick={() => setMethod(m.id)}>
                    {m.label}
                  </div>
                ))}
              </div>
            </div>
            <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
              {loading ? 'Создаём счёт…' : 'Создать счёт'}
            </button>
          </form>
        )}

        {tab === 'crypto' && invoice && (
          <div className="pay-link-box">
            <p style={{ fontSize: 13.5, color: 'var(--fg-muted)' }}>
              Оплати счёт по ссылке ниже. Баланс зачислится автоматически — окно можно не закрывать.
            </p>
            {invoice.pay_url && (
              <a className="btn btn-primary btn-block" href={invoice.pay_url} target="_blank" rel="noopener noreferrer">
                Открыть счёт для оплаты
              </a>
            )}
            <div className="mono-box">{invoice.pay_url || JSON.stringify(invoice)}</div>
            <span style={{ fontSize: 12, color: 'var(--fg-faint)' }}>Ожидаем подтверждение оплаты…</span>
          </div>
        )}

        {tab === 'sbp' && !sbpInfo && (
          <form onSubmit={handleSbpRequest}>
            <div className="field">
              <label>Сумма, ₽</label>
              <input type="number" min="1" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
              {loading ? 'Создаём заявку…' : 'Создать заявку на перевод'}
            </button>
          </form>
        )}

        {tab === 'sbp' && sbpInfo && (
          <div className="pay-link-box">
            <p style={{ fontSize: 13.5, color: 'var(--fg-muted)' }}>
              Переведи сумму по СБП на номер ниже, затем пришли подтверждение в
              {' '}<a href="https://t.me/Bestconsultingbot" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--turq)' }}>Telegram-бот</a>.
              Баланс зачислится после ручной проверки.
            </p>
            <div className="mono-box">
              {sbpInfo.phone || sbpInfo.sbp_phone || JSON.stringify(sbpInfo)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
