import { useEffect, useState } from 'react'
import FileDrop from './FileDrop'
import JobRunner from './JobRunner'
import { submitPhotoEmotion, estimateCost, readAudioDuration, MAX_CLIP_SECONDS } from '../api'

// Пресеты Basic/Pro — API кейса 2 сам не различает тарифы, поэтому
// тариф здесь маппится на доступные параметры модели (expression_scale,
// pose_style). Если в будущем появятся отдельные параметры качества —
// расширить пресеты здесь.
const TIERS = {
  basic: { label: 'Basic', desc: 'Стандартная мимика', expressionScale: 0.7, poseStyle: 0 },
  pro: { label: 'Pro', desc: 'Более выразительная анимация', expressionScale: 1.0, poseStyle: 15 },
}

export default function CaseTwoForm({ onBack, balance }) {
  const [image, setImage] = useState(null)
  const [audio, setAudio] = useState(null)
  const [tier, setTier] = useState('basic')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [jobId, setJobId] = useState(null)
  const [cost, setCost] = useState(null)
  const [costLoading, setCostLoading] = useState(false)
  const [audioSeconds, setAudioSeconds] = useState(null)

  useEffect(() => {
    if (!audio) {
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
  }, [audio])

  const overLimit = audioSeconds !== null && audioSeconds > MAX_CLIP_SECONDS
  const canSubmit = image && audio && !submitting && !overLimit
  const numericCost = typeof cost === 'number' ? cost : null
  const insufficient = numericCost !== null && balance !== null && numericCost > balance

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const preset = TIERS[tier]
      const data = await submitPhotoEmotion({
        image,
        audio,
        expressionScale: preset.expressionScale,
        poseStyle: preset.poseStyle,
      })
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
      <h2 style={{ fontSize: 20, marginBottom: 18 }}>Кейс 2 · Фото + аудио</h2>

      {error && <div className="error-box">{error}</div>}

      <form onSubmit={handleSubmit}>
        <FileDrop
          id="c2-image"
          accept="image/*"
          file={image}
          onChange={setImage}
          label="Фото"
          hint="JPG/PNG, лицо крупным планом — любой размер, сожмём автоматически"
          compressImage
        />
        <FileDrop
          id="c2-audio"
          accept="audio/*"
          file={audio}
          onChange={setAudio}
          label="Аудио"
          hint={`WAV/MP3, до ${MAX_CLIP_SECONDS} секунд — модель сама подстроит эмоции`}
          compressAudio
        />

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
              </div>
            ))}
          </div>
        </div>

        {audioSeconds !== null && (
          <div className={`cost-banner ${insufficient || overLimit ? 'insufficient' : ''}`}>
            <span>
              {overLimit
                ? `Аудио длится ${audioSeconds.toFixed(1)} сек — превышает лимит в ${MAX_CLIP_SECONDS} сек, выбери файл короче`
                : costLoading ? 'Считаем стоимость…' : numericCost !== null
                  ? <>Оценка стоимости: <b>${numericCost.toFixed(2)}</b></>
                  : 'Не удалось оценить стоимость — генерация всё равно доступна'}
            </span>
            {!overLimit && insufficient && <span className="warn">Недостаточно средств на балансе</span>}
          </div>
        )}

        <button className="btn btn-primary btn-block" type="submit" disabled={!canSubmit}>
          {submitting ? 'Отправляем…' : 'Сгенерировать видео'}
        </button>
      </form>
    </div>
  )
}
