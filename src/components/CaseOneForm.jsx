import { useState } from 'react'
import FileDrop from './FileDrop'
import JobRunner from './JobRunner'
import { submitPhotoTextEmotion } from '../api'

const EMOTIONS = [
  { id: 'neutral', label: 'Нейтрально' },
  { id: 'happy', label: 'Радость' },
  { id: 'sad', label: 'Грусть' },
  { id: 'angry', label: 'Злость' },
  { id: 'surprised', label: 'Удивление' },
]

export default function CaseOneForm({ onBack }) {
  const [image, setImage] = useState(null)
  const [voiceSample, setVoiceSample] = useState(null)
  const [text, setText] = useState('')
  const [emotion, setEmotion] = useState('neutral')
  const [language, setLanguage] = useState('ru')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [jobId, setJobId] = useState(null)

  const canSubmit = image && voiceSample && text.trim().length > 0 && !submitting

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const data = await submitPhotoTextEmotion({ image, voiceSample, text, emotion, language })
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
        <JobRunner jobId={jobId} onReset={() => setJobId(null)} />
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
          hint="лицо крупным планом, хорошее освещение"
        />
        <FileDrop
          id="c1-voice"
          accept="audio/*"
          file={voiceSample}
          onChange={setVoiceSample}
          label="Образец голоса"
          hint="10–20 секунд чистой речи для клонирования"
        />

        <div className="field">
          <label>Текст для озвучки</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Что должен сказать аватар…"
            required
          />
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

        <button className="btn btn-primary btn-block" type="submit" disabled={!canSubmit}>
          {submitting ? 'Отправляем…' : 'Сгенерировать видео'}
        </button>
      </form>
    </div>
  )
}
