import { useMemo, useState } from 'react'
import Papa from 'papaparse'
import './App.css'

const VIEW_MODES = ['Single File', 'Compare Files', 'Compare Shares to ESP']

const normalizeHeader = (header) => header?.trim() ?? ''

const parseCsvFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result

      const parseText = (delimiter) =>
        Papa.parse(text, {
          header: true,
          delimiter,
          skipEmptyLines: true,
          transformHeader: normalizeHeader,
        })

      let parsed = parseText(';')
      if (!parsed.meta.fields || parsed.meta.fields.length <= 1) {
        parsed = parseText(',')
      }

      if (parsed.errors.length) {
        resolve({
          name: file.name,
          rows: parsed.data,
          columns: parsed.meta.fields || [],
          errors: parsed.errors,
        })
      } else {
        resolve({
          name: file.name,
          rows: parsed.data,
          columns: parsed.meta.fields || [],
          errors: [],
        })
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file, 'ISO-8859-1')
  })

const uniqueValues = (rows, column) =>
  Array.from(
    new Set(
      rows
        .map((row) => row[column])
        .filter((value) => value !== undefined && value !== null && String(value).trim() !== '')
    )
  ).sort((a, b) => String(a).localeCompare(String(b)))

const mergeRows = (rowsA, rowsB, mergeCol, fileA, fileB) => {
  const mapB = new Map()
  rowsB.forEach((row) => {
    const key = String(row[mergeCol] ?? '')
    if (!mapB.has(key)) mapB.set(key, [])
    mapB.get(key).push(row)
  })

  const merged = []
  const matchedB = new Set()
  const commonColumns = rowsA.length && rowsB.length ? Object.keys(rowsA[0]).filter((col) => Object.keys(rowsB[0]).includes(col)) : []
  const suffixA = (col) => (commonColumns.includes(col) && col !== mergeCol ? `${col} (${fileA})` : col)
  const suffixB = (col) => (commonColumns.includes(col) && col !== mergeCol ? `${col} (${fileB})` : col)

  rowsA.forEach((rowA) => {
    const key = String(rowA[mergeCol] ?? '')
    const matches = mapB.get(key)
    if (matches?.length) {
      matches.forEach((rowB) => {
        matchedB.add(key)
        const mergedRow = {}
        Object.keys(rowA).forEach((col) => {
          mergedRow[suffixA(col)] = rowA[col]
        })
        Object.keys(rowB).forEach((col) => {
          mergedRow[suffixB(col)] = rowB[col]
        })
        mergedRow[mergeCol] = key
        mergedRow._merge = 'both'
        merged.push(mergedRow)
      })
    } else {
      const mergedRow = {}
      Object.keys(rowA).forEach((col) => {
        mergedRow[suffixA(col)] = rowA[col]
      })
      mergedRow[mergeCol] = key
      mergedRow._merge = 'left_only'
      merged.push(mergedRow)
    }
  })

  rowsB.forEach((rowB) => {
    const key = String(rowB[mergeCol] ?? '')
    if (!matchedB.has(key)) {
      const mergedRow = {}
      Object.keys(rowB).forEach((col) => {
        mergedRow[suffixB(col)] = rowB[col]
      })
      mergedRow[mergeCol] = key
      mergedRow._merge = 'right_only'
      merged.push(mergedRow)
    }
  })

  const onlyInA = merged.filter((row) => row._merge === 'left_only')
  const onlyInB = merged.filter((row) => row._merge === 'right_only')
  const inBoth = merged.filter((row) => row._merge === 'both')

  return { merged, onlyInA, onlyInB, inBoth }
}

const compareSharesToEsp = (shares, esp) => {
  const espRows = esp.rows || []
  const espUniqueIDs = espRows.map((row) => String(row.UniqueID ?? '').toUpperCase())
  const espColumns = esp.columns.filter((col) => col !== 'UniqueID')

  const rows = shares.rows.map((row, index) => {
    const serverUpper = String(row.Server ?? '').toUpperCase()
    const shareUpper = String(row.Share ?? '').toUpperCase()
    const matchedUniqueIDs = new Set()
    const matchedValues = {}

    espRows.forEach((espRow) => {
      const uid = String(espRow.UniqueID ?? '').toUpperCase()
      const isServerMatch = serverUpper && uid.includes(serverUpper)
      const isShareMatch = shareUpper && uid.includes(shareUpper)
      if (isServerMatch || isShareMatch) {
        matchedUniqueIDs.add(espRow.UniqueID ?? '')
        espColumns.forEach((col) => {
          const value = String(espRow[col] ?? '')
          if (value !== '') {
            matchedValues[col] = matchedValues[col] ? `${matchedValues[col]} | ${value}` : value
          }
        })
      }
    })

    const serverFound = Boolean(serverUpper && espUniqueIDs.some((uid) => uid.includes(serverUpper)))
    const shareFound = Boolean(shareUpper && espUniqueIDs.some((uid) => uid.includes(shareUpper)))
    const matchStatus = serverFound && shareFound ? 'Both' : serverFound ? 'Server only' : shareFound ? 'Share only' : 'None'

    return {
      No: index + 1,
      ...row,
      ServerFound: serverFound ? 'Yes' : 'No',
      ShareFound: shareFound ? 'Yes' : 'No',
      MatchStatus: matchStatus,
      MatchedUniqueID: Array.from(matchedUniqueIDs).sort().join(', '),
      ...Object.fromEntries(espColumns.map((col) => [`ESP_${col}`, matchedValues[col] || ''])),
    }
  })

  return { rows, espColumns }
}

