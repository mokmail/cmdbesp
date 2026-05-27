# Table Library Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate three modern table libraries (AG Grid, TanStack Table, DataTables) with a global style selector that persists to localStorage.

**Architecture:** Replace the custom `Table.jsx` with a multi-style wrapper that renders the selected table library view. Each view implements the same features: sorting, filtering, column resizing/reordering, pinning, row selection, and pagination. The selected style persists to localStorage under `preferredTableStyle`.

**Tech Stack:** AG Grid, TanStack Table v8, DataTables.net, React 19, Vite

---

## File Structure

```
src/
├── App.jsx                      # Add tableStyle state + global selector
├── components/
│   ├── Table/
│   │   ├── index.jsx            # Multi-style wrapper (replaces Table.jsx)
│   │   ├── AGGridView.jsx       # AG Grid implementation
│   │   ├── TanStackView.jsx     # TanStack Table implementation
│   │   └── DataTablesView.jsx   # DataTables implementation
│   ├── Table.jsx                # Old component (keep for reference, remove after migration)
│   ├── SingleFilePage.jsx       # No changes needed (uses Table)
│   └── CompareUniqueIdsPage.jsx # No changes needed (uses Table)
```

---

## Dependencies to Install

**Run:**
```bash
npm install ag-grid-react ag-grid-community @tanstack/react-table datatables.net-react datatables.net-dt
```

---

## Tasks

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install AG Grid**

```bash
npm install ag-grid-react ag-grid-community
```

- [ ] **Step 2: Install TanStack Table**

```bash
npm install @tanstack/react-table @tanstack/react-virtual
```

- [ ] **Step 3: Install DataTables**

```bash
npm install datatables.net-react datatables.net-dt
```

---

### Task 2: Create AGGridView Component

**Files:**
- Create: `src/components/Table/AGGridView.jsx`

