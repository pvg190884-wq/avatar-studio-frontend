import { useState } from 'react'
import { compressAudioFile, compressImageFile } from '../api'

export default function FileDrop({ id, accept, file, onChange, label, hint, placeholder, compressAudio, compressImage }) {
  const [processing, setProcessing] = useState(false)

  async function handleFileSelected(selected) {
    if (!selected) {
      onChange(null)
      return
    }
    if (compressAudio && selected.type.startsWith('audio/')) {
      setProcessing(true)
      try {
        onChange(await compressAudioFile(selected))
      } finally {
        setProcessing(false)
      }
    } else if (compressImage && selected.type.startsWith('image/')) {
      setProcessing(true)
      try {
        onChange(await compressImageFile(selected))
      } finally {
        setProcessing(false)
      }
    } else {
      onChange(selected)
    }
  }

  return (
    <div className="field">
      <label>{label} {hint && <span className="hint">вЂ” {hint}</span>}</label>
      <label htmlFor={id} className={`file-drop ${file ? 'has-file' : ''} ${processing ? 'processing' : ''}`}>
        <input
          id={id}
          type="file"
          accept={accept}
          disabled={processing}
          onChange={(e) => handleFileSelected(e.target.files?.[0] || null)}
        />
        {processing ? (
          <span className="placeholder">РћР±СЂР°Р±Р°С‚С‹РІР°РµРј С„Р°Р№Р»вЂ¦</span>
        ) : file ? (
          <span className="file-name">{file.name}</span>
        ) : (
          <span className="placeholder">{placeholder || 'РќР°Р¶РјРё, С‡С‚РѕР±С‹ РІС‹Р±СЂР°С‚СЊ С„Р°Р№Р»'}</span>
        )}
      </label>
    </div>
  )
}
