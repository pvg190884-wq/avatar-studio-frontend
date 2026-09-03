import { useState } from 'react'
import FileDrop from './FileDrop'
import JobRunner from './JobRunner'
import { submitPhotoTextEmotion, estimateTextDurationSeconds, MAX_CLIP_SECONDS } from '../api'

const EMOTIONS = [
  { id: 'neutral', label: 'РќРµР№С‚СЂР°Р»СЊРЅРѕ' },
  { id: 'happy', label: 'Р Р°РґРѕСЃС‚СЊ' },
  { id: 'sad', label: 'Р“СЂСѓСЃС‚СЊ' },
  { id: 'angry', label: 'Р—Р»РѕСЃС‚СЊ' },
  { id: 'surprised', label: 'РЈРґРёРІР»РµРЅРёРµ' },
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

  const estimatedSeconds = estimateTextDurationSeconds(text)
  const overLimit = estimatedSeconds > MAX_CLIP_SECONDS
  const canSubmitFinal = canSubmit && !overLimit

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmitFinal) return
    setSubmitting(true)
    setError(null)
    try {
      const data = await submitPhotoTextEmotion({ image, voiceSample, text, emotion, language })
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
      <h2 style={{ fontSize: 20, marginBottom: 18 }}>РљРµР№СЃ 1 В· Р¤РѕС‚Рѕ + С‚РµРєСЃС‚</h2>

      {error && <div className="error-box">{error}</div>}

      <form onSubmit={handleSubmit}>
        <FileDrop
          id="c1-image"
          accept="image/*"
          file={image}
          onChange={setImage}
          label="Р¤РѕС‚Рѕ"
          hint="JPG/PNG, Р»РёС†Рѕ Р°РЅС„Р°СЃ РєСЂСѓРїРЅС‹Рј РїР»Р°РЅРѕРј, С…РѕСЂРѕС€РµРµ РѕСЃРІРµС‰РµРЅРёРµ вЂ” Р»СЋР±РѕР№ СЂР°Р·РјРµСЂ, СЃРѕР¶РјС‘Рј Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё"
          compressImage
        />
        <FileDrop
          id="c1-voice"
          accept="audio/*"
          file={voiceSample}
          onChange={setVoiceSample}
          label="РћР±СЂР°Р·РµС† РіРѕР»РѕСЃР°"
          hint="WAV/MP3, 10вЂ“20 СЃРµРєСѓРЅРґ С‡РёСЃС‚РѕР№ СЂРµС‡Рё Р±РµР· РјСѓР·С‹РєРё Рё С€СѓРјР°"
          compressAudio
        />

        <div className="field">
          <label>РўРµРєСЃС‚ РґР»СЏ РѕР·РІСѓС‡РєРё</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Р§С‚Рѕ РґРѕР»Р¶РµРЅ СЃРєР°Р·Р°С‚СЊ Р°РІР°С‚Р°СЂвЂ¦"
            required
          />
          {text.trim().length > 0 && (
            <span className={`hint ${overLimit ? 'hint-warn' : ''}`} style={{ textTransform: 'none' }}>
              РџСЂРёРјРµСЂРЅР°СЏ РґР»РёС‚РµР»СЊРЅРѕСЃС‚СЊ РѕР·РІСѓС‡РєРё: ~{estimatedSeconds.toFixed(1)} СЃРµРє
              {overLimit && ` вЂ” РїСЂРµРІС‹С€Р°РµС‚ Р»РёРјРёС‚ РІ ${MAX_CLIP_SECONDS} СЃРµРє, СЃРѕРєСЂР°С‚Рё С‚РµРєСЃС‚`}
            </span>
          )}
        </div>

        <div className="field">
          <label>Р­РјРѕС†РёСЏ</label>
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
          <label>РЇР·С‹Рє С‚РµРєСЃС‚Р°</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="ru">Р СѓСЃСЃРєРёР№</option>
            <option value="en">English</option>
          </select>
        </div>

        <button className="btn btn-primary btn-block" type="submit" disabled={!canSubmitFinal}>
          {submitting ? 'РћС‚РїСЂР°РІР»СЏРµРјвЂ¦' : 'РЎРіРµРЅРµСЂРёСЂРѕРІР°С‚СЊ РІРёРґРµРѕ'}
        </button>
      </form>
    </div>
  )
}
