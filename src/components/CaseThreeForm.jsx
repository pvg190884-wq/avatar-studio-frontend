import { useEffect, useState } from 'react'
import FileDrop from './FileDrop'
import JobRunner from './JobRunner'
import {
  submitLipsync, submitLipsyncFromText, estimateCost, readAudioDuration,
  estimateTextDurationSeconds, MAX_CLIP_SECONDS, formatUsd,
} from '../api'

export default function CaseThreeForm({ onBack, balance, session, onGenerated }) {
  const [mode, setMode] = useState('audio') // 'audio' | 'text'
  const [video, setVideo] = useState(null)

  // Режим "Аудио"
  const [audio, setAudio] = useState(null)
  const [cost, setCost] = useState(null)
  const [costLoading, setCostLoading] = useState(false)
  const [audioSeconds, setAudioSeconds] = useState(null)

  // Режим "Текст"
  const [voiceSample, setVoiceSample] = useState(null)
  const [text, setText] = useState('')
  const [language, setLanguage] = useState('ru')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [jobId, setJobId] = useState(null)

  useEffect(() => {
    if (mode !== 'audio' || !audio) {
      setCost(null)
      setAudioSeconds(null)
      return
    }
    let cancelled = false
    setCostLoading(true)
    readAudioDuration(audio)
      .then((duration) => {
        if (cancelled) return
        setAudioSeconds(duration)
        return estimateCost(duration)
      })
      .then((data) => {
        if (!cancelled && data) setCost(data?.estimated_cost_usd ?? null)
      })
      .catch(() => {
        if (!cancelled) setCost(null)
      })
      .finally(() => {
        if (!cancelled) setCostLoading(false)
      })
    return () => { cancelled = true }
  }, [audio, mode])

  const overLimit = mode === 'audio' && audioSeconds !== null && audioSeconds > MAX_CLIP_SECONDS
  const numericCost = typeof cost === 'number' ? cost : null
  const insufficient = numericCost !== null && balance !== null && numericCost > balance

  const estimatedTextSeconds = mode === 'text' ? estimateTextDurationSeconds(text) : 0
  const textOverLimit = mode === 'text' && estimatedTextSeconds > MAX_CLIP_SECONDS

  const canSubmit = mode === 'audio'
    ? (video && audio && !submitting && !overLimit)
    : (video && voiceSample && text.trim().length > 0 && !submitting && !textOverLimit)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const data = mode === 'audio'
        ? await submitLipsync({ video, audio, accessToken: session.access_token })
        : await submitLipsyncFromText({ video, voiceSample, text, language, accessToken: session.access_token })
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
      <h2 style={{ fontSize: 20, marginBottom: 18 }}>Кейс 3 · Липсинк по видео</h2>

      <div className="auth-tabs" style={{ marginBottom: 18 }}>
        <div className={`auth-tab ${mode === 'audio' ? 'active' : ''}`} onClick={() => setMode('audio')}>
          Готовое аудио
        </div>
        <div className={`auth-tab ${mode === 'text' ? 'active' : ''}`} onClick={() => setMode('text')}>
          Текст
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      <form onSubmit={handleSubmit}>
        <FileDrop
          id="c3-video"
          accept="video/*"
          file={video}
          onChange={setVideo}
          label="Исходное видео"
          hint="MP4/MOV, лицо видно на протяжении всей записи, короткий ролик (до ~15-20 сек) и до ~15 МБ — автосжатие видео пока недоступно"
        />

        {mode === 'audio' && (
          <>
            <FileDrop
              id="c3-audio"
              accept="audio/*"
              file={audio}
              onChange={setAudio}
              label="Аудио-драйвер"
              hint={`WAV/MP3, до ${MAX_CLIP_SECONDS} секунд — новая речь, под которую подстроятся губы`}
              compressAudio
            />

            {audioSeconds !== null && (
              <div className={`cost-banner ${insufficient || overLimit ? 'insufficient' : ''}`}>
                <span>
                  {overLimit
                    ? `Аудио длится ${audioSeconds.toFixed(1)} сек — превышает лимит в ${MAX_CLIP_SECONDS} сек, выбери файл короче`
                    : costLoading ? 'Считаем стоимость…' : numericCost !== null
                      ? <>Оценка стоимости: <b>{formatUsd(numericCost)}</b></>
                      : 'Не удалось оценить стоимость — генерация всё равно доступна'}
                </span>
                {!overLimit && insufficient && <span className="warn">Недостаточно средств на балансе</span>}
              </div>
            )}
          </>
        )}

        {mode === 'text' && (
          <>
            <FileDrop
              id="c3-voice"
              accept="audio/*"
              file={voiceSample}
              onChange={setVoiceSample}
              label="Образец голоса"
              hint="WAV/MP3, 10–20 секунд чистой речи без музыки и шума — для клонирования голоса"
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
                <span className={`hint ${textOverLimit ? 'hint-warn' : ''}`} style={{ textTransform: 'none' }}>
                  Примерная длительность озвучки: ~{estimatedTextSeconds.toFixed(1)} сек (грубая оценка, реальная может отличаться)
                  {textOverLimit && ` — превышает лимит в ${MAX_CLIP_SECONDS} сек, сократи текст`}
                </span>
              )}
            </div>

            <div className="field">
              <label>Язык текста</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="ru">Русский</option>
                <option value="en">English</option>
              </select>
            </div>

            <div className="cost-banner">
              <span>Точная стоимость станет известна после озвучки — спишется автоматически перед началом липсинка</span>
            </div>
          </>
        )}

        <button className="btn btn-primary btn-block" type="submit" disabled={!canSubmit}>
          {submitting ? (mode === 'text' ? 'Озвучиваем и отправляем…' : 'Отправляем…') : 'Сгенерировать видео'}
        </button>
      </form>
    </div>
  )
}
