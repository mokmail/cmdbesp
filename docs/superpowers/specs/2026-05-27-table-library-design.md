# Table Library Integration Design

## Context

The project has a custom `Table.jsx` component used in `SingleFilePage.jsx` and `CompareUniqueIdsPage.jsx`. The user wants to integrate a modern table library with full-featured interactivity (column resizing, reordering, pinned columns, row selection, pagination).

**Goal:** Allow users to select between three table library styles (AG Grid, TanStack Table, DataTables) via a global dropdown, with the preference persisted to localStorage.

## Design

### Global Style Selector

Add a settings dropdown in the header bar (or top of the main layout) with three options:
- AG Grid (default)
- TanStack Table
- DataTables

The selected style persists to `localStorage` under key `preferredTableStyle`.

### Table Component Architecture

```
Table (wrapper)
├── AGGridView (when style = 'ag-grid')
├── TanStackView (when style = 'tanstack')
└── DataTablesView (when style = 'datatables')
```

Each view receives the same props:
- `columns` - array of column names
- `rows` - array of row objects
- `highlightColumns` - columns to highlight
- `sortColumn` / `sortDirection` - controlled sort state
- `onSortChange` - sort change handler
- `rowClass` - function returning row CSS class
- `onRowClick` - row click handler

### Existing Functionality to Preserve

1. **Column highlighting** - columns in `highlightColumns` get special styling
2. **Sorting** - both controlled (parent state) and local modes
3. **Row class** - conditional styling based on `rowClass` function
4. **Row click** - `onRowClick` callback
5. **UID segment highlighting** - `highlightSegmentsInUID` for UniqueID columns in CompareUniqueIdsPage

### Feature Implementation per Library

#### AG Grid (Default)
- Column resizing: enabled via `resizable` column definition
- Column reordering: enabled via `enableRowGrouping` or drag handle
- Pinned columns: `pinned` column property
- Sorting: built-in with controlled mode
- Filtering: built-in filter UI
- Row selection: checkbox selection mode
- Pagination: built-in pagination component
- Custom cell renderers for highlighting and UID segments

#### TanStack Table v8
- Column resizing: via `@tanstack/react-table`'s `columnResizeMode`
- Column reordering: via drag-and-drop library (dnd-kit)
- Pinned columns: manual implementation with sticky positioning
- Sorting: built-in with controlled mode
- Filtering: manual filter UI
- Row selection: checkbox column
- Pagination: manual implementation with page controls

#### DataTables
- Column resizing: via `colResize` extension
- Column reordering: via `colReorder` extension
- Pinned columns: via `fixedColumns` extension
- Sorting: built-in
- Filtering: built-in search
- Row selection: via `select` extension
- Pagination: built-in with page size selector

### State Management

The `App.jsx` maintains a `tableStyle` state, defaulting to `localStorage.getItem('preferredTableStyle') || 'ag-grid'`. This state is passed down to the `Table` component.

### Pages Using Table

1. **SingleFilePage** - uses `Table` with columns and rows props
2. **CompareUniqueIdsPage** - uses `Table` with advanced sorting, highlighting, and row click handlers

## Migration Strategy

1. Install dependencies for all three libraries
2. Create wrapper component that renders the selected table view
3. Implement each table view with feature parity
4. Add global style selector UI
5. Test each table style independently

## Dependencies

```bash
# AG Grid
npm install ag-grid-react ag-grid-community

# TanStack Table
npm install @tanstack/react-table @tanstack/react-virtual

# DataTables
npm install datatables.net-react datatables.net-dt
```

## Files to Modify

- `package.json` - add dependencies
- `src/App.jsx` - add tableStyle state and selector UI
- `src/components/Table.jsx` - replace with multi-style wrapper
- `src/components/SingleFilePage.jsx` - no change (uses Table)
- `src/components/CompareUniqueIdsPage.jsx` - no change (uses Table)

## Success Criteria

1. Users can switch between AG Grid, TanStack Table, and DataTables via global dropdown
2. Selected style persists across browser sessions
3. All existing table features work in each style:
   - Column sorting (controlled and local)
   - Column highlighting
   - Row class styling
   - Row click handling
   - UID segment highlighting
4. Table performance remains acceptable with 10k+ rows
5. No breaking changes to existing functionality