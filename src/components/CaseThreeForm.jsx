import { useEffect, useState } from 'react'
import FileDrop from './FileDrop'
import JobRunner from './JobRunner'
import { submitLipsync, estimateCost, readAudioDuration, MAX_CLIP_SECONDS } from '../api'

export default function CaseThreeForm({ onBack, balance }) {
  const [video, setVideo] = useState(null)
  const [audio, setAudio] = useState(null)
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
  const canSubmit = video && audio && !submitting && !overLimit
  const numericCost = typeof cost === 'number' ? cost : null
  const insufficient = numericCost !== null && balance !== null && numericCost > balance

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const data = await submitLipsync({ video, audio })
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
      <h2 style={{ fontSize: 20, marginBottom: 18 }}>Кейс 3 · Липсинк по видео</h2>

      {error && <div className="error-box">{error}</div>}

      <form onSubmit={handleSubmit}>
        <FileDrop
          id="c3-video"
          accept="video/*"
          file={video}
          onChange={setVideo}
          label="Исходное видео"
          hint="MP4, лицо видно на протяжении всей записи, до ~20 МБ (сжатие видео пока не автоматизировано)"
        />
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
