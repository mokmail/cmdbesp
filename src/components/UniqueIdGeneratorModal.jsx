import { useState } from 'react'
import { saveUniqueIdCsv, generateUniqueIds, parseGeneratedUniqueIdItems } from './shared'

export default function UniqueIdGeneratorModal({
  Icon,
  selectedFile,
  selectedFileData,
  uniqueIdColumns,
  setUniqueIdColumns,
  generatedUniqueIds,
  setGeneratedUniqueIds,
  onClose,
  onSaved,
}) {
  const [replaceFrom, setReplaceFrom] = useState('')
  const [replaceTo, setReplaceTo] = useState('')
  const [trimBeforeFirstDelimiter, setTrimBeforeFirstDelimiter] = useState('')
  const [escapeValues, setEscapeValues] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveResult, setSaveResult] = useState(null)

  const handleGenerate = async () => {
    if (uniqueIdColumns.length === 0) return
    const generated = generateUniqueIds(selectedFileData.rows, uniqueIdColumns, {
      replaceFrom,
      replaceTo,
      trimBeforeFirstDelimiter,
      escapeValues,
    })
    setGeneratedUniqueIds(generated)
    setSaveResult(null)
    await handleSaveGenerated(generated)
  }

  const handleSaveGenerated = async (ids) => {
    if (!ids) return
    setSaving(true)
    setSaveResult(null)
    try {
      await saveUniqueIdCsv(ids, selectedFileData.columns, selectedFile)
      setSaveResult('saved')
      if (onSaved) await onSaved()
    } catch (error) {
      setSaveResult('error')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const handleSave = () => handleSaveGenerated(generatedUniqueIds)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-large" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-section">
            <h2><Icon name="key" size={28} /> UniqueID Generator</h2>
            <p style={{margin: 0, marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)'}}>
              Combine selected columns to create unique identifiers for: <strong>{selectedFile}</strong>
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close modal"><Icon name="close" size={20} /></button>
        </div>

        <div className="modal-body modal-body-large" style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
          <div>
            <h3 style={{color: 'var(--accent)', marginBottom: '1rem', fontSize: '1rem'}}>Select Columns</h3>
            <div className="columns-checklist">
              {selectedFileData.columns
                  .filter((col) => col !== 'GeneratedUniqueID')
                  .map((col) => (
                    <label key={col} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={uniqueIdColumns.includes(col)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setUniqueIdColumns([...uniqueIdColumns, col])
                          } else {
                            setUniqueIdColumns(uniqueIdColumns.filter((c) => c !== col))
                          }
                          setGeneratedUniqueIds(null)
                        }}
                      />
                      <span>{col}</span>
                    </label>
                  ))}
            </div>
          </div>

          <div>
            <h3 style={{color: 'var(--accent)', marginBottom: '1rem', fontSize: '1rem'}}>Transform values</h3>
            <div style={{display: 'grid', gap: '0.75rem'}}>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                <label className="input-label" style={{display: 'grid', gap: '0.25rem'}}>
                  <span>Replace substring</span>
                  <input
                    type="text"
                    value={replaceFrom}
                    onChange={(e) => setReplaceFrom(e.target.value)}
                    placeholder="Search text"
                  />
                </label>
                <label className="input-label" style={{display: 'grid', gap: '0.25rem'}}>
                  <span>With</span>
                  <input
                    type="text"
                    value={replaceTo}
                    onChange={(e) => setReplaceTo(e.target.value)}
                    placeholder="Replacement text"
                  />
                </label>
              </div>
              <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem'}}>
                <label className="input-label" style={{display: 'grid', gap: '0.25rem'}}>
                  <span>Keep text before first</span>
                  <input
                    type="text"
                    value={trimBeforeFirstDelimiter}
                    onChange={(e) => setTrimBeforeFirstDelimiter(e.target.value)}
                    placeholder="Delimiter, e.g. ."
                  />
                </label>
              </div>
              <label className="checkbox-label" style={{marginTop: '0.5rem'}}>
                <input
                  type="checkbox"
                  checked={escapeValues}
                  onChange={(e) => setEscapeValues(e.target.checked)}
                />
                <span>Escape values for safe serialization</span>
              </label>
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="action-button"
              onClick={handleGenerate}
              disabled={uniqueIdColumns.length === 0 || saving}
            >
              <Icon name="key" size={20} /> {saving ? 'Saving...' : 'Generate & Save'}
            </button>
            {generatedUniqueIds && (
              <button
                type="button"
                className="action-button secondary"
                onClick={handleSave}
                disabled={saving}
              >
                <Icon name="save" size={20} /> {saving ? 'Saving...' : 'Save Again'}
              </button>
            )}
            {saveResult === 'saved' && (
              <span style={{ color: 'var(--success)', fontSize: '0.875rem', fontWeight: 500 }}>
                <Icon name="check" size={18} /> Saved to ID_generated/
              </span>
            )}
            {saveResult === 'error' && (
              <span style={{ color: 'var(--error)', fontSize: '0.875rem', fontWeight: 500 }}>
                <Icon name="warning" size={18} /> Save failed
              </span>
            )}
          </div>

          {generatedUniqueIds && (
            <div className="uniqueid-preview">
              <div className="preview-header">
                <strong>Preview (first 10 records):</strong>
                <button
                  type="button"
                  className="small-button"
                  onClick={handleSave}
                  disabled={saving}
                >
                  <Icon name="save" size={18} /> {saving ? 'Saving...' : 'Save Again'}
                </button>
              </div>
              <table className="preview-table">
                <thead>
                  <tr>
                    <th>Original ID</th>
                    <th>Generated UniqueID</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedUniqueIds.slice(0, 10).map((row, idx) => (
                    <tr key={idx}>
                      <td>{row.UniqueID || '(none)'}</td>
                      <td className="monospace">{JSON.stringify(parseGeneratedUniqueIdItems(row.GeneratedUniqueID))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="preview-info">
                Generated UniqueIDs for <strong>{generatedUniqueIds.length}</strong> records using columns: <code>{uniqueIdColumns.join(', ')}</code>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}