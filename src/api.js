const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://avatar-studio-backend-production.up.railway.app'

async function parseJsonOrThrow(res) {
  let data = null
  try {
    data = await res.json()
  } catch (e) {
    // тело не JSON — оставляем data = null
  }
  if (!res.ok) {
    const detail = data && data.detail ? JSON.stringify(data.detail) : `Ошибка ${res.status}`
    throw new Error(detail)
  }
  return data
}

// Грубая оценка длительности озвучки текста (TTS) в секундах —
// нужна ДО генерации, чтобы предупредить о лимите в 15 секунд, пока
// бэкенд не выполнил реальный синтез. Оценка по средней скорости речи
// (~2.3 слова/сек для русского и английского с учётом естественных пауз).
export function estimateTextDurationSeconds(text) {
  const words = (text || '').trim().split(/\s+/).filter(Boolean).length
  if (words === 0) return 0
  const WORDS_PER_SECOND = 2.3
  return words / WORDS_PER_SECOND
}

export const MAX_CLIP_SECONDS = 15

// ---------- Генерация (Кейсы 1, 2, 3) ----------

export async function submitPhotoTextEmotion({ image, voiceSample, text, emotion, language }) {
  const form = new FormData()
  form.append('image', image)
  form.append('voice_sample', voiceSample)
  form.append('text', text)
  form.append('emotion', emotion)
  form.append('language', language)

  const res = await fetch(`${API_BASE}/api/generate/photo-text-emotion`, {
    method: 'POST',
    body: form,
  })
  return parseJsonOrThrow(res)
}

export async function submitPhotoEmotion({ image, audio, expressionScale, poseStyle }) {
  const form = new FormData()
  form.append('image', image)
  form.append('audio', audio)
  form.append('expression_scale', expressionScale)
  form.append('pose_style', poseStyle)

  const res = await fetch(`${API_BASE}/api/generate/photo-emotion`, {
    method: 'POST',
    body: form,
  })
  return parseJsonOrThrow(res)
}

export async function submitLipsync({ video, audio }) {
  const form = new FormData()
  form.append('video', video)
  form.append('audio', audio)

  const res = await fetch(`${API_BASE}/api/generate/lipsync`, {
    method: 'POST',
    body: form,
  })
  return parseJsonOrThrow(res)
}

// Опрос статуса. Бэкенд при готовности отдаёт бинарный video/mp4,
// а не JSON — поэтому смотрим на content-type перед парсингом.
export async function pollJobStatus(jobId) {
  const res = await fetch(`${API_BASE}/api/generate/status/${jobId}`)
  const contentType = res.headers.get('content-type') || ''

  if (contentType.includes('video')) {
    const blob = await res.blob()
    return { status: 'COMPLETED', videoUrl: URL.createObjectURL(blob), blob }
  }

  const data = await parseJsonOrThrow(res)
  return data
}

// ---------- Биллинг ----------

export async function getBalance(accessToken) {
  const res = await fetch(`${API_BASE}/api/billing/balance`, {
    headers: { authorization: `Bearer ${accessToken}` },
  })
  return parseJsonOrThrow(res)
}

export async function estimateCost(durationSeconds) {
  const res = await fetch(`${API_BASE}/api/billing/estimate?duration_seconds=${encodeURIComponent(durationSeconds)}`)
  return parseJsonOrThrow(res)
}

export async function createDeposit(accessToken, amount, method) {
  const res = await fetch(`${API_BASE}/api/billing/create-deposit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ amount, method }),
  })
  return parseJsonOrThrow(res)
}

export async function checkDeposit(invoiceId) {
  const res = await fetch(`${API_BASE}/api/billing/check-deposit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ invoice_id: invoiceId }),
  })
  return parseJsonOrThrow(res)
}

export async function sbpRequest(accessToken, amountRub) {
  const res = await fetch(`${API_BASE}/api/billing/sbp/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ amount_rub: amountRub }),
  })
  return parseJsonOrThrow(res)
}

// Читает длительность аудиофайла на клиенте (для оценки стоимости
// до отправки задачи в генерацию — бэкенд считает по секундам).
export function readAudioDuration(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const audioEl = new Audio()
    audioEl.preload = 'metadata'
    audioEl.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve(audioEl.duration)
    }
    audioEl.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Не удалось прочитать длительность аудио'))
    }
    audioEl.src = url
  })
}
