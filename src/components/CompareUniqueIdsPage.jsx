import ExportMenu from './ExportMenu'
import Table from './Table'

export default function CompareUniqueIdsPage({
  Icon,
  InlineIcon,
  SectionHeading,
  generatedLoadedNames,
  selectedSharesFile,
  setSelectedSharesFile,
  selectedEspFile,
  setSelectedEspFile,
  shareESPCategories,
  shareESPCategoriesSelected,
  setShareESPCategoriesSelected,
  shareComparison,
  shareStats,
  filteredShareRows,
  shareColumns,
  sharePaginatedRows,
  sharePage,
  setSharePage,
  shareTotalPages,
  sharePageSize,
  setSharePageSize,
  shareSortColumn,
  setShareSortColumn,
  shareSortDirection,
  setShareSortDirection,
  shareFilterText,
  setShareFilterText,
  shareSearchColumn,
  setShareSearchColumn,
  shareFilterStatus,
  setShareFilterStatus,
  shareFilterColumn,
  setShareFilterColumn,
  shareFilterColumnValues,
  setShareFilterColumnValues,
  shareFilterValuesOptions,
  shareTotalRows,
  selectedShareRow,
  setSelectedShareRow,
  sharesData,
  espData,
  sharesHasGeneratedId,
  espHasGeneratedId,
  shareFilterStats,
}) {
  return (
    <div className="mode-panel shares-esp-panel">
      <div className="row file-selection-row">
        <label>
          <span className="input-icon"><InlineIcon name="folder" size={18} /></span> CMDB file
          <select value={selectedSharesFile} onChange={(event) => { setSelectedSharesFile(event.target.value); setSharePage(1); }}>
            {generatedLoadedNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="input-icon"><InlineIcon name="chart" size={18} /></span> ESP file
          <select value={selectedEspFile} onChange={(event) => { setSelectedEspFile(event.target.value); setSharePage(1); }}>
            {generatedLoadedNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="typ-checkbox-row">
        <div className="typ-checkbox-group">
          <div className="typ-checkbox-header">
            <div className="typ-checkbox-title-wrap">
              <span className="typ-checkbox-title"><span className="input-icon"><InlineIcon name="tag" size={18} /></span> ESP Typ category</span>
              <span className="typ-checkbox-count">{shareESPCategoriesSelected.length ? `${shareESPCategoriesSelected.length} selected` : `${shareESPCategories.length} available`}</span>
            </div>
            <div className="typ-checkbox-summary">
              <span className="typ-summary-pill">
                <Icon name="check" size={16} /> {shareESPCategoriesSelected.length || 'All'} active
              </span>
              <span className="typ-summary-pill muted">
                <Icon name="target" size={16} /> {shareESPCategories.length} total
              </span>
            </div>
          </div>
          <div className="typ-checkbox-actions">
            <button
              type="button"
              className="small-button"
              onClick={() => {
                setShareESPCategoriesSelected(shareESPCategories)
                setSharePage(1)
              }}
              disabled={shareESPCategories.length === 0}
            >
              <Icon name="check" size={18} /> Select All
            </button>
            <button
              type="button"
              className="small-button"
              onClick={() => {
                setShareESPCategoriesSelected([])
                setSharePage(1)
              }}
            >
              <Icon name="refresh" size={18} /> Clear
            </button>
          </div>
          <div className="typ-checkbox-list">
            {shareESPCategories.length > 0 ? shareESPCategories.map((cat) => (
              <label key={cat} className={`typ-checkbox-item ${shareESPCategoriesSelected.includes(cat) ? 'selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={shareESPCategoriesSelected.includes(cat)}
                  onChange={(event) => {
                    setShareESPCategoriesSelected((previous) => {
                      if (event.target.checked) {
                        return Array.from(new Set([...previous, cat]))
                      }
                      return previous.filter((value) => value !== cat)
                    })
                    setSharePage(1)
                  }}
                />
                <span>{cat}</span>
              </label>
            )) : <span className="typ-checkbox-empty">No Typ values found</span>}
          </div>
          <div className="typ-checkbox-footer">
            Use these filters to narrow the ESP dataset before matching against CMDB.
          </div>
        </div>
        <div className="filter-stats">
          Typ filter: <strong>{shareESPCategoriesSelected.length ? `${shareESPCategoriesSelected.length} selected` : 'All'}</strong>
        </div>
      </div>

      {shareComparison && shareStats ? (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{shareStats.totalA.toLocaleString()}</div>
              <div className="stat-label">Rows in CMDB file</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{shareStats.totalB.toLocaleString()}</div>
              <div className="stat-label">
                {shareESPCategoriesSelected.length > 0 ? 'Rows in ESP file (Typ filtered)' : 'Rows in ESP file'}
              </div>
            </div>
            <div className="stat-card success">
              <div className="stat-value">{shareStats.both.toLocaleString()}</div>
              <div className="stat-label">Matched rows</div>
              <div className="stat-badge">{shareStats.overallMatchRate}%</div>
            </div>
            <div className="stat-card accent">
              <div className="stat-value">{shareStats.onlyInA.toLocaleString()}</div>
              <div className="stat-label">Only in CMDB</div>
            </div>
            <div className="stat-card accent">
              <div className="stat-value">{shareStats.onlyInB.toLocaleString()}</div>
              <div className="stat-label">Only in ESP</div>
            </div>
          </div>

          <div className="filters-bar">
            <div className="filter-group">
              <label>
                <span className="input-icon"><InlineIcon name="search" size={18} /></span> Search
                <input
                  type="text"
                  placeholder="Filter rows..."
                  value={shareFilterText}
                  onChange={(e) => { setShareFilterText(e.target.value); setSharePage(1); }}
                />
              </label>
            </div>
            <div className="filter-group">
              <label>
                <span className="input-icon"><InlineIcon name="compass" size={18} /></span> Search Column
                <select value={shareSearchColumn} onChange={(e) => { setShareSearchColumn(e.target.value); setSharePage(1); }}>
                  <option value="all">All columns</option>
                  {shareColumns.map((column) => (
                    <option key={column} value={column}>{column}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="filter-group">
              <label>
                <span className="input-icon"><InlineIcon name="tag" size={18} /></span> Match Status
                <select value={shareFilterStatus} onChange={(e) => { setShareFilterStatus(e.target.value); setSharePage(1); }}>
                  <option value="all">All Statuses</option>
                  <option value="Both">Both</option>
                  <option value="Only in CMDB">Only in CMDB</option>
                  <option value="Only in right file">Only in ESP</option>
                </select>
              </label>
            </div>
            <div className="filter-group">
              <label>
                <span className="input-icon"><InlineIcon name="database" size={18} /></span> Filter Column
                <select value={shareFilterColumn} onChange={(e) => {
                  setShareFilterColumn(e.target.value)
                  setShareFilterColumnValues([])
                  setSharePage(1)
                }}>
                  <option value="all">None</option>
                  {shareColumns.map((column) => (
                    <option key={column} value={column}>{column}</option>
                  ))}
                </select>
              </label>
            </div>
            {shareFilterColumn !== 'all' && (
              <div className="filter-group">
                <label>
                  <span className="input-icon"><InlineIcon name="target" size={18} /></span> Filter Values
                  <select multiple value={shareFilterColumnValues} onChange={(e) => setShareFilterColumnValues(Array.from(e.target.selectedOptions, (option) => option.value))}>
                    {shareFilterValuesOptions.map((value) => (
                      <option key={value} value={value}>{String(value)}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}
            <div className="filter-group">
              <label>
                <span className="input-icon"><InlineIcon name="page" size={18} /></span> Page Size
                <select value={sharePageSize} onChange={(e) => { setSharePageSize(Number(e.target.value)); setSharePage(1); }}>
                  <option value={25}>25 rows</option>
                  <option value={50}>50 rows</option>
                  <option value={100}>100 rows</option>
                  <option value={250}>250 rows</option>
                </select>
              </label>
            </div>
            <div className="filter-stats">
              Showing <strong>{filteredShareRows.length.toLocaleString()}</strong> of <strong>{shareTotalRows.toLocaleString()}</strong> rows
            </div>
          </div>

          <div className="table-section">
            <div className="table-note">
              <span>Click any row to view details</span>
              <ExportMenu columns={shareColumns} rows={filteredShareRows} filename={`${selectedSharesFile.replace(/\.csv$/i, '')}_comparison`} />
            </div>
            <Table
              columns={shareColumns}
              rows={sharePaginatedRows}
              highlightColumns={['MatchStatus', 'CMDB_GeneratedUniqueID', 'ESP_GeneratedUniqueID']}
              sortColumn={shareSortColumn}
              sortDirection={shareSortDirection}
              onSortChange={(column) => {
                setShareSortColumn((previousColumn) => {
                  if (previousColumn === column) {
                    setShareSortDirection((previousDirection) => (previousDirection === 'asc' ? 'desc' : 'asc'))
                    return previousColumn
                  }
                  setShareSortDirection('asc')
                  return column
                })
              }}
              rowClass={(row) => {
                if (row.MatchStatus === 'Both') return 'row-status-both'
                if (row.MatchStatus === 'Only in CMDB') return 'row-status-left'
                if (row.MatchStatus === 'Only in right file') return 'row-status-right'
                return undefined
              }}
              onRowClick={(row) => setSelectedShareRow(row)}
            />
          </div>

          <div className="pagination-bar">
            <div className="pagination-info">
              Page <strong>{sharePage}</strong> of <strong>{shareTotalPages}</strong>
            </div>
            <div className="pagination-controls">
              <button
                className="page-btn"
                onClick={() => setSharePage(1)}
                disabled={sharePage === 1}
                title="First page"
              >
                <Icon name="first" size={16} />
              </button>
              <button
                className="page-btn"
                onClick={() => setSharePage((p) => Math.max(1, p - 1))}
                disabled={sharePage === 1}
                title="Previous page"
              >
                <Icon name="prev" size={16} />
              </button>
              <div className="page-numbers">
                {Array.from({ length: Math.min(5, shareTotalPages) }, (_, i) => {
                  let pageNum
                  if (shareTotalPages <= 5) {
                    pageNum = i + 1
                  } else if (sharePage <= 3) {
                    pageNum = i + 1
                  } else if (sharePage >= shareTotalPages - 2) {
                    pageNum = shareTotalPages - 4 + i
                  } else {
                    pageNum = sharePage - 2 + i
                  }
                  return (
                    <button
                      key={pageNum}
                      className={`page-num ${pageNum === sharePage ? 'active' : ''}`}
                      onClick={() => setSharePage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>
              <button
                className="page-btn"
                onClick={() => setSharePage((p) => Math.min(shareTotalPages, p + 1))}
                disabled={sharePage === shareTotalPages}
                title="Next page"
              >
                <Icon name="next" size={16} />
              </button>
              <button
                className="page-btn"
                onClick={() => setSharePage(shareTotalPages)}
                disabled={sharePage === shareTotalPages}
                title="Last page"
              >
                <Icon name="last" size={16} />
              </button>
            </div>
            <div className="pagination-jump">
              <input
                type="number"
                min={1}
                max={shareTotalPages}
                placeholder="Go to..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const page = Math.min(shareTotalPages, Math.max(1, Number(e.target.value)))
                    setSharePage(page)
                    e.target.value = ''
                  }
                }}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-icon"><Icon name="link" size={52} /></div>
          <h3>Compare UniqueIDs</h3>
          <p>
            {sharesData && espData && (!sharesHasGeneratedId || !espHasGeneratedId)
              ? 'Comparison is based on GeneratedUniqueID only. Please select files that contain the GeneratedUniqueID column.'
              : 'Select two files with GeneratedUniqueID values to compare them using substring matches and identify rows missing from either file.'}
          </p>
        </div>
      )}

      {selectedShareRow && (
        <ShareDetailModal
          Icon={Icon}
          SectionHeading={SectionHeading}
          selectedShareRow={selectedShareRow}
          onClose={() => setSelectedShareRow(null)}
        />
      )}
    </div>
  )
}

function ShareDetailModal({ Icon, SectionHeading, selectedShareRow, onClose }) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-card modal-large" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-section">
            <h2>Match Details & Analysis</h2>
            <div className={`match-badge match-${selectedShareRow.MatchStatus === 'Both' ? 'both' : selectedShareRow.MatchStatus === 'Only in CMDB' ? 'left' : 'right'}`}>
              {selectedShareRow.MatchStatus}
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close modal"><Icon name="close" size={20} /></button>
        </div>
        <div className="modal-body modal-body-large">
          <div className="modal-section">
            <SectionHeading icon="chart">Match Summary</SectionHeading>
            <div className="match-summary-grid">
              <div className="summary-item">
                <span className="label">Status</span>
                <span className={`badge badge-${selectedShareRow.MatchStatus === 'Both' ? 'success' : selectedShareRow.MatchStatus === 'Only in CMDB' ? 'info' : 'error'}`}>
                  {selectedShareRow.MatchStatus}
                </span>
              </div>
              <div className="summary-item">
                <span className="label">Matched Segments</span>
                <span className="value">{selectedShareRow.MatchedSegments || 'None'}</span>
              </div>
              <div className="summary-item">
                <span className="label">CMDB GeneratedUniqueID</span>
                <code className="uid-code">{selectedShareRow.CMDB_GeneratedUniqueID || '—'}</code>
              </div>
              <div className="summary-item">
                <span className="label">ESP GeneratedUniqueID</span>
                <code className="uid-code">{selectedShareRow.ESP_GeneratedUniqueID || '—'}</code>
              </div>
            </div>
          </div>

          <div className="modal-section">
            <SectionHeading icon="compare">Data Comparison</SectionHeading>
            <div className="comparison-grid">
              <div className="comparison-side cmdb-side">
                <div className="side-header"><Icon name="folder" size={18} /> CMDB Virtual Server</div>
                <div className="field-list">
                  {Object.entries(selectedShareRow)
                    .filter(([key]) => key.startsWith('CMDB_'))
                    .map(([key, value]) => (
                      <div key={key} className="comparison-field">
                        <div className="field-label">{key.replace('CMDB_', '')}</div>
                        <div className="field-value">{String(value) || '—'}</div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="comparison-side esp-side">
                <div className="side-header"><Icon name="chart" size={18} /> ESP Data</div>
                <div className="field-list">
                  {Object.entries(selectedShareRow)
                    .filter(([key]) => key.startsWith('ESP_'))
                    .map(([key, value]) => (
                      <div key={key} className="comparison-field">
                        <div className="field-label">{key.replace('ESP_', '')}</div>
                        <div className="field-value">{String(value) || '—'}</div>
                      </div>
                    ))}
                  {Object.entries(selectedShareRow).filter(([key]) => key.startsWith('ESP_')).length === 0 && (
                    <div className="empty-state">No matching ESP data</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {selectedShareRow.MatchStatus === 'Both' && (
            <div className="modal-section">
              <SectionHeading icon="check">Match Information</SectionHeading>
              <div className="match-info-box">
                <p>
                  <strong>Matched Segments:</strong> {selectedShareRow.MatchedSegments}
                </p>
                <p>
                  This row is present in both files. The highlighted segments in the UniqueIDs indicate the common identifiers found in both sources.
                </p>
              </div>
            </div>
          )}

          {selectedShareRow.MatchStatus === 'Only in CMDB' && (
            <div className="modal-section">
              <SectionHeading icon="warning">Left-Only Information</SectionHeading>
              <div className="mismatch-info-box">
                <p>
                  <strong>Finding:</strong> This CMDB Virtual Server entry exists but has no matching record in the ESP system.
                </p>
                <div className="action-suggestions">
                  <strong>Possible Actions:</strong>
                  <ul>
                    <li>Review if this server should be added to ESP monitoring</li>
                    <li>Verify if the server is still in use</li>
                    <li>Check if UniqueID format is consistent</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {selectedShareRow.MatchStatus === 'Only in right file' && (
            <div className="modal-section">
              <SectionHeading icon="warning">Right-Only Information</SectionHeading>
              <div className="mismatch-info-box">
                <p>
                  <strong>Finding:</strong> This ESP entry exists but has no matching record in the CMDB Virtual Server data.
                </p>
                <div className="action-suggestions">
                  <strong>Possible Actions:</strong>
                  <ul>
                    <li>Check if this ESP entry should be added to CMDB</li>
                    <li>Verify if the server is still in the infrastructure</li>
                    <li>Review naming conventions and UniqueID formats</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="modal-section">
            <SectionHeading icon="file">All Fields</SectionHeading>
            <div className="fields-ref-grid">
              {Object.entries(selectedShareRow)
                .filter(([key]) => !key.startsWith('CMDB_') && !key.startsWith('ESP_'))
                .map(([key, value]) => (
                  <div key={key} className="ref-field">
                    <div className="ref-label">{key}</div>
                    <div className="ref-value">{String(value)}</div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}