```jsx
import { AgGridReact } from 'ag-grid-react'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'

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

const UIDCellRenderer = (params) => {
  if (!params.data) return null
  const matchedSegments = params.data.MatchedSegments
  return highlightSegmentsInUID(params.value, matchedSegments)
}

const MatchStatusCellRenderer = (params) => {
  const value = params.value
  if (value === 'Both') return 'Both'
  if (value === 'Only in left file') return 'Only in left file'
  if (value === 'Only in right file') return 'Only in right file'
  return String(value)
}

export default function AGGridView({
  columns,
  rows,
  highlightColumns = [],
  sortColumn,
  sortDirection,
  onSortChange,
  rowClass,
  onRowClick,
  pagination = true,
  paginationPageSize = 100,
}) {
  const columnDefs = columns.map((col) => {
    const def = {
      field: col,
      headerName: col,
      resizable: true,
      sortable: true,
      filter: true,
      minWidth: 80,
    }
    if (col === 'MatchStatus') {
      def.cellRenderer = MatchStatusCellRenderer
    }
    if (col === 'left_GeneratedUniqueID' || col === 'right_GeneratedUniqueID') {
      def.cellRenderer = UIDCellRenderer
    }
    if (highlightColumns.includes(col)) {
      def.cellClass = 'highlight-col'
    }
    return def
  })

  const defaultColDef = {
    sortable: true,
    resizable: true,
    filter: true,
  }

  const getRowClass = (params) => {
    if (!rowClass) return undefined
    return rowClass(params.data)
  }

  const onSortChanged = (event) => {
    if (event.api.getColumnState) {
      const sortedCol = event.api.getColumnState().find((s) => s.sort)
      if (sortedCol && onSortChange) {
        onSortChange(sortedCol.colId)
      }
    }
  }

  return (
    <div className="ag-theme-quartz" style={{ width: '100%', height: '100%' }}>
      <AgGridReact
        rowData={rows}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        getRowClass={getRowClass}
        onRowClicked={(params) => onRowClick?.(params.data)}
        pagination={pagination}
        paginationPageSize={paginationPageSize}
        onSortChanged={onSortChanged}
        suppressCellFocus={true}
        enableCellTextSelection={true}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify file creation**

Run: `ls -la src/components/Table/AGGridView.jsx`
Expected: File exists

---

### Task 3: Create TanStackView Component

**Files:**
- Create: `src/components/Table/TanStackView.jsx`

```jsx
import { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'

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
  const [localSortColumn, setLocalSortColumn] = useState('')
  const [localSortDirection, setLocalSortDirection] = useState('asc')

  const isControlled = typeof onSortChange === 'function'
  const activeSortColumn = isControlled ? sortColumn : localSortColumn
  const activeSortDirection = isControlled ? sortDirection : localSortDirection

  const columnDefs = useMemo(() =>
    columns.map((col) => ({
      id: col,
      accessorKey: col,
      header: col,
      enableResizing: true,
    })),
  [columns])

  const table = useReactTable({
    data: rows,
    columns: columnDefs,
    state: {
      sorting: activeSortColumn ? [{ id: activeSortColumn, desc: activeSortDirection === 'desc' }] : [],
    },
    onSortingChange: (updater) => {
      if (isControlled) {
        const newSort = typeof updater === 'function' ? updater({}) : updater
        if (newSort.length > 0) {
          onSortChange(newSort[0].id)
        }
      } else {
        const newSort = typeof updater === 'function' ? updater({}) : updater
        if (newSort.length > 0) {
          setLocalSortColumn(newSort[0].id)
          setLocalSortDirection(newSort[0].desc ? 'desc' : 'asc')
        }
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const { rows: tableRows } = table.getRowModel()

  return (
    <div className="tanstack-table-wrapper">
      <table className="data-table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className={[
                    highlightColumns.includes(header.id) ? 'highlight-col' : '',
                    activeSortColumn === header.id ? `sort-${activeSortDirection}` : '',
                  ].filter(Boolean).join(' ')}
                  onClick={header.column.getToggleSortingHandler()}
                  style={{ width: header.getSize() }}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {activeSortColumn === header.id && (
                    <span className="sort-indicator">{activeSortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {tableRows.map((row, idx) => (
            <tr
              key={row.id}
              className={rowClass?.(row.original)}
              onClick={() => onRowClick?.(row.original)}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>{renderCellContent(cell.column.id, cell.getValue(), row.original)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pagination-bar">
        <div className="pagination-controls">
          <button
            className="page-btn"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            First
          </button>
          <button
            className="page-btn"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Prev
          </button>
          <span>
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <button
            className="page-btn"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </button>
          <button
            className="page-btn"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            Last
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify file creation**

Run: `ls -la src/components/Table/TanStackView.jsx`
Expected: File exists

---

### Task 4: Create DataTablesView Component

**Files:**
- Create: `src/components/Table/DataTablesView.jsx`

```jsx
import { useEffect, useRef, useMemo } from 'react'
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

export default function DataTablesView({
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
  const dtRef = useRef(null)

  const dtColumns = useMemo(() =>
    columns.map((col) => ({
      title: col,
      data: col,
    })),
  [columns])

  const dtOptions = {
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
  }

  useEffect(() => {
    if (dtRef.current) {
      const dt = dtRef.current.dt
      if (dt) {
        dt.on('order', (e, settings, Levi) => {
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
    <DataTable
      ref={dtRef}
      columns={dtColumns}
      data={rows}
      options={dtOptions}
      className="display"
    />
  )
}
```

- [ ] **Step 2: Verify file creation**

Run: `ls -la src/components/Table/DataTablesView.jsx`
Expected: File exists

---

### Task 5: Create Multi-Style Table Wrapper

**Files:**
- Create: `src/components/Table/index.jsx`

```jsx
import AGGridView from './AGGridView'
import TanStackView from './TanStackView'
import DataTablesView from './DataTablesView'

export default function Table({
  columns,
  rows,
  highlightColumns = [],
  sortColumn,
  sortDirection,
  onSortChange,
  rowClass,
  onRowClick,
  paginationPageSize = 100,
  tableStyle = 'ag-grid',
}) {
  const TableComponent = {
    'ag-grid': AGGridView,
    'tanstack': TanStackView,
    'datatables': DataTablesView,
  }[tableStyle] || AGGridView

  return (
    <TableComponent
      columns={columns}
      rows={rows}
      highlightColumns={highlightColumns}
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      onSortChange={onSortChange}
      rowClass={rowClass}
      onRowClick={onRowClick}
      paginationPageSize={paginationPageSize}
    />
  )
}
```

- [ ] **Step 2: Verify file creation**

Run: `ls -la src/components/Table/index.jsx`
Expected: File exists

---

### Task 6: Update Table.jsx to Re-export

**Files:**
- Modify: `src/components/Table.jsx`

Replace content with:

```jsx
export { default } from './Table/index.jsx'
```

- [ ] **Step 2: Verify imports still work**

Run: `cd /home/kmail/cmdbesp && npm run dev` (briefly check for import errors)
Expected: No errors

---

### Task 7: Add Global Style Selector to App

**Files:**
- Modify: `src/App.jsx`

1. Add `tableStyle` state defaulting to `localStorage.getItem('preferredTableStyle') || 'ag-grid'`
2. Add a selector dropdown in the header area

Read `src/App.jsx` first, then edit to add:

```jsx
// Add to state
const [tableStyle, setTableStyle] = useState(() => localStorage.getItem('preferredTableStyle') || 'ag-grid')

// Add handler
const handleTableStyleChange = (style) => {
  setTableStyle(style)
  localStorage.setItem('preferredTableStyle', style)
}

// Add selector HTML (in header area)
<select value={tableStyle} onChange={(e) => handleTableStyleChange(e.target.value)}>
  <option value="ag-grid">AG Grid</option>
  <option value="tanstack">TanStack Table</option>
  <option value="datatables">DataTables</option>
</select>
```

3. Pass `tableStyle` to components that use `Table`:
   - `SingleFilePage` gets `tableStyle` prop
   - `CompareUniqueIdsPage` gets `tableStyle` prop

4. Pass `tableStyle` through to `Table` component

- [ ] **Step 2: Run lint check**

Run: `npm run lint`
Expected: No errors

---

### Task 8: Update SingleFilePage to Pass tableStyle

**Files:**
- Modify: `src/components/SingleFilePage.jsx`

Read file, then add `tableStyle` to props and pass to `<Table>`:

```jsx
// Add to props
tableStyle,

// Pass to Table component
<Table columns={selectedFileData.columns} rows={filteredSingleRows} tableStyle={tableStyle} />
```

- [ ] **Step 2: Verify compilation**

Run: `npm run dev` to check for errors
Expected: No errors

---

### Task 9: Update CompareUniqueIdsPage to Pass tableStyle

**Files:**
- Modify: `src/components/CompareUniqueIdsPage.jsx`

Read file, then add `tableStyle` to props and pass to `<Table>`:

```jsx
// Add to props
tableStyle,

// Pass to Table component
<Table
  columns={shareColumns}
  rows={sharePaginatedRows}
  highlightColumns={['MatchStatus', 'left_GeneratedUniqueID', 'right_GeneratedUniqueID']}
  sortColumn={shareSortColumn}
  sortDirection={shareSortDirection}
  onSortChange={(column) => { ... }}
  rowClass={(row) => { ... }}
  onRowClick={(row) => setSelectedShareRow(row)}
  tableStyle={tableStyle}
/>
```

- [ ] **Step 2: Verify compilation**

Run: `npm run dev` to check for errors
Expected: No errors

---

### Task 10: Test Each Table Style

**Verification:**

1. Start the dev server: `npm run dev`
2. Open browser to http://localhost:5173
3. Upload a CSV file with data
4. **AG Grid test:**
   - Verify table renders with sorting (click column headers)
   - Verify column resizing works (drag column borders)
   - Verify pagination works
   - Verify row click works
5. **Switch to TanStack Table:**
   - Select "TanStack Table" from dropdown
   - Verify table renders with sorting
   - Verify pagination works
   - Verify row click works
6. **Switch to DataTables:**
   - Select "DataTables" from dropdown
   - Verify table renders with sorting
   - Verify pagination works
   - Verify row click works
7. **Verify persistence:**
   - Refresh page
   - Verify dropdown still shows selected style

---

### Task 11: Commit Changes

**Run:**

```bash
git add -A
git commit -m "feat: integrate AG Grid, TanStack Table, and DataTables with global style selector

- Add ag-grid-react, @tanstack/react-table, datatables.net-react dependencies
- Create Table/AGGridView, Table/TanStackView, Table/DataTablesView components
- Create Table/index.jsx multi-style wrapper
- Add global table style selector in App with localStorage persistence
- Migrate SingleFilePage and CompareUniqueIdsPage to use tableStyle prop
- Preserve all existing table features: sorting, highlighting, row click, UID segments"
```