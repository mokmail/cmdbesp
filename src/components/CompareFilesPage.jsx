import ExportMenu from './ExportMenu'
import Table from './Table'
import { uniqueValues, mergeRows } from './shared'

export default function CompareFilesPage({
  Icon,
  generatedLoadedNames,
  compareA,
  setCompareA,
  compareB,
  setCompareB,
  compareAData,
  compareBData,
  filteredCompareARows,
  filteredCompareBRows,
  commonColumns,
  compareFilterA,
  setCompareFilterA,
  compareFilterValuesA,
  setCompareFilterValuesA,
  compareFilterB,
  setCompareFilterB,
  compareFilterValuesB,
  setCompareFilterValuesB,
  mergeColumn,
  setMergeColumn,
  showDifferences,
  setShowDifferences,
  compareResults,
}) {
  return (
    <div className="mode-panel">
      <div className="row">
        <label>
          File A
          <select value={compareA} onChange={(event) => setCompareA(event.target.value)}>
            <option value="">Select File A</option>
            {generatedLoadedNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </label>
        <label>
          File B
          <select value={compareB} onChange={(event) => setCompareB(event.target.value)}>
            <option value="">Select File B</option>
            {generatedLoadedNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </label>
      </div>

      {compareAData && compareBData ? (
        <>
          <div className="metrics-row">
            <div className="metric">
              <strong style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.25rem' }}>{filteredCompareARows.length.toLocaleString()}</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{compareAData.name}</span>
            </div>
            <div className="metric">
              <strong style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.25rem' }}>{filteredCompareBRows.length.toLocaleString()}</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{compareBData.name}</span>
            </div>
          </div>

          <div className="row">
            <div className="summary-box">
              <strong>Common columns</strong>
              <div>{commonColumns.length ? commonColumns.join(', ') : 'None'}</div>
            </div>
            <div className="summary-box">
              <strong>Only in {compareAData.name}</strong>
              <div>{compareAData.columns.filter((col) => !compareBData.columns.includes(col)).join(', ') || 'None'}</div>
            </div>
            <div className="summary-box">
              <strong>Only in {compareBData.name}</strong>
              <div>{compareBData.columns.filter((col) => !compareAData.columns.includes(col)).join(', ') || 'None'}</div>
            </div>
          </div>

          <div className="row">
            <label>
              Merge column
              <select value={mergeColumn} onChange={(event) => setMergeColumn(event.target.value)}>
                <option value="">Select merge column</option>
                {commonColumns.map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="row">
            <label>
              Filter File A
              <select value={compareFilterA} onChange={(event) => {
                setCompareFilterA(event.target.value)
                setCompareFilterValuesA([])
              }}>
                <option value="">None</option>
                {compareAData.columns.map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </label>
            {compareFilterA && (
              <label>
                Values
                <select multiple value={compareFilterValuesA} onChange={(event) => setCompareFilterValuesA(Array.from(event.target.selectedOptions, (option) => option.value))}>
                  {uniqueValues(compareAData.rows, compareFilterA).map((value) => (
                    <option key={value} value={value}>{String(value)}</option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <div className="row">
            <label>
              Filter File B
              <select value={compareFilterB} onChange={(event) => {
                setCompareFilterB(event.target.value)
                setCompareFilterValuesB([])
              }}>
                <option value="">None</option>
                {compareBData.columns.map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </label>
            {compareFilterB && (
              <label>
                Values
                <select multiple value={compareFilterValuesB} onChange={(event) => setCompareFilterValuesB(Array.from(event.target.selectedOptions, (option) => option.value))}>
                  {uniqueValues(compareBData.rows, compareFilterB).map((value) => (
                    <option key={value} value={value}>{String(value)}</option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {compareResults && mergeColumn && (
            <>
              <div className="metrics-row">
                <div className="metric"><Icon name="check" size={20} /> In both: {compareResults.inBoth.length}</div>
                <div className="metric"><Icon name="file" size={20} /> Only in {compareAData.name}: {compareResults.onlyInA.length}</div>
                <div className="metric"><Icon name="file" size={20} /> Only in {compareBData.name}: {compareResults.onlyInB.length}</div>
              </div>

              <div className="tabs-row">
                <button type="button" className="tab-button active">In both ({compareResults.inBoth.length})</button>
                <button type="button" className="tab-button">Only in {compareAData.name} ({compareResults.onlyInA.length})</button>
                <button type="button" className="tab-button">Only in {compareBData.name} ({compareResults.onlyInB.length})</button>
              </div>

              <div className="table-header-bar">
                <ExportMenu columns={Object.keys(compareResults.inBoth[0] || {})} rows={compareResults.inBoth} filename={`${compareAData.name.replace(/\.csv$/i, '')}_vs_${compareBData.name.replace(/\.csv$/i, '')}_in_both`} />
              </div>
              <Table columns={Object.keys(compareResults.inBoth[0] || {})} rows={compareResults.inBoth.slice(0, 200)} />
              <div className="table-header-bar">
                <ExportMenu columns={Object.keys(compareResults.onlyInA[0] || {})} rows={compareResults.onlyInA} filename={`${compareAData.name.replace(/\.csv$/i, '')}_vs_${compareBData.name.replace(/\.csv$/i, '')}_only_in_${compareAData.name.replace(/\.csv$/i, '')}`} />
              </div>
              <Table columns={Object.keys(compareResults.onlyInA[0] || {})} rows={compareResults.onlyInA.slice(0, 200)} />
              <div className="table-header-bar">
                <ExportMenu columns={Object.keys(compareResults.onlyInB[0] || {})} rows={compareResults.onlyInB} filename={`${compareAData.name.replace(/\.csv$/i, '')}_vs_${compareBData.name.replace(/\.csv$/i, '')}_only_in_${compareBData.name.replace(/\.csv$/i, '')}`} />
              </div>
              <Table columns={Object.keys(compareResults.onlyInB[0] || {})} rows={compareResults.onlyInB.slice(0, 200)} />

              <label className="checkbox-row">
                <input type="checkbox" checked={showDifferences} onChange={(event) => setShowDifferences(event.target.checked)} />
                Highlight differences in shared rows
              </label>
              {showDifferences && compareResults.inBoth.length > 0 && (
                <div className="differences">
                  {compareAData.columns.filter((col) => col !== mergeColumn && compareBData.columns.includes(col)).map((col) => {
                    const aKey = `${col} (${compareAData.name})`
                    const bKey = `${col} (${compareBData.name})`
                    const diffRows = compareResults.inBoth.filter((row) => String(row[aKey] ?? '') !== String(row[bKey] ?? ''))
                    return diffRows.length ? (
                      <div key={col} className="difference-section">
                        <h3>Differences in {col} ({diffRows.length} rows)</h3>
                        <Table columns={[mergeColumn, aKey, bKey]} rows={diffRows.slice(0, 200)} />
                      </div>
                    ) : null
                  })}
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <p>Select both files to compare and then choose a merge column.</p>
      )}
    </div>
  )
}