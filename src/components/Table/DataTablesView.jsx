import React, { useEffect, useMemo, useRef } from 'react'
import DataTable from 'datatables.net-react'
import 'datatables.net-dt/css/dataTables.dataTables.css'

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

const _renderCellContent = (column, value, row) => {
  if (column === 'MatchStatus') {
    if (value === 'Both') return 'Both'
    if (value === 'Only in left file') return 'Only in left file'
    if (value === 'Only in right file') return 'Only in right file'
    return String(value)
  }
  if ((column === 'left_GeneratedUniqueID' || column === 'right_GeneratedUniqueID') && row.MatchedSegments) {
    return highlightSegmentsInUID(String(value ?? ''), row.MatchedSegments)
  }
  return String(value ?? '')
}

const renderCellContent = (column, value, row) => {
  if (column === 'MatchStatus') {
    if (value === 'Both') return 'Both'
    if (value === 'Only in left file') return 'Only in left file'
    if (value === 'Only in right file') return 'Only in right file'
    return String(value)
  }
  if ((column === 'left_GeneratedUniqueID' || column === 'right_GeneratedUniqueID') && row.MatchedSegments) {
    return highlightSegmentsInUID(String(value ?? ''), row.MatchedSegments)
  }
  return String(value ?? '')
}

function DataTablesView({
  columns,
  rows,
  highlightColumns = [],
  onSortChange,
  onRowClick,
  paginationPageSize = 100,
}) {
  const dtRef = useRef(null)

  const dtColumns = useMemo(() =>
    columns.map((col) => ({
      title: col,
      data: col,
    })),
  [columns])

  const dtOptions = useMemo(() => ({
    paging: true,
    ordering: true,
    searching: true,
    pageLength: paginationPageSize,
    lengthMenu: [25, 50, 100, 250],
    columnDefs: columns.map((col, idx) => {
      const def = { targets: idx }
      if (highlightColumns.includes(col)) {
        def.className = 'highlight-col'
      }
      return def
    }),
  }), [columns, highlightColumns, paginationPageSize])

  useEffect(() => {
    if (dtRef.current) {
      const dt = dtRef.current.dt
      if (dt) {
        dt.on('order', (e, settings) => {
          if (onSortChange && settings.aaSorting.length > 0) {
            const sortedColIdx = settings.aaSorting[0][0]
            const colName = columns[sortedColIdx]
            onSortChange(colName)
          }
        })
        dt.on('click', 'tr', function () {
          const data = dt.row(this).data()
          if (data && onRowClick) {
            onRowClick(data)
          }
        })
      }
    }
  }, [rows, onSortChange, onRowClick, columns])

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
      <DataTable
        ref={dtRef}
        columns={dtColumns}
        data={rows}
        options={dtOptions}
        className="display"
      />
    </div>
  )
}

export { renderCellContent }
export default DataTablesView