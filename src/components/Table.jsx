import { useMemo, useState } from 'react'

const highlightSegmentsInUID = (uid, matchedSegmentsStr) => {
  if (!uid || !matchedSegmentsStr) return uid

  const segments = matchedSegmentsStr.split(',').map((s) => s.trim()).filter((s) => s.length > 0)
  if (segments.length === 0) return uid

  const uidStr = String(uid)
  const result = []
  let lastIndex = 0

  const positions = []
  segments.forEach((seg) => {
    let idx = uidStr.indexOf(seg)
    while (idx >= 0) {
      positions.push({ start: idx, end: idx + seg.length, text: seg })
      idx = uidStr.indexOf(seg, idx + 1)
    }
  })

  positions.sort((a, b) => a.start - b.start)

  const merged = []
  for (const pos of positions) {
    if (merged.length === 0 || merged[merged.length - 1].end < pos.start) {
      merged.push({ ...pos })
    } else {
      const last = merged[merged.length - 1]
      last.end = Math.max(last.end, pos.end)
      last.text += pos.text
    }
  }

  lastIndex = 0
  for (const seg of merged) {
    if (seg.start > lastIndex) {
      result.push(uidStr.slice(lastIndex, seg.start))
    }
    result.push(<mark key={seg.start} style={{ backgroundColor: '#fef08a', padding: '0 2px' }}>{seg.text}</mark>)
    lastIndex = seg.end
  }
  if (lastIndex < uidStr.length) {
    result.push(uidStr.slice(lastIndex))
  }

  return result.length > 0 ? result : uid
}

export default function Table({
  columns,
  rows,
  highlightColumns = [],
  sortColumn,
  sortDirection,
  onSortChange,
  rowClass,
  onRowClick,
}) {
  const [localSortColumn, setLocalSortColumn] = useState('')
  const [localSortDirection, setLocalSortDirection] = useState('asc')

  const isControlled = typeof onSortChange === 'function'
  const activeSortColumn = isControlled ? sortColumn : localSortColumn
  const activeSortDirection = isControlled ? sortDirection : localSortDirection

  const sortedRows = useMemo(() => {
    if (!activeSortColumn) return rows

    return [...rows].sort((left, right) => {
      const leftVal = String(left?.[activeSortColumn] ?? '').trim()
      const rightVal = String(right?.[activeSortColumn] ?? '').trim()
      const comparison = leftVal.localeCompare(rightVal, undefined, { numeric: true, sensitivity: 'base' })
      return activeSortDirection === 'asc' ? comparison : -comparison
    })
  }, [rows, activeSortColumn, activeSortDirection])

  const handleSort = (column) => {
    if (isControlled) {
      onSortChange(column)
      return
    }
    if (localSortColumn === column) {
      setLocalSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setLocalSortColumn(column)
      setLocalSortDirection('asc')
    }
  }

  const renderCellContent = (column, value, row) => {
    if (column === 'MatchStatus') {
      if (value === 'Both') return 'Both'
      if (value === 'Only in CMDB') return 'Only in CMDB'
      if (value === 'Only in right file') return 'Only in ESP'
      return String(value)
    }

    if ((column === 'CMDB_GeneratedUniqueID' || column === 'ESP_GeneratedUniqueID') && row.MatchedSegments) {
      return highlightSegmentsInUID(String(value ?? ''), row.MatchedSegments)
    }

    return String(value ?? '')
  }

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                className={[
                  highlightColumns.includes(col) ? 'highlight-col' : '',
                  activeSortColumn === col ? `sort-${activeSortDirection}` : '',
                ].filter(Boolean).join(' ')}
                onClick={() => handleSort(col)}
              >
                {col}
                {activeSortColumn === col && (
                  <span className="sort-indicator">{activeSortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, idx) => (
            <tr
              key={idx}
              className={rowClass?.(row)}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td key={col}>{renderCellContent(col, row[col], row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}