import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import mermaid from 'mermaid'
import WikiBreadcrumb from './WikiBreadcrumb'
import WikiPrevNext from './WikiPrevNext'

mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
  securityLevel: 'loose',
})

function MermaidDiagram({ definition, id }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return
    let isMounted = true

    const render = async () => {
      try {
        const { svg } = await mermaid.render(`mermaid-${id}`, definition)
        if (isMounted && containerRef.current) {
          containerRef.current.innerHTML = svg
        }
      } catch (error) {
        if (isMounted && containerRef.current) {
          containerRef.current.innerHTML = `<pre class="mermaid-error">${String(error)}</pre>`
        }
      }
    }

    mermaid.parse(definition).then(() => render()).catch((error) => {
      if (isMounted && containerRef.current) {
        containerRef.current.innerHTML = `<pre class="mermaid-error">${String(error)}</pre>`
      }
    })

    return () => { isMounted = false }
  }, [definition, id])

  return <div ref={containerRef} className="mermaid-diagram" aria-label="Mermaid diagram" />
}

const DOCS_CONTENT = {
  '/getting-started/overview': {
    section: 'Getting Started',
    title: 'Overview',
    content: [
      { type: 'heading', level: 2, text: 'Welcome to CIO Data Intelligence' },
      { type: 'content', text: 'This platform helps you compare and analyze data from various sources, uncovering mismatches and synchronization insights. It provides powerful tools for file management, data comparison, and UniqueID generation.' },
      { type: 'heading', level: 2, text: 'Getting Started' },
      { type: 'content', text: 'The dashboard provides three main views accessible via the tabs at the top of the interface.' },
      { type: 'items', items: [
        'Single File View - Browse and search through individual CSV files',
        'Compare Unique IDs - Match records based on UniqueID field segments',
        'Info - Documentation and guides for using the platform',
      ]},
      { type: 'heading', level: 2, text: 'Key Features' },
      { type: 'content', text: 'This platform offers the following core capabilities:' },
      { type: 'items', items: [
        'Upload and manage CSV and Excel files',
        'Filter and search data across multiple columns',
        'Generate unique identifiers by combining column values',
        'Compare records across different data sources',
        'Visualize comparison results with color-coded status indicators',
      ]},
      { type: 'info-box', variant: 'tip', title: 'Tip', text: 'Start by uploading your CSV files in the Single File view. You can then generate UniqueIDs and use them for comparisons.' },
    ],
  },
  '/features/single-file': {
    section: 'Features',
    title: 'Single File View',
    content: [
      { type: 'heading', level: 2, text: 'Single File View' },
      { type: 'content', text: 'The Single File view allows you to browse and search through individual CSV files. It provides powerful filtering capabilities to help you find specific records quickly.' },
      { type: 'heading', level: 3, text: 'Uploading Files' },
      { type: 'content', text: 'Drag and drop files onto the upload area or click to browse. The platform supports CSV and Excel formats (.csv, .xlsx, .xls).' },
      { type: 'heading', level: 3, text: 'Filtering Data' },
      { type: 'content', text: 'Use the filter panel to narrow down results:' },
      { type: 'items', items: [
        'Select a column to filter by from the dropdown',
        'Choose specific values to display',
        'Use text search to find records containing specific text',
        'Combine filters for precise results',
      ]},
      { type: 'info-box', variant: 'note', title: 'Note', text: 'Filters are applied in combination. Only records matching all selected filter criteria will be displayed.' },
      { type: 'heading', level: 3, text: 'Generating UniqueIDs' },
      { type: 'content', text: 'Click the UniqueID Generator button to create unique identifiers by combining multiple column values. This is useful for record matching across different files.' },
    ],
  },
  '/features/compare-ids': {
    section: 'Features',
    title: 'Compare Unique IDs',
    content: [
      { type: 'heading', level: 2, text: 'Compare Unique IDs' },
      { type: 'content', text: 'The Compare Unique IDs view enables specialized comparison of records based on UniqueID field segments. This helps identify matching records across different data sources.' },
      { type: 'heading', level: 3, text: 'How It Works' },
      { type: 'content', text: 'The comparison process follows these steps:' },
      { type: 'items', items: [
        'Select a left file to analyze',
        'The right file is automatically used as comparison source',
        'UniqueID segments are compared between records',
        'Results are categorized as Both, Only in left file, or Only in right file',
      ]},
      { type: 'info-box', variant: 'tip', title: 'Tip', text: 'Start with "All categories" to see the full picture, then filter by specific categories for deeper analysis.' },
      { type: 'heading', level: 3, text: 'Understanding Results' },
      { type: 'content', text: 'Comparison results show three types of records:' },
      { type: 'items', items: [
        'Both - Records found in both files (matched)',
        'Only in left file - Records unique to the left file',
        'Only in right file - Records unique to the right file',
      ]},
    ],
  },
  '/features/uniqueid-generator': {
    section: 'Features',
    title: 'UniqueID Generator',
    content: [
      { type: 'heading', level: 2, text: 'UniqueID Generator' },
      { type: 'content', text: 'UniqueIDs are unique identifiers created by combining values from multiple columns in your CSV files. They enable accurate record matching and comparison across different systems.' },
      { type: 'heading', level: 3, text: 'How UniqueIDs Work' },
      { type: 'content', text: 'GeneratedUniqueID stores selected columns as an array. For display and matching, array items are compared as individual elements.' },
      { type: 'code', text: 'Columns: [Manufacturer, Model, Location]\nValues: [Dell, PowerEdge R750, DC-A-01]\nResult: ["Dell", "PowerEdge R750", "DC-A-01"]' },
      { type: 'heading', level: 3, text: 'How to Use' },
      { type: 'items', items: [
        'Go to Single File view',
        'Select the CSV file you want to work with',
        'Click the UniqueID Generator button',
        'Select the columns you want to combine',
        'Click Generate & Save UniqueID',
      ]},
      { type: 'info-box', variant: 'warning', title: 'Warning', text: 'UniqueID generation modifies the file data. Make sure you have a backup if you need the original data.' },
    ],
  },
  '/reference/file-formats': {
    section: 'Reference',
    title: 'File Formats',
    content: [
      { type: 'heading', level: 2, text: 'File Formats' },
      { type: 'content', text: 'The platform supports the following file formats for upload and analysis:' },
      { type: 'heading', level: 3, text: 'CSV Files' },
      { type: 'content', text: 'CSV (Comma-Separated Values) files are the primary format supported. Files should use UTF-8 encoding for best results.' },
      { type: 'heading', level: 3, text: 'Excel Files' },
      { type: 'content', text: 'Excel files (.xlsx, .xls) are also supported. The first sheet is used for data extraction.' },
      { type: 'info-box', variant: 'note', title: 'Note', text: 'For large datasets, CSV format is recommended for better performance.' },
    ],
  },
  '/reference/troubleshooting': {
    section: 'Reference',
    title: 'Troubleshooting',
    content: [
      { type: 'heading', level: 2, text: 'Troubleshooting' },
      { type: 'content', text: 'Common issues and their solutions:' },
      { type: 'heading', level: 3, text: 'File Upload Issues' },
      { type: 'content', text: 'If your file fails to upload:' },
      { type: 'items', items: [
        'Ensure the file is in CSV or Excel format',
        'Check that the file is not corrupted',
        'Verify the file size is within limits',
        'Try re-encoding the file as UTF-8',
      ]},
      { type: 'info-box', variant: 'warning', title: 'Warning', text: 'Files with special characters in headers may cause parsing issues. Use simple column names without special characters.' },
    ],
  },
}

