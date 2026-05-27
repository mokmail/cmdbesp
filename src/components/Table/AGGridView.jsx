import React from 'react'
import { AgGridReact } from 'ag-grid-react'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'

export default function AGGridView({
  columns,
  rows,
}) {
  return (
    <div className="ag-theme-quartz" style={{ width: '100%', height: '600px' }}>
      <AgGridReact
        columnDefs={columns.map(col => ({ headerName: col, field: col }))}
        rowData={rows}
      />
    </div>
  )
}