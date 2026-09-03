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
  return parseJsonOrThrow(res) // { user_id, balance_usd }
}

export async function estimateCost(durationSeconds) {
  const res = await fetch(`${API_BASE}/api/billing/estimate?duration_seconds=${encodeURIComponent(durationSeconds)}`)
  return parseJsonOrThrow(res) // { duration_seconds, estimated_cost_usd }
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

// ---------- Сжатие изображений перед отправкой ----------
//
// Фото с телефона или скриншоты часто весят 5–8+ МБ — та же причина
// обрывов "Failed to fetch", что и с несжатым аудио. SadTalker всё
// равно приводит входное фото к рабочему разрешению (256–512px)
// внутри своего пайплайна, так что уменьшение до 1600px по длинной
// стороне не влияет на качество результата генерации, а только
// убирает лишний вес файла.
const MAX_IMAGE_DIMENSION = 1600
const IMAGE_QUALITY = 0.9
const SKIP_COMPRESSION_BELOW_BYTES = 1.5 * 1024 * 1024 // < 1.5 МБ не трогаем

export async function compressImageFile(file) {
  try {
    if (!file.type.startsWith('image/')) return file

    const bitmap = await createImageBitmap(file)
    const { width, height } = bitmap
    const alreadySmall = width <= MAX_IMAGE_DIMENSION && height <= MAX_IMAGE_DIMENSION
    if (alreadySmall && file.size < SKIP_COMPRESSION_BELOW_BYTES) {
      bitmap.close?.()
      return file
    }

    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(width, height))
    const targetW = Math.max(1, Math.round(width * scale))
    const targetH = Math.max(1, Math.round(height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext('2d')
    ctx.drawImage(bitmap, 0, 0, targetW, targetH)
    bitmap.close?.()

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', IMAGE_QUALITY))
    if (!blob || blob.size >= file.size) return file

    const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], newName, { type: 'image/jpeg' })
  } catch (err) {
    console.warn('Не удалось сжать изображение, отправляем как есть:', err)
    return file
  }
}

// ---------- Сжатие аудио перед отправкой ----------
//
// Несжатые WAV-файлы (особенно длинные образцы голоса) могут весить
// несколько мегабайт — такие запросы стабильно обрываются ошибкой
// "Failed to fetch" при загрузке на Railway (см. диагностику в чате).
// Решение — понизить частоту дискретизации до 16 кГц и свести в моно
// прямо в браузере перед отправкой. Модели голосового клонирования
// (XTTS и подобные) всё равно пересэмплируют вход к своей рабочей
// частоте внутри себя, так что для результата генерации это не потеря
// качества, а просто удаление избыточных данных.
const COMPRESSED_SAMPLE_RATE = 16000

function encodeWavPCM16(audioBuffer) {
  const numChannels = 1 // всегда сводим в моно
  const sampleRate = audioBuffer.sampleRate
  const samples = audioBuffer.getChannelData(0)
  const bytesPerSample = 2
  const blockAlign = numChannels * bytesPerSample
  const dataSize = samples.length * bytesPerSample

  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)

  function writeString(offset, str) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true) // PCM chunk size
  view.setUint16(20, 1, true) // audio format = PCM
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true) // byte rate
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true) // bits per sample
  writeString(36, 'data')
  view.setUint32(40, dataSize, true)

  let offset = 44
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }

  return new Blob([buffer], { type: 'audio/wav' })
}

// Возвращает сжатый File (16 кГц, моно, 16-бит WAV). Если по любой
// причине декодирование не удалось (нестандартный формат и т.п.) —
// тихо возвращает исходный файл, чтобы не блокировать пользователя.
export async function compressAudioFile(file) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return file

    const arrayBuffer = await file.arrayBuffer()
    const audioCtx = new AudioCtx()
    const decoded = await audioCtx.decodeAudioData(arrayBuffer)
    audioCtx.close()

    const targetRate = Math.min(COMPRESSED_SAMPLE_RATE, decoded.sampleRate)
    const offlineCtx = new OfflineAudioContext(
      1,
      Math.ceil(decoded.duration * targetRate),
      targetRate
    )
    const source = offlineCtx.createBufferSource()
    source.buffer = decoded
    source.connect(offlineCtx.destination)
    source.start()
    const rendered = await offlineCtx.startRendering()

    const blob = encodeWavPCM16(rendered)
    // Если сжатие вдруг не помогло (редкий случай) — не подсовываем файл больше исходного
    if (blob.size >= file.size) return file

    const newName = file.name.replace(/\.[^.]+$/, '') + '.wav'
    return new File([blob], newName, { type: 'audio/wav' })
  } catch (err) {
    console.warn('Не удалось сжать аудио, отправляем как есть:', err)
    return file
  }
}
