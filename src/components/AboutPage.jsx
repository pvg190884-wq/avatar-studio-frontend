import { MAX_CLIP_SECONDS } from '../api'
import StarField from './StarField'

const CASES_INFO = [
  {
    title: 'Кейс 1 · Фото + текст',
    points: [
      'Фото: JPG/PNG, лицо анфас крупным планом, хорошее равномерное освещение',
      'Образец голоса: WAV/MP3, 10–20 секунд чистой речи без музыки и фонового шума',
      `Текст: озвучка ограничена ~${MAX_CLIP_SECONDS} секундами — это примерно 30–35 слов на русском`,
      'Эмоция подбирается вручную из пресетов, язык — русский или английский',
    ],
  },
  {
    title: 'Кейс 2 · Фото + аудио',
    points: [
      'Фото: JPG/PNG, лицо анфас крупным планом',
      `Аудио: WAV/MP3, длительность до ${MAX_CLIP_SECONDS} секунд`,
      'Эмоции и мимика подстраиваются под интонацию голоса автоматически',
      'Тариф Pro даёт более выразительную анимацию мимики за счёт других настроек модели',
    ],
  },
  {
    title: 'Кейс 3 · Липсинк по видео',
    points: [
      'Видео: MP4, лицо должно быть видно на протяжении всей записи',
      `Аудио-драйвер: WAV/MP3, до ${MAX_CLIP_SECONDS} секунд`,
      'Governs только синхронизацию губ — мимика и движения берутся из исходного видео',
    ],
  },
]

export default function AboutPage({ onClose }) {
  return (
    <div className="about-shell">
      <div className="bg-scene expert" aria-hidden="true">
        <div className="bg-photo" />
        <StarField />
        <div className="bg-vignette" />
      </div>

      <div className="about-content">
        <div className="back-link" onClick={onClose} style={{ color: 'var(--fg)' }}>← Назад в студию</div>

        <h2 style={{ fontSize: 26, marginBottom: 6 }}>О программе</h2>
        <p style={{ color: 'var(--fg-muted)', fontSize: 14, marginBottom: 28, maxWidth: 560 }}>
          Avatar Studio превращает фото или видео в говорящего AI-аватара. Три сценария —
          три разных способа получить результат, в зависимости от того, что есть на входе.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
          {CASES_INFO.map((c) => (
            <div className="panel" key={c.title}>
              <h3 style={{ fontSize: 16, marginBottom: 12 }}>{c.title}</h3>
              <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {c.points.map((p, i) => (
                  <li key={i} style={{ fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.5 }}>{p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="panel">
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>Оплата</h3>
          <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li style={{ fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
              Стоимость считается посекундно по фактическому времени работы GPU — точную оценку
              для твоего файла показывает баннер над кнопкой генерации после загрузки аудио.
            </li>
            <li style={{ fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
              Пополнение через Crypto Pay (USDT / TON / BTC) — зачисляется автоматически после
              оплаты по ссылке счёта.
            </li>
            <li style={{ fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
              Пополнение через СБП — перевод на указанный номер телефона, зачисление после
              подтверждения в Telegram-боте (немного дольше, чем крипта).
            </li>
            <li style={{ fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
              Открыть окно пополнения можно в любой момент кнопкой «Пополнить» в шапке приложения.
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
