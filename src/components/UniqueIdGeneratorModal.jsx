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
}) {
  const [replaceFrom, setReplaceFrom] = useState('')
  const [replaceTo, setReplaceTo] = useState('')
  const [trimBeforeFirstDelimiter, setTrimBeforeFirstDelimiter] = useState('')
  const [escapeValues, setEscapeValues] = useState(false)

  const handleGenerate = () => {
    if (uniqueIdColumns.length === 0) return
    const generated = generateUniqueIds(selectedFileData.rows, uniqueIdColumns, {
      replaceFrom,
      replaceTo,
      trimBeforeFirstDelimiter,
      escapeValues,
    })
    setGeneratedUniqueIds(generated)
  }

  const handleSave = async () => {
    if (!generatedUniqueIds) return
    try {
      await saveUniqueIdCsv(generatedUniqueIds, selectedFileData.columns, selectedFile)
    } catch (error) {
      alert(`Failed to save. Please ensure the Vite dev server is running.`)
      console.error(error)
    }
  }

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
              disabled={uniqueIdColumns.length === 0}
            >
              <Icon name="key" size={20} /> Generate UniqueID
            </button>
            {generatedUniqueIds && (
              <button
                type="button"
                className="action-button"
                onClick={handleSave}
              >
                <Icon name="save" size={20} /> Save CSV
              </button>
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
                >
                  <Icon name="save" size={18} /> Save Again
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