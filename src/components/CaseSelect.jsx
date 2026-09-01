const CASES = [
  {
    id: 1,
    title: 'Фото + текст',
    desc: 'Фото, образец голоса (клонирование через XTTS-v2), текст на русском/английском и выбор эмоции.',
  },
  {
    id: 2,
    title: 'Фото + аудио',
    desc: 'Фото и готовая аудиозапись — модель сама подстраивает мимику и эмоции под голос.',
  },
  {
    id: 3,
    title: 'Липсинк по видео',
    desc: 'Видео с лицом + аудио-драйвер — точная синхронизация губ через MuseTalk 1.5.',
  },
]

export default function CaseSelect({ onSelect }) {
  return (
    <div>
      <h2 style={{ fontSize: 22, marginBottom: 6 }}>Выбери сценарий</h2>
      <p style={{ color: 'var(--fg-faint)', fontSize: 13.5, marginBottom: 20 }}>
        Каждый сценарий использует свою модель под капотом — просто выбери, что у тебя есть на входе.
      </p>
      <div className="case-grid">
        {CASES.map((c) => (
          <div
            key={c.id}
            className={`case-card ${c.soon ? 'disabled' : ''}`}
            onClick={() => !c.soon && onSelect(c.id)}
          >
            <span className="case-num">Кейс {c.id}</span>
            <span className="case-title">{c.title}</span>
            <span className="case-desc">{c.desc}</span>
            {c.soon && <span className="soon-badge">Скоро</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
