import { useState } from 'react'
import FileDrop from './FileDrop'
import JobRunner from './JobRunner'
import { submitPhotoTextEmotion, estimateTextDurationSeconds, MAX_CLIP_SECONDS, formatUsd, PRO_PRICE_PER_SECOND_USD, PRO_NOTE } from '../api'

const EMOTIONS = [
  { id: 'neutral', label: 'Нейтрально' },
  { id: 'happy', label: 'Радость' },
  { id: 'sad', label: 'Грусть' },
  { id: 'angry', label: 'Злость' },
  { id: 'surprised', label: 'Удивление' },
]

// Basic — SadTalker/XTTS (текущий пайплайн). Pro — EchoMimicV2: более
// естественная мимика и жестикуляция рук, подобранная под выбранную
// эмоцию из её готовой библиотеки pose-последовательностей. Тот же
// паттерн тумблера, что уже есть в CaseTwoForm.jsx.
const TIERS = {
  basic: { label: 'Basic', desc: 'Стандартная мимика' },
  pro: {
    label: 'Pro',
    desc: 'Жестикуляция + более естественная мимика',
    note: `${PRO_NOTE} · $${PRO_PRICE_PER_SECOND_USD.toFixed(2)} за секунду`,
  },
}

export default function CaseOneForm({ onBack, session, onGenerated }) {
  const [image, setImage] = useState(null)
  const [voiceSample, setVoiceSample] = useState(null)
  const [text, setText] = useState('')
  const [emotion, setEmotion] = useState('neutral')
  const [language, setLanguage] = useState('ru')
  const [tier, setTier] = useState('basic')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [jobId, setJobId] = useState(null)

  const canSubmit = image && voiceSample && text.trim().length > 0 && !submitting

  const estimatedSeconds = estimateTextDurationSeconds(text)
  const overLimit = estimatedSeconds > MAX_CLIP_SECONDS
  const canSubmitFinal = canSubmit && !overLimit

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmitFinal) return
    setSubmitting(true)
    setError(null)
    try {
      const data = await submitPhotoTextEmotion({ image, voiceSample, text, emotion, language, tier, accessToken: session.access_token })
      setJobId(data.job_id)
    } catch (err) {
      setError(err.message || 'Не удалось отправить задачу')
    } finally {
      setSubmitting(false)
    }
  }

  if (jobId) {
    return (
      <div className="panel">
        <JobRunner jobId={jobId} onReset={() => setJobId(null)} onComplete={onGenerated} />
      </div>
    )
  }

  return (
    <div className="panel">
      <div className="back-link" onClick={onBack}>← Выбрать другой сценарий</div>
      <h2 style={{ fontSize: 20, marginBottom: 18 }}>Кейс 1 · Фото + текст</h2>

      {error && <div className="error-box">{error}</div>}

      <form onSubmit={handleSubmit}>
        <FileDrop
          id="c1-image"
          accept="image/*"
          file={image}
          onChange={setImage}
          label="Фото"
          hint="JPG/PNG, лицо анфас крупным планом, хорошее освещение — любой размер, сожмём автоматически"
          compressImage
        />
        <FileDrop
          id="c1-voice"
          accept="audio/*"
          file={voiceSample}
          onChange={setVoiceSample}
          label="Образец голоса"
          hint="WAV/MP3, 10–20 секунд чистой речи без музыки и шума"
          compressAudio
        />

        <div className="field">
          <label>Текст для озвучки</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Что должен сказать аватар…"
            required
          />
          {text.trim().length > 0 && (
            <span className={`hint ${overLimit ? 'hint-warn' : ''}`} style={{ textTransform: 'none' }}>
              Примерная длительность озвучки: ~{estimatedSeconds.toFixed(1)} сек (грубая оценка, реальная может отличаться)
              {overLimit && ` — превышает лимит в ${MAX_CLIP_SECONDS} сек, сократи текст`}
            </span>
          )}
        </div>

        <div className="field">
          <label>Эмоция</label>
          <div className="emotion-grid">
            {EMOTIONS.map((em) => (
              <div
                key={em.id}
                className={`emotion-chip ${emotion === em.id ? 'active' : ''}`}
                onClick={() => setEmotion(em.id)}
              >
                {em.label}
              </div>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Язык текста</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="ru">Русский</option>
            <option value="en">English</option>
          </select>
        </div>

        <div className="field">
          <label>Тариф</label>
          <div className="tier-toggle">
            {Object.entries(TIERS).map(([key, t]) => (
              <div
                key={key}
                className={`tier-option ${tier === key ? 'active' : ''}`}
                onClick={() => setTier(key)}
              >
                <b>{t.label}</b>
                <span>{t.desc}</span>
                {t.note && <span className="tier-note">{t.note}</span>}
              </div>
            ))}
          </div>
          {tier === 'pro' && text.trim().length > 0 && (
            <span className="hint" style={{ textTransform: 'none' }}>
              Примерная стоимость Pro: ~{formatUsd(estimatedSeconds * PRO_PRICE_PER_SECOND_USD)} (точно — по длительности готового видео)
            </span>
          )}
        </div>

        <button className="btn btn-primary btn-block" type="submit" disabled={!canSubmitFinal}>
          {submitting
            ? (tier === 'pro' ? 'Озвучиваем и анимируем…' : 'Отправляем…')
            : 'Сгенерировать видео'}
        </button>
      </form>
    </div>
  )
}
