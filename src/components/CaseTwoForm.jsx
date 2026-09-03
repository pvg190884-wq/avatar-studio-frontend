import { useEffect, useState } from 'react'
import FileDrop from './FileDrop'
import JobRunner from './JobRunner'
import { submitPhotoEmotion, estimateCost, readAudioDuration, MAX_CLIP_SECONDS } from '../api'

// РџСЂРµСЃРµС‚С‹ Basic/Pro вЂ” API РєРµР№СЃР° 2 СЃР°Рј РЅРµ СЂР°Р·Р»РёС‡Р°РµС‚ С‚Р°СЂРёС„С‹, РїРѕСЌС‚РѕРјСѓ
// С‚Р°СЂРёС„ Р·РґРµСЃСЊ РјР°РїРїРёС‚СЃСЏ РЅР° РґРѕСЃС‚СѓРїРЅС‹Рµ РїР°СЂР°РјРµС‚СЂС‹ РјРѕРґРµР»Рё (expression_scale,
// pose_style). Р•СЃР»Рё РІ Р±СѓРґСѓС‰РµРј РїРѕСЏРІСЏС‚СЃСЏ РѕС‚РґРµР»СЊРЅС‹Рµ РїР°СЂР°РјРµС‚СЂС‹ РєР°С‡РµСЃС‚РІР° вЂ”
// СЂР°СЃС€РёСЂРёС‚СЊ РїСЂРµСЃРµС‚С‹ Р·РґРµСЃСЊ.
const TIERS = {
  basic: { label: 'Basic', desc: 'РЎС‚Р°РЅРґР°СЂС‚РЅР°СЏ РјРёРјРёРєР°', expressionScale: 0.7, poseStyle: 0 },
  pro: { label: 'Pro', desc: 'Р‘РѕР»РµРµ РІС‹СЂР°Р·РёС‚РµР»СЊРЅР°СЏ Р°РЅРёРјР°С†РёСЏ', expressionScale: 1.0, poseStyle: 15 },
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
      <h2 style={{ fontSize: 20, marginBottom: 18 }}>РљРµР№СЃ 2 В· Р¤РѕС‚Рѕ + Р°СѓРґРёРѕ</h2>

      {error && <div className="error-box">{error}</div>}

      <form onSubmit={handleSubmit}>
        <FileDrop
          id="c2-image"
          accept="image/*"
          file={image}
          onChange={setImage}
          label="Р¤РѕС‚Рѕ"
          hint="JPG/PNG, Р»РёС†Рѕ РєСЂСѓРїРЅС‹Рј РїР»Р°РЅРѕРј вЂ” Р»СЋР±РѕР№ СЂР°Р·РјРµСЂ, СЃРѕР¶РјС‘Рј Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё"
          compressImage
        />
        <FileDrop
          id="c2-audio"
          accept="audio/*"
          file={audio}
          onChange={setAudio}
          label="РђСѓРґРёРѕ"
          hint={`WAV/MP3, РґРѕ ${MAX_CLIP_SECONDS} СЃРµРєСѓРЅРґ вЂ” РјРѕРґРµР»СЊ СЃР°РјР° РїРѕРґСЃС‚СЂРѕРёС‚ СЌРјРѕС†РёРё`}
          compressAudio
        />

        <div className="field">
          <label>РўР°СЂРёС„</label>
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
