export default function FileDrop({ id, accept, file, onChange, label, hint, placeholder }) {
  return (
    <div className="field">
      <label>{label} {hint && <span className="hint">— {hint}</span>}</label>
      <label htmlFor={id} className={`file-drop ${file ? 'has-file' : ''}`}>
        <input
          id={id}
          type="file"
          accept={accept}
          onChange={(e) => onChange(e.target.files?.[0] || null)}
        />
        {file ? (
          <span className="file-name">{file.name}</span>
        ) : (
          <span className="placeholder">{placeholder || 'Нажми, чтобы выбрать файл'}</span>
        )}
      </label>
    </div>
  )
}
