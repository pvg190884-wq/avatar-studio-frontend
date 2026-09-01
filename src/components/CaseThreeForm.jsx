import { useEffect, useState } from 'react'
import FileDrop from './FileDrop'
import JobRunner from './JobRunner'
import { submitLipsync, estimateCost, readAudioDuration } from '../api'

export default function CaseThreeForm({ onBack, balance }) {
  const [video, setVideo] = useState(null)
  const [audio, setAudio] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [jobId, setJobId] = useState(null)
  const [cost, setCost] = useState(null)
  const [costLoading, setCostLoading] = useState(false)

  useEffect(() => {
    if (!audio) {
      setCost(null)
      return
    }
    let cancelled = false
    setCostLoading(true)
    readAudioDuration(audio)
      .then((duration) => estimateCost(duration))
      .then((data) => {
        if (!cancelled) setCost(data?.cost_usd ?? data?.estimated_cost_usd ?? data)
      })
      .catch(() => {
        if (!cancelled) setCost(null)
      })
      .finally(() => {
        if (!cancelled) setCostLoading(false)
      })
    return () => { cancelled = true }
  }, [audio])

  const canSubmit = video && audio && !submitting
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
          hint="лицо видно на протяжении всей записи"
        />
        <FileDrop
          id="c3-audio"
          accept="audio/*"
          file={audio}
          onChange={setAudio}
          label="Аудио-драйвер"
          hint="новая речь, под которую подстроятся губы"
        />

        {audio && (
          <div className={`cost-banner ${insufficient ? 'insufficient' : ''}`}>
            <span>
              {costLoading ? 'Считаем стоимость…' : numericCost !== null
                ? <>Оценка стоимости: <b>${numericCost.toFixed(2)}</b></>
                : 'Не удалось оценить стоимость — генерация всё равно доступна'}
            </span>
            {insufficient && <span className="warn">Недостаточно средств на балансе</span>}
          </div>
        )}

        <button className="btn btn-primary btn-block" type="submit" disabled={!canSubmit}>
          {submitting ? 'Отправляем…' : 'Сгенерировать видео'}
        </button>
      </form>
    </div>
  )
}
