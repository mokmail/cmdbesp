import { useRef } from 'react'
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
}) {
  const fileInputRef = useRef(null)

  return (
    <div className="mode-panel">
      <div className="row">
        <label>
          Choose file
          <select value={selectedFile} onChange={(event) => {
            setSelectedFile(event.target.value)
            setFilterColumn('')
            setFilterValues([])
            setSingleSearchColumn('all')
            setSingleFilterText('')
          }}>
            <option value="">Select a file</option>
            {originalLoadedNames.map((fileName) => (
              <option key={fileName} value={fileName}>
                {fileName}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="action-button" onClick={() => fileInputRef.current?.click()}>
          <Icon name="upload" size={20} /> Upload file
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            multiple
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </button>
        {selectedFileData && (
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
        )}
      </div>

      {uploadedFiles.length > 0 && (
        <div className="uploaded-files-list">
          {uploadedFiles.map((file) => (
            <span key={file.name} className="uploaded-file-tag">
              <Icon name="file" size={14} />
              {file.name}
              <button type="button" className="remove-file-btn" onClick={() => removeUploadedFile(file.name)} title="Remove file">
                <Icon name="close" size={14} />
              </button>
            </span>
          ))}
        </div>
      )}

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
          <Table columns={selectedFileData.columns} rows={filteredSingleRows} />
        </>
      ) : (
        <div className="landing-page">
          <div className="landing-hero-banner">
            <div className="landing-hero-grid" />
            <div className="landing-hero-content">
              <div className="landing-hero-badge">CMDB &middot; ESP &middot; Intelligence</div>
              <h2>Data Intelligence Platform</h2>
              <p>Created by Mohammed Kmail and Christoph Püler from the CIO department to analyze the IT infrastructure.</p>
              <div className="landing-hero-actions">
                <button type="button" className="landing-hero-btn landing-hero-btn-primary" onClick={() => fileInputRef.current?.click()}>
                  <Icon name="upload" size={20} /> Upload Files
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    multiple
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </button>
                <button type="button" className="landing-hero-btn" onClick={() => {
                  const select = document.querySelector('.mode-panel select')
                  if (select) select.focus()
                }}>
                  <Icon name="file" size={20} /> Browse Data
                </button>
              </div>
            </div>
            <div className="landing-hero-stats">
              <div className="landing-hero-stat">
                <span className="landing-hero-stat-number">{originalFileCount}</span>
                <span className="landing-hero-stat-label">Source Files</span>
              </div>
              <div className="landing-hero-stat">
                <span className="landing-hero-stat-number">{generatedFileCount}</span>
                <span className="landing-hero-stat-label">ID Files</span>
              </div>
              {uploadedFileCount > 0 && (
                <div className="landing-hero-stat landing-hero-stat-uploaded">
                  <span className="landing-hero-stat-number">{uploadedFileCount}</span>
                  <span className="landing-hero-stat-label">Uploaded</span>
                </div>
              )}
            </div>
          </div>

          <div className="landing-section">
            <h3>Quick actions</h3>
            <div className="landing-cards">
              <button type="button" className="landing-card" onClick={() => {
                const select = document.querySelector('.mode-panel select')
                if (select) select.focus()
              }}>
                <div className="landing-card-icon"><Icon name="file" size={28} /></div>
                <div className="landing-card-content">
                  <strong>Browse a File</strong>
                  <p>Select a file from the dropdown to explore, search, and filter its records.</p>
                </div>
              </button>
              <button type="button" className="landing-card" onClick={() => fileInputRef.current?.click()}>
                <div className="landing-card-icon"><Icon name="upload" size={28} /></div>
                <div className="landing-card-content">
                  <strong>Upload Your Own</strong>
                  <p>Upload CSV or Excel files to analyze alongside the pre-loaded CMDB data.</p>
                </div>
              </button>
              <button type="button" className="landing-card" onClick={() => setViewMode && setViewMode('Compare Files')}>
                <div className="landing-card-icon"><Icon name="compare" size={28} /></div>
                <div className="landing-card-content">
                  <strong>Compare Two Files</strong>
                  <p>Side-by-side comparison of generated ID files to find matching and divergent records.</p>
                </div>
              </button>
              <button type="button" className="landing-card" onClick={() => setViewMode && setViewMode('Compare Unique IDs')}>
                <div className="landing-card-icon"><Icon name="link" size={28} /></div>
                <div className="landing-card-content">
                  <strong>Match CMDB vs ESP</strong>
                  <p>Cross-reference CMDB records against ESP entries using generated UniqueID segments.</p>
                </div>
              </button>
            </div>
          </div>

          <div className="landing-section">
            <h3>How it works</h3>
            <div className="landing-steps">
              <div className="landing-step">
                <div className="landing-step-number">1</div>
                <div className="landing-step-body">
                  <strong>Pick a source file</strong>
                  <p>Choose a CMDB file from the dropdown or upload your own CSV/XLSX to begin.</p>
                </div>
              </div>
              <div className="landing-step">
                <div className="landing-step-number">2</div>
                <div className="landing-step-body">
                  <strong>Generate UniqueIDs</strong>
                  <p>Combine key columns (hostname, IP, location) into composite identifiers for record matching.</p>
                </div>
              </div>
              <div className="landing-step">
                <div className="landing-step-number">3</div>
                <div className="landing-step-body">
                  <strong>Compare & analyze</strong>
                  <p>Match records across systems, spot what's in sync, what's missing, and where gaps exist.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="landing-section">
            <h3>Key features</h3>
            <div className="landing-features">
              <div className="landing-feature">
                <Icon name="search" size={22} />
                <strong>Search & filter</strong>
                <span>Full-text search and column-level filtering across all records</span>
              </div>
              <div className="landing-feature">
                <Icon name="key" size={22} />
                <strong>UniqueID generator</strong>
                <span>Build composite IDs from any column combination with auto-save</span>
              </div>
              <div className="landing-feature">
                <Icon name="compare" size={22} />
                <strong>File comparison</strong>
                <span>Find matching, left-only, and right-only records between two datasets</span>
              </div>
              <div className="landing-feature">
                <Icon name="download" size={22} />
                <strong>Export results</strong>
                <span>Download filtered data as CSV or Excel for further processing</span>
              </div>
              <div className="landing-feature">
                <Icon name="upload" size={22} />
                <strong>Upload files</strong>
                <span>Bring your own CSV or Excel files for ad-hoc analysis</span>
              </div>
              <div className="landing-feature">
                <Icon name="chart" size={22} />
                <strong>Match statistics</strong>
                <span>See match rates, category breakdowns, and synchronization scores</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}