const Table = ({ columns, rows, highlightColumns = [] }) => (
  <div className="table-wrapper">
    <table>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column}>{column}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {columns.map((column) => {
              const value = row[column] ?? ''
              const isHighlight = highlightColumns.includes(column)
              const className = isHighlight && (value === 'Yes' || value === 'Both') ? 'cell-match' : isHighlight ? 'cell-no-match' : ''
              return (
                <td key={column} className={className}>
                  {String(value)}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

function App() {
  const [viewMode, setViewMode] = useState(VIEW_MODES[0])
  const [files, setFiles] = useState([])
  const [selectedFile, setSelectedFile] = useState('')
  const [compareA, setCompareA] = useState('')
  const [compareB, setCompareB] = useState('')
  const [mergeColumn, setMergeColumn] = useState('')
  const [filterColumn, setFilterColumn] = useState('')
  const [filterValues, setFilterValues] = useState([])
  const [compareFilterA, setCompareFilterA] = useState('')
  const [compareFilterB, setCompareFilterB] = useState('')
  const [compareFilterValuesA, setCompareFilterValuesA] = useState([])
  const [compareFilterValuesB, setCompareFilterValuesB] = useState([])
  const [showDifferences, setShowDifferences] = useState(false)
  const [selectedSharesFile, setSelectedSharesFile] = useState('parsed_fileshares.csv')
  const [selectedEspFile, setSelectedEspFile] = useState('ESP_20260416_with_ID.csv')
  const [error, setError] = useState('')

  const loadedNames = useMemo(() => files.map((file) => file.name), [files])
  const fileMap = useMemo(
    () => Object.fromEntries(files.map((file) => [file.name, file])),
    [files]
  )

  const selectedFileData = fileMap[selectedFile]
  const compareAData = fileMap[compareA]
  const compareBData = fileMap[compareB]
  const sharesData = fileMap[selectedSharesFile]
  const espData = fileMap[selectedEspFile]

  const filteredSingleRows = useMemo(() => {
    if (!selectedFileData || !filterColumn || !filterValues.length) return selectedFileData?.rows || []
    return selectedFileData.rows.filter((row) => filterValues.includes(row[filterColumn]))
  }, [selectedFileData, filterColumn, filterValues])

  const filteredCompareARows = useMemo(() => {
    if (!compareAData || !compareFilterA || !compareFilterValuesA.length) return compareAData?.rows || []
    return compareAData.rows.filter((row) => compareFilterValuesA.includes(row[compareFilterA]))
  }, [compareAData, compareFilterA, compareFilterValuesA])

  const filteredCompareBRows = useMemo(() => {
    if (!compareBData || !compareFilterB || !compareFilterValuesB.length) return compareBData?.rows || []
    return compareBData.rows.filter((row) => compareFilterValuesB.includes(row[compareFilterB]))
  }, [compareBData, compareFilterB, compareFilterValuesB])

  const commonColumns = useMemo(() => {
    if (!compareAData || !compareBData) return []
    return compareAData.columns.filter((col) => compareBData.columns.includes(col))
  }, [compareAData, compareBData])

  const compareResults = useMemo(() => {
    if (!compareAData || !compareBData || !mergeColumn) return null
    return mergeRows(filteredCompareARows, filteredCompareBRows, mergeColumn, compareAData.name, compareBData.name)
  }, [compareAData, compareBData, mergeColumn, filteredCompareARows, filteredCompareBRows])

  const shareComparison = useMemo(() => {
    if (!sharesData || !espData) return null
    return compareSharesToEsp(sharesData, espData)
  }, [sharesData, espData])

  const handleFilesSelected = async (event) => {
    const selected = Array.from(event.target.files || [])
    const parsedFiles = []
    setError('')

    for (const file of selected) {
      try {
        const parsed = await parseCsvFile(file)
        parsedFiles.push(parsed)
      } catch (parseError) {
        setError(`Failed to parse ${file.name}: ${parseError}`)
      }
    }

    setFiles((prev) => {
      const existingNames = new Set(prev.map((file) => file.name))
      return [...prev, ...parsedFiles.filter((file) => !existingNames.has(file.name))]
    })
  }

  const removeFile = (name) => setFiles((prev) => prev.filter((file) => file.name !== name))

  const renderFileSelector = () => (
    <div className="file-list">
      <h2>Loaded CSV files</h2>
      {files.length === 0 ? (
        <p>No files loaded yet.</p>
      ) : (
        <ul>
          {files.map((file) => (
            <li key={file.name}>
              <strong>{file.name}</strong> — {file.rows.length} rows, {file.columns.length} columns
              <button type="button" className="small-button" onClick={() => removeFile(file.name)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )

  return (
    <div className="app-shell">
      <header>
        <h1>CMDB ESP Dashboard (React)</h1>
        <p>Upload CSV files and use the same view modes as the Streamlit dashboard.</p>
        <p className="developer-info">Developed by the CMDB ESP team.</p>
      </header>

      <section className="upload-panel">
        <label className="upload-label">
          Upload CSV files
          <input type="file" accept=".csv" multiple onChange={handleFilesSelected} />
        </label>
        {error && <div className="error-box">{error}</div>}
      </section>

      <section className="tabs">
        {VIEW_MODES.map((mode) => (
          <button
            key={mode}
            className={mode === viewMode ? 'active' : ''}
            type="button"
            onClick={() => setViewMode(mode)}
          >
            {mode}
          </button>
        ))}
      </section>

      <div className="content">
        <aside>{renderFileSelector()}</aside>
        <main>
          {viewMode === 'Single File' && (
            <div className="mode-panel">
              <div className="row">
                <label>
                  Choose file
                  <select value={selectedFile} onChange={(event) => setSelectedFile(event.target.value)}>
                    <option value="">Select a file</option>
                    {loadedNames.map((fileName) => (
                      <option key={fileName} value={fileName}>
                        {fileName}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {selectedFileData ? (
                <>
                  <div className="metrics-row">
                    <div className="metric">Rows: {selectedFileData.rows.length}</div>
                    <div className="metric">Columns: {selectedFileData.columns.length}</div>
                    <div className="metric">Columns loaded: {selectedFileData.columns.join(', ')}</div>
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
                  </div>

                  <Table columns={selectedFileData.columns} rows={filteredSingleRows} />
                </>
              ) : (
                <p>Select a file to view its contents.</p>
              )}
            </div>
          )}

          {viewMode === 'Compare Files' && (
            <div className="mode-panel">
              <div className="row">
                <label>
                  File A
                  <select value={compareA} onChange={(event) => setCompareA(event.target.value)}>
                    <option value="">Select File A</option>
                    {loadedNames.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  File B
                  <select value={compareB} onChange={(event) => setCompareB(event.target.value)}>
                    <option value="">Select File B</option>
                    {loadedNames.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </label>
              </div>

              {compareAData && compareBData ? (
                <>
                  <div className="metrics-row">
                    <div className="metric">{compareAData.name}: {filteredCompareARows.length} rows</div>
                    <div className="metric">{compareBData.name}: {filteredCompareBRows.length} rows</div>
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
                        <div className="metric">In both: {compareResults.inBoth.length}</div>
                        <div className="metric">Only in {compareAData.name}: {compareResults.onlyInA.length}</div>
                        <div className="metric">Only in {compareBData.name}: {compareResults.onlyInB.length}</div>
                      </div>

                      <div className="tabs-row">
                        <button type="button" className="tab-button active">In both ({compareResults.inBoth.length})</button>
                        <button type="button" className="tab-button">Only in {compareAData.name} ({compareResults.onlyInA.length})</button>
                        <button type="button" className="tab-button">Only in {compareBData.name} ({compareResults.onlyInB.length})</button>
                      </div>

                      <Table columns={Object.keys(compareResults.inBoth[0] || {})} rows={compareResults.inBoth.slice(0, 200)} />
                      <Table columns={Object.keys(compareResults.onlyInA[0] || {})} rows={compareResults.onlyInA.slice(0, 200)} />
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
          )}

          {viewMode === 'Compare Shares to ESP' && (
            <div className="mode-panel">
              <div className="row">
                <label>
                  Shares file
                  <select value={selectedSharesFile} onChange={(event) => setSelectedSharesFile(event.target.value)}>
                    {loadedNames.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  ESP file
                  <select value={selectedEspFile} onChange={(event) => setSelectedEspFile(event.target.value)}>
                    {loadedNames.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </label>
              </div>

              {shareComparison ? (
                <>
                  <div className="metrics-row">
                    <div className="metric">Rows in shares file: {shareComparison.rows.length}</div>
                    <div className="metric">Matched servers: {shareComparison.rows.filter((r) => r.ServerFound === 'Yes').length}</div>
                    <div className="metric">Matched shares: {shareComparison.rows.filter((r) => r.ShareFound === 'Yes').length}</div>
                  </div>

                  <Table
                    columns={Object.keys(shareComparison.rows[0] || [])}
                    rows={shareComparison.rows}
                    highlightColumns={['ServerFound', 'ShareFound', 'MatchStatus']}
                  />
                </>
              ) : (
                <p>Select a shares file and an ESP file to compare.</p>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
