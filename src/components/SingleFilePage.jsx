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
}) {
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
        <p>Select a file to view its contents.</p>
      )}
    </div>
  )
}