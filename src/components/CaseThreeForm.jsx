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
      setError(err.message || 'РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РїСЂР°РІРёС‚СЊ Р·Р°РґР°С‡Сѓ')
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
      <div className="back-link" onClick={onBack}>в†ђ Р’С‹Р±СЂР°С‚СЊ РґСЂСѓРіРѕР№ СЃС†РµРЅР°СЂРёР№</div>
      <h2 style={{ fontSize: 20, marginBottom: 18 }}>РљРµР№СЃ 3 В· Р›РёРїСЃРёРЅРє РїРѕ РІРёРґРµРѕ</h2>

      {error && <div className="error-box">{error}</div>}

      <form onSubmit={handleSubmit}>
        <FileDrop
          id="c3-video"
          accept="video/*"
          file={video}
          onChange={setVideo}
          label="Р�СЃС…РѕРґРЅРѕРµ РІРёРґРµРѕ"
          hint="MP4, Р»РёС†Рѕ РІРёРґРЅРѕ РЅР° РїСЂРѕС‚СЏР¶РµРЅРёРё РІСЃРµР№ Р·Р°РїРёСЃРё, РґРѕ ~20 РњР‘ (СЃР¶Р°С‚РёРµ РІРёРґРµРѕ РїРѕРєР° РЅРµ Р°РІС‚РѕРјР°С‚РёР·РёСЂРѕРІР°РЅРѕ)"
        />
        <FileDrop
          id="c3-audio"
          accept="audio/*"
          file={audio}
          onChange={setAudio}
          label="РђСѓРґРёРѕ-РґСЂР°Р№РІРµСЂ"
          hint={`WAV/MP3, РґРѕ ${MAX_CLIP_SECONDS} СЃРµРєСѓРЅРґ вЂ” РЅРѕРІР°СЏ СЂРµС‡СЊ, РїРѕРґ РєРѕС‚РѕСЂСѓСЋ РїРѕРґСЃС‚СЂРѕСЏС‚СЃСЏ РіСѓР±С‹`}
          compressAudio
        />

        {audioSeconds !== null && (
          <div className={`cost-banner ${insufficient || overLimit ? 'insufficient' : ''}`}>
            <span>
              {overLimit
                ? `РђСѓРґРёРѕ РґР»РёС‚СЃСЏ ${audioSeconds.toFixed(1)} СЃРµРє вЂ” РїСЂРµРІС‹С€Р°РµС‚ Р»РёРјРёС‚ РІ ${MAX_CLIP_SECONDS} СЃРµРє, РІС‹Р±РµСЂРё С„Р°Р№Р» РєРѕСЂРѕС‡Рµ`
                : costLoading ? 'РЎС‡РёС‚Р°РµРј СЃС‚РѕРёРјРѕСЃС‚СЊвЂ¦' : numericCost !== null
                  ? <>РћС†РµРЅРєР° СЃС‚РѕРёРјРѕСЃС‚Рё: <b>${numericCost.toFixed(2)}</b></>
                  : 'РќРµ СѓРґР°Р»РѕСЃСЊ РѕС†РµРЅРёС‚СЊ СЃС‚РѕРёРјРѕСЃС‚СЊ вЂ” РіРµРЅРµСЂР°С†РёСЏ РІСЃС‘ СЂР°РІРЅРѕ РґРѕСЃС‚СѓРїРЅР°'}
            </span>
            {!overLimit && insufficient && <span className="warn">РќРµРґРѕСЃС‚Р°С‚РѕС‡РЅРѕ СЃСЂРµРґСЃС‚РІ РЅР° Р±Р°Р»Р°РЅСЃРµ</span>}
          </div>
        )}

        <button className="btn btn-primary btn-block" type="submit" disabled={!canSubmit}>
          {submitting ? 'РћС‚РїСЂР°РІР»СЏРµРјвЂ¦' : 'РЎРіРµРЅРµСЂРёСЂРѕРІР°С‚СЊ РІРёРґРµРѕ'}
        </button>
      </form>
    </div>
  )
}
