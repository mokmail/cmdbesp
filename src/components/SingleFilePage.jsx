import { useRef, useState } from 'react'
import ExportMenu from './ExportMenu'
import Table from './Table'
import { uniqueValues } from './shared'

export default function SingleFilePage({
  Icon,
  originalLoadedNames,
  selectedFile,
  setSelectedFile,
  selectedFileData,
  setUniqueIdColumns,
  setGeneratedUniqueIds,
  setShowUniqueIdModal,
  filterColumn,
  setFilterColumn,
  filterValues,
  setFilterValues,
  singleFilterText,
  setSingleFilterText,
  singleSearchColumn,
  setSingleSearchColumn,
  filteredSingleRows,
  singleFilterStats,
  setViewMode,
  originalFileCount,
  generatedFileCount,
  uploadedFiles,
  uploadedFileCount,
  handleFileUpload,
  removeUploadedFile,
  error,
  tableStyle,
  csvDelimiter,
  setCsvDelimiter,
  globalReplaceFrom,
  setGlobalReplaceFrom,
  globalReplaceTo,
  setGlobalReplaceTo,
}) {
  const fileInputRef = useRef(null)
  const dragCounter = useRef(0)

  const [pendingFiles, setPendingFiles] = useState([])
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (event) => {
    event.preventDefault()
    event.stopPropagation()
    dragCounter.current++
    setIsDragging(true)
  }

  const handleDragLeave = (event) => {
    event.preventDefault()
    event.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) {
      setIsDragging(false)
    }
  }

  const handleDrop = (event) => {
    event.preventDefault()
    event.stopPropagation()
    dragCounter.current = 0
    setIsDragging(false)
    const files = Array.from(event.dataTransfer.files || [])
    if (files.length > 0) {
      setPendingFiles(prev => [...prev, ...files])
    }
  }

  return (
    <div className="mode-panel">
      <div className="upload-split-panel">
        <div
          className={`upload-zone ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="upload-zone-icon">
            <Icon name="upload" size={28} />
          </div>
          <h3>Upload Area</h3>
          <p>Drag & drop files here or click to browse</p>
          <button type="button" className="upload-zone-browse">
            Browse Files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            multiple
            onChange={(event) => {
              const files = Array.from(event.target.files || [])
              if (files.length > 0) {
                setPendingFiles(prev => [...prev, ...files])
              }
              event.target.value = ''
            }}
            style={{ display: 'none' }}
          />
        </div>

        <div className="file-list-panel">
          <div className="file-list-header">
            <Icon name="folder" size={18} />
            <h4>Uploaded Files</h4>
            <span className="file-count">{uploadedFiles.length}</span>
          </div>
          
          {uploadedFiles.length === 0 ? (
            <div className="file-list-empty">
              No files uploaded yet
            </div>
          ) : (
            <div className="file-list">
              {uploadedFiles.map((file) => (
                <div key={file.name} className="file-item">
                  <div className="file-item-info">
                    <span className="file-item-icon">
                      <Icon name="file" size={18} />
                    </span>
                    <span className="file-item-name">{file.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className="file-status-badge ready">Ready</span>
                    <button
                      type="button"
                      className="file-item-remove"
                      onClick={() => removeUploadedFile(file.name)}
                      title="Remove file"
                    >
                      <Icon name="close" size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pendingFiles.length > 0 && (
            <div className="pending-files-section">
              <div className="pending-files-header">
                <h5>Pending Upload ({pendingFiles.length})</h5>
              </div>
              <div className="pending-files-list">
                {pendingFiles.map((file, index) => (
                  <span key={`${file.name}-${index}`} className="pending-file-tag">
                    <Icon name="file" size={14} />
                    {file.name}
                  </span>
                ))}
              </div>
              <button
                type="button"
                className="send-upload-btn"
                style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  if (pendingFiles.length > 0) {
                    handleFileUpload({ target: { files: pendingFiles } })
                    setPendingFiles([])
                  }
                }}
              >
                <Icon name="send" size={18} /> Upload {pendingFiles.length} File{pendingFiles.length > 1 ? 's' : ''}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="options-row">
        <label className="input-label">
          <span>CSV Delimiter</span>
          <select value={csvDelimiter} onChange={(e) => setCsvDelimiter(e.target.value)}>
            <option value="auto">Auto-detect</option>
            <option value=";">Semicolon (;)</option>
            <option value=",">Comma (,)</option>
            <option value="\t">Tab</option>
            <option value="|">Pipe (|)</option>
          </select>
        </label>
        <label className="input-label">
          <span>Replace</span>
          <input
            type="text"
            value={globalReplaceFrom}
            onChange={(e) => setGlobalReplaceFrom(e.target.value)}
            placeholder="Search text"
          />
        </label>
        <label className="input-label">
          <span>With</span>
          <input
            type="text"
            value={globalReplaceTo}
            onChange={(e) => setGlobalReplaceTo(e.target.value)}
            placeholder="Replacement"
          />
        </label>
        {(globalReplaceFrom || globalReplaceTo) && (
          <button
            type="button"
            className="small-button secondary"
            onClick={() => {
              setGlobalReplaceFrom('')
              setGlobalReplaceTo('')
            }}
            style={{ alignSelf: 'flex-end' }}
          >
            <Icon name="close" size={14} /> Clear
          </button>
        )}
      </div>

      <div className="file-selector-row">
        <label>
          <span>Select file to view</span>
          <select value={selectedFile} onChange={(e) => setSelectedFile(e.target.value)}>
            <option value="">-- Choose a file --</option>
            {uploadedFiles.map((file) => (
              <option key={file.name} value={file.name}>{file.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="toolbar-row">
        {selectedFileData ? (
          <button
            type="button"
            className="action-button"
            onClick={() => {
              setUniqueIdColumns([])
              setGeneratedUniqueIds(null)
              setShowUniqueIdModal(true)
            }}
          >
            <Icon name="key" size={20} /> UniqueID Generator
          </button>
        ) : (
          <span className="no-file-hint">Select a file to enable UniqueID Generator</span>
        )}
      </div>

      {error && <div className="error-box"><Icon name="warning" size={20} /> {error}</div>}

      {selectedFileData ? (
        <>
          <div className="metrics-row">
            <div className="metric">
              <strong style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.25rem' }}>{selectedFileData.rows.length.toLocaleString()}</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Total Rows</span>
            </div>
            <div className="metric">
              <strong style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.25rem' }}>{selectedFileData.columns.length}</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Columns</span>
            </div>
            <div className="metric" style={{ gridColumn: 'span 2' }}>
              <strong style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.25rem' }}>Available Columns</strong>
              <code style={{ fontSize: '0.75rem', display: 'block', whiteSpace: 'normal', wordBreak: 'break-word' }}>{selectedFileData.columns.join(', ')}</code>
            </div>
          </div>

          <div className="row">
            <label>
              Filter column
              <select value={filterColumn} onChange={(event) => {
                setFilterColumn(event.target.value)
                setFilterValues([])
              }}>
                <option value="">None</option>
                {selectedFileData.columns.map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </label>
            {filterColumn && (
              <label>
                Values
                <select multiple value={filterValues} onChange={(event) => setFilterValues(Array.from(event.target.selectedOptions, (option) => option.value))}>
                  {uniqueValues(selectedFileData.rows, filterColumn).map((value) => (
                    <option key={value} value={value}>{String(value)}</option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Search in
              <select value={singleSearchColumn} onChange={(event) => setSingleSearchColumn(event.target.value)}>
                <option value="all">All columns</option>
                {selectedFileData.columns.map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </label>
            <label>
              Search text
              <input
                type="text"
                value={singleFilterText}
                onChange={(event) => setSingleFilterText(event.target.value)}
                placeholder="Type to filter rows..."
              />
            </label>
            <button
              type="button"
              className="action-button secondary"
              onClick={() => {
                setFilterColumn('')
                setFilterValues([])
                setSingleSearchColumn('all')
                setSingleFilterText('')
              }}
            >
              <Icon name="refresh" size={20} /> Clear Filters
            </button>
            {singleFilterStats && (
              <div className="filter-stats" role="status" aria-live="polite">
                Showing <strong>{singleFilterStats.shownRows.toLocaleString()}</strong> of
                <strong>{singleFilterStats.totalRows.toLocaleString()}</strong> rows
                {' '}({singleFilterStats.shownPercent}%){singleFilterStats.hiddenRows > 0 ? ` · Hidden ${singleFilterStats.hiddenRows.toLocaleString()}` : ''}
              </div>
            )}
          </div>

          <div className="table-header-bar">
            <ExportMenu columns={selectedFileData.columns} rows={filteredSingleRows} filename={selectedFileData.name.replace(/\.csv$/i, '')} />
          </div>
          <Table columns={selectedFileData.columns} rows={filteredSingleRows} tableStyle={tableStyle} />
        </>
      ) : (
        <div className="landing-page">
        </div>
      )}
    </div>
  )
}