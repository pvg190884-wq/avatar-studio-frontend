import { useEffect, useRef, useState } from 'react'
import { pollJobStatus } from '../api'

const STATUS_LABELS = {
  IN_QUEUE: 'В очереди на GPU…',
  IN_PROGRESS: 'Генерируется…',
  COMPLETED: 'Готово!',
}

export default function JobRunner({ jobId, onReset, onComplete }) {
  const [status, setStatus] = useState('IN_QUEUE')
  const [videoUrl, setVideoUrl] = useState(null)
  const [error, setError] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const pollTimer = useRef(null)
  const elapsedTimer = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function tick() {
      try {
        const data = await pollJobStatus(jobId)
        if (cancelled) return
        if (data.status === 'COMPLETED' && data.videoUrl) {
          setStatus('COMPLETED')
          setVideoUrl(data.videoUrl)
          onComplete?.()
          return // остановить опрос
        }
        setStatus(data.status || 'IN_PROGRESS')
        pollTimer.current = setTimeout(tick, 5000)
      } catch (err) {
        if (cancelled) return
        setError(err.message || 'Генерация завершилась с ошибкой')
      }
    }

    tick()
    elapsedTimer.current = setInterval(() => setElapsed((s) => s + 1), 1000)

    return () => {
      cancelled = true
      clearTimeout(pollTimer.current)
      clearInterval(elapsedTimer.current)
    }
  }, [jobId])

  useEffect(() => {
    if (status === 'COMPLETED' || error) {
      clearInterval(elapsedTimer.current)
    }
  }, [status, error])

  if (error) {
    return (
      <div className="progress-wrap">
        <div className="error-box" style={{ width: '100%' }}>{error}</div>
        <button className="btn btn-ghost" onClick={onReset}>Попробовать снова</button>
      </div>
    )
  }

  if (status === 'COMPLETED' && videoUrl) {
    return (
      <div>
        <video className="result-video" src={videoUrl} controls autoPlay />
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <a className="btn btn-primary" href={videoUrl} download="avatar_result.mp4">
            Скачать видео
          </a>
          <button className="btn btn-ghost" onClick={onReset}>Создать ещё</button>
        </div>
      </div>
    )
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')

  return (
    <div className="progress-wrap">
      <div className="spinner" />
      <div className="progress-status">
        <b>{STATUS_LABELS[status] || status}</b>
      </div>
      <div className="progress-elapsed">
        Прошло {mm}:{ss} — обычно генерация занимает несколько минут, не закрывай вкладку
      </div>
    </div>
  )
}
