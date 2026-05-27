import React from 'react'
import { AgGridReact, AgGridProvider } from 'ag-grid-react'
import { AllCommunityModule, themeQuartz } from 'ag-grid-community'

const modules = [AllCommunityModule]

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

const MatchStatusCellRenderer = (params) => {
  const value = params.value
  if (value === 'Both') return 'Both'
  if (value === 'Only in left file') return 'Only in left file'
  if (value === 'Only in right file') return 'Only in right file'
  return String(value)
}

const UIDCellRenderer = (params) => {
  const uid = params.value
  const matchedSegmentsStr = params.data?.MatchedSegments
  if (!matchedSegmentsStr) return uid
  return highlightSegmentsInUID(uid, matchedSegmentsStr)
}

const LeftUIDCellRenderer = (params) => UIDCellRenderer(params, 'left')
const RightUIDCellRenderer = (params) => UIDCellRenderer(params, 'right')

export default function AGGridView({
  columns,
  rows,
  highlightColumns = [],
  onSortChange,
  rowClass,
  onRowClick,
  pagination = true,
  paginationPageSize = 100,
}) {
  const getCellClass = (column) => {
    return highlightColumns.includes(column) ? 'highlighted-cell' : ''
  }

  const defaultColDef = {
    resizable: true,
    sortable: true,
    filter: true,
    minWidth: 80,
  }

  const processedColumns = columns.map((col) => {
    const colDef = {
      field: col,
      headerName: col,
      cellClass: getCellClass(col),
    }

    if (col === 'MatchStatus') {
      colDef.cellRenderer = MatchStatusCellRenderer
    } else if (col === 'left_GeneratedUniqueID') {
      colDef.cellRenderer = LeftUIDCellRenderer
    } else if (col === 'right_GeneratedUniqueID') {
      colDef.cellRenderer = RightUIDCellRenderer
    }

    return colDef
  })

  const getRowClass = (params) => {
    return rowClass ? rowClass(params.data) : undefined
  }

  const onSortChanged = (event) => {
    if (onSortChange && event.api.getColumnState().length > 0) {
      const sortState = event.api.getColumnState().find((col) => col.sort != null)
      if (sortState) {
        onSortChange(sortState.colId, sortState.sort === 'asc' ? 'asc' : 'desc')
      }
    }
  }

  return (
    <div style={{ width: '100%', height: '600px' }}>
      <AgGridProvider modules={modules}>
        <AgGridReact
          columnDefs={processedColumns}
          defaultColDef={defaultColDef}
          rowData={rows}
          pagination={pagination}
          paginationPageSize={paginationPageSize}
          getRowClass={getRowClass}
          onRowClicked={onRowClick ? (params) => onRowClick(params.data) : undefined}
          onSortChanged={onSortChanged}
          animateRows={true}
          suppressCellFocus={true}
          theme={themeQuartz}
        />
      </AgGridProvider>
    </div>
  )
}