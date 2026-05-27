import AGGridView from './AGGridView'
import TanStackView from './TanStackView'
import DataTablesView from './DataTablesView'

export default function Table(props) {
  const { tableStyle = 'ag-grid' } = props

  const TableComponent = {
    'ag-grid': AGGridView,
    'tanstack': TanStackView,
    'datatables': DataTablesView,
  }[tableStyle] || AGGridView

  return <TableComponent {...props} />
}