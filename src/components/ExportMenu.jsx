import { useState, useRef, useEffect } from 'react'
import Papa from 'papaparse'

export default function ExportMenu({ columns, rows, filename }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const exportCSV = (delimiter) => {
    const csv = Papa.unparse({
      fields: columns,
      data: rows.map((row) => columns.map((col) => row[col] ?? '')),
    }, { delimiter })

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}_export.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setIsOpen(false)
  }

  const exportExcel = () => {
    const worksheetData = [columns, ...rows.map((row) => columns.map((col) => row[col] ?? ''))]
    
    import('xlsx').then((XLSX) => {
      const ws = XLSX.utils.aoa_to_sheet(worksheetData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Export')
      XLSX.writeFile(wb, `${filename}_export.xlsx`)
    })
    setIsOpen(false)
  }

  return (
    <div className="export-dropdown" ref={menuRef}>
      <button
        type="button"
        className="action-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        Export
      </button>
      {isOpen && (
        <div className="export-menu">
          <button type="button" className="export-option" onClick={() => exportCSV(';')}>
            CSV (semicolon)
          </button>
          <button type="button" className="export-option" onClick={() => exportCSV(',')}>
            CSV (comma)
          </button>
          <button type="button" className="export-option" onClick={() => exportExcel()}>
            Excel (.xlsx)
          </button>
        </div>
      )}
    </div>
  )
}