function renderContent(content, collapsedSections = {}, toggleSection) {
  return content.map((block, index) => {
    switch (block.type) {
      case 'heading': {
        const HeadingTag = `h${block.level}`
        if (block.collapsible) {
          const isCollapsed = collapsedSections[index]
          return (
            <div key={index} className={`collapsible-section ${isCollapsed ? 'collapsed' : 'expanded'}`}>
              <button
                className="collapsible-header"
                onClick={() => toggleSection && toggleSection(index)}
                aria-expanded={!isCollapsed}
              >
                <span className="collapsible-icon">{isCollapsed ? '▶' : '▼'}</span>
                <HeadingTag>{block.text}</HeadingTag>
              </button>
              {!isCollapsed && <div className="collapsible-content">{renderContent(block.children || [], collapsedSections, toggleSection)}</div>}
            </div>
          )
        }
        return <HeadingTag key={index}>{block.text}</HeadingTag>
      }
      case 'diagram':
        return <MermaidDiagram key={index} definition={block.definition} id={`wiki-diagram-${index}`} />
      case 'content':
        return <p key={index}>{block.text}</p>
      case 'items':
        return (
          <ul key={index}>
            {block.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        )
      case 'code':
        return <pre key={index}><code>{block.text}</code></pre>
      case 'info-box':
        return (
          <div key={index} className={`info-box ${block.variant}`}>
            <strong>{block.title}:</strong> {block.text}
          </div>
        )
      default:
        return null
    }
  })
}

function WikiContent() {
  const [collapsedSections, setCollapsedSections] = useState({})
  const location = useLocation()
  const doc = DOCS_CONTENT[location.pathname] || DOCS_CONTENT['/getting-started/overview']

  const toggleSection = (index) => {
    setCollapsedSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  return (
    <article className="wiki-content">
      <WikiBreadcrumb section={doc.section} page={doc.title} />
      <div className="wiki-page-content">
        {renderContent(doc.content, collapsedSections, toggleSection)}
      </div>
      <WikiPrevNext currentPath={location.pathname} />
    </article>
  )
}

export default WikiContent
export { DOCS_CONTENT }
