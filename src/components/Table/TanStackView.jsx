import React, { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table'

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

export default function TanStackView({
  columns,
  rows,
  highlightColumns = [],
  sortColumn,
  sortDirection,
  onSortChange,
  rowClass,
  onRowClick,
  paginationPageSize = 100,
}) {
  const [localSortColumn, setLocalSortColumn] = useState(null)
  const [localSortDirection, setLocalSortDirection] = useState(null)

  const isControlled = typeof onSortChange === 'function'
  const activeSortColumn = isControlled ? sortColumn : localSortColumn
  const activeSortDirection = isControlled ? sortDirection : localSortDirection

  const columnDefs = useMemo(() => {
    return columns.map((col) => {
      const field = typeof col === 'string' ? col : col.field
      const header = typeof col === 'string' ? col : (col.headerName || col.field)
      return {
        accessorKey: field,
        header: header,
        enableResizing: true,
      }
    })
  }, [columns])

  const data = useMemo(() => rows || [], [rows])

  const sorting = useMemo(() => {
    if (activeSortColumn) {
      return [{ id: activeSortColumn, desc: activeSortDirection === 'desc' }]
    }
    return []
  }, [activeSortColumn, activeSortDirection])

  const table = useReactTable({
    data,
    columns: columnDefs,
    state: {
      sorting,
    },
    onSortingChange: (updater) => {
      if (isControlled) {
        const newSort = typeof updater === 'function' ? updater({}) : updater
        if (newSort.length > 0) {
          onSortChange(newSort[0].id, newSort[0].desc ? 'desc' : 'asc')
        }
      } else {
        const newSort = typeof updater === 'function' ? updater({}) : updater
        if (newSort.length > 0) {
          setLocalSortColumn(newSort[0].id)
          setLocalSortDirection(newSort[0].desc ? 'desc' : 'asc')
        } else {
          setLocalSortColumn(null)
          setLocalSortDirection(null)
        }
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: paginationPageSize,
      },
    },
  })

  const handlePreviousPage = () => {
    table.previousPage()
  }

  const handleNextPage = () => {
    table.nextPage()
  }

  const handleFirstPage = () => {
    table.setPageIndex(0)
  }

  const handleLastPage = () => {
    table.setPageIndex(table.getPageCount() - 1)
  }

  const getRowClassName = (row) => {
    return rowClass ? rowClass(row.original) : ''
  }

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
      <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  style={{
                    border: '1px solid #ddd',
                    padding: '8px',
                    textAlign: 'left',
                    cursor: header.column.getCanSort() ? 'pointer' : 'default',
                    userSelect: 'none',
                  }}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === 'asc' && ' ↑'}
                    {header.column.getIsSorted() === 'desc' && ' ↓'}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className={getRowClassName(row)}
              onClick={onRowClick ? () => onRowClick(row.original) : undefined}
              style={{ cursor: onRowClick ? 'pointer' : 'default' }}
            >
              {row.getVisibleCells().map((cell) => {
                const colName = cell.column.id
                const isHighlighted = highlightColumns.includes(colName)
                return (
                  <td
                    key={cell.id}
                    className={isHighlighted ? 'highlighted-cell' : ''}
                    style={{
                      border: '1px solid #ddd',
                      padding: '8px',
                    }}
                  >
                    {renderCellContent(colName, cell.getValue(), row.original)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', marginTop: '8px' }}>
        <button onClick={handleFirstPage} disabled={!table.getCanPreviousPage()}>
          First
        </button>
        <button onClick={handlePreviousPage} disabled={!table.getCanPreviousPage()}>
          Previous
        </button>
        <span>
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </span>
        <button onClick={handleNextPage} disabled={!table.getCanNextPage()}>
          Next
        </button>
        <button onClick={handleLastPage} disabled={!table.getCanNextPage()}>
          Last
        </button>
      </div>
    </div>
  )
}