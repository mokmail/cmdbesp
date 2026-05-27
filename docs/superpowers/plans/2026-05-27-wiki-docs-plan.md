# Wiki Documentation System - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Info page into a professional wiki-style documentation system with sidebar navigation, multiple doc pages, search, and interactive elements.

**Architecture:** React Router v6 with HashRouter for routing without server config. Documentation stored as JS modules with markdown-style content rendering. Reuses existing Icon component and CSS variables.

**Tech Stack:** React Router v6, CSS (existing variables), Mermaid.js (existing)

---

## File Structure

```
src/
├── components/
│   └── Wiki/
│       ├── WikiDocumentation.jsx    (main wrapper with router + layout)
│       ├── WikiSidebar.jsx          (sidebar with nav tree + search)
│       ├── WikiNavItem.jsx          (single nav item with expand/collapse)
│       ├── WikiContent.jsx          (content renderer with breadcrumb)
│       ├── WikiSearch.jsx           (search modal with results)
│       ├── WikiBreadcrumb.jsx       (breadcrumb trail)
│       ├── WikiPrevNext.jsx         (prev/next navigation)
│       └── WikiContentStyles.css    (styles for wiki components)
├── docs/
│   ├── getting-started.js           (overview + quick start content)
│   ├── features/
│   │   ├── single-file.js           (single file view docs)
│   │   ├── compare-ids.js           (compare IDs docs)
│   │   └── uniqueid-generator.js     (uniqueID generator docs)
│   └── reference/
│       ├── file-formats.js          (file format specs)
│       └── troubleshooting.js       (common issues)
└── App.jsx                          (add wiki route to tabs)
```

---

## Task 1: Create WikiDocumentation Component

**Files:**
- Create: `src/components/Wiki/WikiDocumentation.jsx`
- Modify: `src/App.jsx:507-515, 985-987`
- Test: Manual verification

- [ ] **Step 1: Create WikiDocumentation.jsx with basic structure**

```jsx
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import WikiSidebar from './WikiSidebar'
import WikiContent from './WikiContent'
import { gettingStartedDocs } from '../../docs/getting-started'
import { singleFileDocs } from '../../docs/features/single-file'
import { compareIdsDocs } from '../../docs/features/compare-ids'
import { uniqueIdGeneratorDocs } from '../../docs/features/uniqueid-generator'
import { fileFormatsDocs } from '../../docs/reference/file-formats'
import { troubleshootingDocs } from '../../docs/reference/troubleshooting'

const docs = [
  { path: '/getting-started', title: 'Getting Started', icon: 'compass', children: [
    { path: '/getting-started/overview', title: 'Overview', icon: 'info' },
  ]},
  { path: '/features', title: 'Features', icon: 'target', children: [
    { path: '/features/single-file', title: 'Single File View', icon: 'file' },
    { path: '/features/compare-ids', title: 'Compare Unique IDs', icon: 'link' },
    { path: '/features/uniqueid-generator', title: 'UniqueID Generator', icon: 'key' },
  ]},
  { path: '/reference', title: 'Reference', icon: 'page', children: [
    { path: '/reference/file-formats', title: 'File Formats', icon: 'csv' },
    { path: '/reference/troubleshooting', title: 'Troubleshooting', icon: 'warning' },
  ]},
]

const docComponents = {
  '/getting-started/overview': gettingStartedDocs,
  '/features/single-file': singleFileDocs,
  '/features/compare-ids': compareIdsDocs,
  '/features/uniqueid-generator': uniqueIdGeneratorDocs,
  '/reference/file-formats': fileFormatsDocs,
  '/reference/troubleshooting': troubleshootingDocs,
}

export default function WikiDocumentation() {
  return (
    <HashRouter>
      <div className="wiki-container">
        <WikiSidebar docs={docs} />
        <div className="wiki-content-area">
          <Routes>
            <Route path="/" element={<Navigate to="/getting-started/overview" replace />} />
            {Object.entries(docComponents).map(([path, component]) => (
              <Route key={path} path={path} element={<WikiContent doc={component} />} />
            ))}
          </Routes>
        </div>
      </div>
    </HashRouter>
  )
}
```

- [ ] **Step 2: Create WikiSidebar.jsx with navigation tree**

```jsx
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import WikiSearch from './WikiSearch'

export default function WikiSidebar({ docs }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [expandedSections, setExpandedSections] = useState(['/getting-started'])

  const toggleSection = (path) => {
    setExpandedSections(prev =>
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    )
  }

  const isActive = (path) => location.pathname === path

  return (
    <aside className="wiki-sidebar">
      <div className="wiki-sidebar-header">
        <span className="wiki-logo-text">Docs</span>
      </div>
      <WikiSearch />
      <nav className="wiki-nav">
        {docs.map(section => (
          <div key={section.path} className="wiki-nav-section">
            <button
              className={`wiki-nav-section-header ${expandedSections.includes(section.path) ? 'expanded' : ''}`}
              onClick={() => toggleSection(section.path)}
            >
              <span className="wiki-nav-icon"><Icon name={section.icon} size={18} /></span>
              <span className="wiki-nav-title">{section.title}</span>
              <span className="wiki-nav-chevron">▶</span>
            </button>
            {expandedSections.includes(section.path) && section.children && (
              <div className="wiki-nav-children">
                {section.children.map(child => (
                  <button
                    key={child.path}
                    className={`wiki-nav-item ${isActive(child.path) ? 'active' : ''}`}
                    onClick={() => navigate(child.path)}
                  >
                    <span className="wiki-nav-icon"><Icon name={child.icon} size={16} /></span>
                    <span>{child.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  )
}
```

- [ ] **Step 3: Create WikiContent.jsx with breadcrumb and renderer**

```jsx
import { useLocation } from 'react-router-dom'
import WikiBreadcrumb from './WikiBreadcrumb'
import WikiPrevNext from './WikiPrevNext'

function renderContent(doc) {
  // Simple markdown-like renderer for headings, paragraphs, lists, code blocks, info boxes
}

export default function WikiContent({ doc }) {
  const location = useLocation()

  if (!doc) {
    return <div className="wiki-content"><p>Page not found</p></div>
  }

  return (
    <div className="wiki-content">
      <WikiBreadcrumb path={location.pathname} />
      <article className="wiki-article">
        <h1>{doc.title}</h1>
        {doc.sections.map((section, idx) => (
          <section key={idx} className="wiki-section">
            {section.heading && <h2>{section.heading}</h2>}
            {section.content && <p>{section.content}</p>}
            {section.items && (
              <ul>{section.items.map((item, i) => <li key={i}>{item}</li>)}</ul>
            )}
            {section.code && <pre><code>{section.code}</code></pre>}
            {section.type && section.type.startsWith('info-') && (
              <div className={`wiki-info-box ${section.type}`}>{section.content}</div>
            )}
          </section>
        ))}
      </article>
      <WikiPrevNext currentPath={location.pathname} />
    </div>
  )
}
```

- [ ] **Step 4: Create WikiSearch.jsx with search modal**

```jsx
import { useState, useEffect } from 'react'

export default function WikiSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!isOpen) {
    return (
      <button className="wiki-search-trigger" onClick={() => setIsOpen(true)}>
        <Icon name="search" size={16} />
        <span>Search docs...</span>
        <kbd>⌘K</kbd>
      </button>
    )
  }

  return (
    <div className="wiki-search-modal">
      <input
        type="text"
        placeholder="Search documentation..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />
      <button className="wiki-search-close" onClick={() => setIsOpen(false)}>×</button>
    </div>
  )
}
```

- [ ] **Step 5: Create WikiBreadcrumb.jsx**

```jsx
import { Link } from 'react-router-dom'

const pathSegments = {
  '/getting-started': [{ label: 'Docs', path: '/' }, { label: 'Getting Started' }],
  '/features': [{ label: 'Docs', path: '/' }, { label: 'Features' }],
  '/reference': [{ label: 'Docs', path: '/' }, { label: 'Reference' }],
}

export default function WikiBreadcrumb({ path }) {
  const segments = pathSegments[path] || [{ label: 'Docs', path: '/' }]

  return (
    <nav className="wiki-breadcrumb">
      {segments.map((seg, idx) => (
        <span key={idx}>
          {idx > 0 && <span className="wiki-breadcrumb-sep">›</span>}
          {idx < segments.length - 1 ? (
            <Link to={seg.path}>{seg.label}</Link>
          ) : (
            <span>{seg.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
```

- [ ] **Step 6: Create WikiPrevNext.jsx**

```jsx
const pageOrder = [
  '/getting-started/overview',
  '/features/single-file',
  '/features/compare-ids',
  '/features/uniqueid-generator',
  '/reference/file-formats',
  '/reference/troubleshooting',
]

export default function WikiPrevNext({ currentPath }) {
  const currentIdx = pageOrder.indexOf(currentPath)
  const prev = currentIdx > 0 ? pageOrder[currentIdx - 1] : null
  const next = currentIdx < pageOrder.length - 1 ? pageOrder[currentIdx + 1] : null

  return (
    <nav className="wiki-prev-next">
      {prev ? <Link to={prev}>← Previous</Link> : <span />}
      {next ? <Link to={next}>Next →</Link> : <span />}
    </nav>
  )
}
```

- [ ] **Step 7: Create WikiContentStyles.css**

```css
.wiki-container {
  display: flex;
  height: 100%;
  background: var(--bg-primary);
}

.wiki-sidebar {
  width: 280px;
  min-width: 280px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.wiki-sidebar-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.wiki-logo-text {
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--text-primary);
}

.wiki-nav {
  flex: 1;
  padding: 8px 0;
}

.wiki-nav-section {
  margin-bottom: 4px;
}

.wiki-nav-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 16px;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--text-primary);
  font-size: 0.95rem;
  text-align: left;
}

.wiki-nav-section-header:hover {
  background: var(--bg-hover);
}

.wiki-nav-chevron {
  margin-left: auto;
  font-size: 0.75rem;
  transition: transform 0.2s;
}

.wiki-nav-section-header.expanded .wiki-nav-chevron {
  transform: rotate(90deg);
}

.wiki-nav-children {
  padding-left: 16px;
}

.wiki-nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 16px;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 0.9rem;
  text-align: left;
  border-left: 2px solid transparent;
}

.wiki-nav-item:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.wiki-nav-item.active {
  color: var(--primary-color);
  border-left-color: var(--primary-color);
  font-weight: 500;
}

.wiki-content-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
}

.wiki-content {
  max-width: 900px;
  margin: 0 auto;
}

.wiki-article h1 {
  font-size: 2rem;
  margin-bottom: 24px;
  color: var(--text-primary);
}

.wiki-section {
  margin-bottom: 32px;
}

.wiki-section h2 {
  font-size: 1.4rem;
  margin-bottom: 12px;
  color: var(--text-primary);
}

.wiki-section p {
  line-height: 1.7;
  color: var(--text-secondary);
}

.wiki-section ul {
  margin-left: 24px;
  color: var(--text-secondary);
}

.wiki-section code {
  background: var(--bg-secondary);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
}

.wiki-section pre {
  background: var(--bg-secondary);
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
}

.wiki-info-box {
  padding: 16px;
  border-radius: 8px;
  margin: 16px 0;
}

.wiki-info-box.info-note {
  background: #dbeafe;
  border-left: 4px solid #3b82f6;
}

.wiki-info-box.info-tip {
  background: #dcfce7;
  border-left: 4px solid #22c55e;
}

.wiki-info-box.info-warning {
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
}

.wiki-prev-next {
  display: flex;
  justify-content: space-between;
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}

.wiki-prev-next a {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
}

.wiki-prev-next a:hover {
  text-decoration: underline;
}

.wiki-search-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 16px;
  padding: 8px 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 0.9rem;
  width: calc(100% - 32px);
}

.wiki-search-trigger:hover {
  border-color: var(--primary-color);
}

.wiki-search-trigger kbd {
  margin-left: auto;
  background: var(--bg-secondary);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
}
```

- [ ] **Step 8: Update App.jsx to use WikiDocumentation for Info tab**

Replace:
```jsx
{viewMode === VIEW_MODES[2].id && (
  <InfoPage Icon={Icon} SectionHeading={SectionHeading} />
)}
```

With:
```jsx
{viewMode === VIEW_MODES[2].id && (
  <WikiDocumentation Icon={Icon} />
)}
```

- [ ] **Step 9: Verify the build compiles**

Run: `npm run build` or `npm run dev`
Expected: No build errors

- [ ] **Step 10: Commit**

```bash
git add src/components/Wiki/ src/App.jsx docs/
git commit -m "feat: add wiki documentation system with sidebar navigation"
```

---

## Task 2: Create Documentation Content Modules

**Files:**
- Create: `src/docs/getting-started.js`
- Create: `src/docs/features/single-file.js`
- Create: `src/docs/features/compare-ids.js`
- Create: `src/docs/features/uniqueid-generator.js`
- Create: `src/docs/reference/file-formats.js`
- Create: `src/docs/reference/troubleshooting.js`

- [ ] **Step 1: Create getting-started.js with overview content**

```js
export const gettingStartedDocs = {
  title: 'Getting Started',
  sections: [
    {
      heading: 'Overview',
      content: 'CIO Data Intelligence is a professional data comparison and analysis platform designed to help you compare records across different systems, uncover mismatches, and gain synchronization insights. The platform supports CSV and Excel file formats with powerful filtering, search, and UniqueID generation capabilities.'
    },
    {
      heading: 'Key Features',
      items: [
        'Single File View - Browse and analyze individual CSV files',
        'Compare Unique IDs - Match records across systems using generated unique identifiers',
        'UniqueID Generator - Create composite identifiers from multiple columns',
        'File Upload - Upload your own CSV or Excel files for analysis',
        'Advanced Filtering - Filter by columns, values, and match status'
      ]
    },
    {
      type: 'info-tip',
      content: 'Tip: Start by uploading your data files or exploring the pre-loaded sample files to understand the platform capabilities.'
    },
    {
      heading: 'Quick Start',
      items: [
        'Upload CSV or Excel files using the upload button in Single File view',
        'Select a file to browse and explore its contents',
        'Use the UniqueID Generator to create composite identifiers for matching',
        'Switch to Compare Unique IDs to match records across files'
      ]
    }
  ]
}
```

- [ ] **Step 2: Create single-file.js documentation**

```js
export const singleFileDocs = {
  title: 'Single File View',
  sections: [
    {
      content: 'The Single File View allows you to browse, search, and analyze individual CSV or Excel files. This is your primary tool for exploring data before performing comparisons.'
    },
    {
      heading: 'Loading Files',
      items: [
        'Pre-loaded files: Sample files are automatically loaded on startup',
        'Upload new files: Use the Upload button to add CSV or Excel files',
        'Generated files: Files with GeneratedUniqueID appear in the comparison dropdown'
      ]
    },
    {
      heading: 'Searching and Filtering',
      content: 'Use the search bar to find specific records across all columns. Select a specific column from the dropdown to search within that column only.'
    },
    {
      heading: 'Column Filtering',
      content: 'Click the filter icon next to any column header to filter by specific values. This allows you to focus on relevant subsets of your data.'
    },
    {
      heading: 'UniqueID Generator',
      content: 'Click the UniqueID Generator button to create composite identifiers from multiple columns. This is essential for record matching in the Compare Unique IDs view.'
    }
  ]
}
```

- [ ] **Step 3: Create compare-ids.js documentation**

```js
export const compareIdsDocs = {
  title: 'Compare Unique IDs',
  sections: [
    {
      content: 'The Compare Unique IDs feature enables you to match records across two files based on their GeneratedUniqueID values. Records are compared by their unique identifier segments.'
    },
    {
      heading: 'How Comparison Works',
      items: [
        'Select a left file (primary comparison source)',
        'The right file is automatically used as the comparison target',
        'Records are matched based on shared GeneratedUniqueID segments',
        'Matches are categorized as: Both (found in both), Only in left, Only in right'
      ]
    },
    {
      heading: 'Understanding Results',
      items: [
        'Green rows: Records found in both files',
        'Blue rows: Records only in the left file',
        'Red rows: Records only in the right file'
      ]
    },
    {
      heading: 'Filtering Results',
      content: 'Use the status filter to show only records matching specific criteria. Filter by category (e.g., server types) to focus on specific record types.'
    },
    {
      heading: 'Detail View',
      content: 'Click any row to see a detailed side-by-side comparison showing matched segments highlighted in yellow.'
    }
  ]
}
```

- [ ] **Step 4: Create uniqueid-generator.js documentation**

```js
export const uniqueIdGeneratorDocs = {
  title: 'UniqueID Generator',
  sections: [
    {
      content: 'The UniqueID Generator creates composite identifiers by combining values from multiple columns. These identifiers enable accurate record matching across different systems.'
    },
    {
      heading: 'How It Works',
      content: 'Selected columns are stored as an array in the GeneratedUniqueID field. During comparison, array elements are matched individually, allowing flexible and robust record matching.'
    },
    {
      heading: 'Using the Generator',
      items: [
        'Open Single File view and select a CSV file',
        'Click the UniqueID Generator button in the top right',
        'Select the columns you want to combine using checkboxes',
        'Click Generate & Save to create the identifier',
        'The file is automatically saved to the ID_generated folder'
      ]
    },
    {
      type: 'info-note',
      content: 'Note: You can regenerate UniqueIDs at any time. The original file remains unchanged, and a new file with the generated identifier is created.'
    },
    {
      heading: 'Best Practices',
      items: [
        'Include columns that uniquely identify the record (e.g., Manufacturer, Model, Location)',
        'Avoid including columns with free-text that may vary between systems',
        'Test your identifier strategy on a small sample before processing large files'
      ]
    }
  ]
}
```

- [ ] **Step 5: Create file-formats.js documentation**

```js
export const fileFormatsDocs = {
  title: 'File Formats',
  sections: [
    {
      heading: 'Supported Formats',
      items: [
        'CSV (.csv) - Comma-separated values, auto-detect delimiter',
        'Excel (.xlsx, .xls) - Microsoft Excel spreadsheets'
      ]
    },
    {
      heading: 'CSV Requirements',
      items: [
        'First row must contain column headers',
        'UTF-8 encoding recommended',
        'Auto-detects semicolon (;) or comma (,) delimiters',
        'Empty lines are automatically skipped'
      ]
    },
    {
      heading: 'Column Naming',
      content: 'Column headers are normalized (trimmed, NFC unicode normalization). Duplicate column names are kept as-is.'
    },
    {
      heading: 'GeneratedUniqueID Column',
      content: 'When creating UniqueIDs, a new column called GeneratedUniqueID is added. This contains a JSON array of the combined values.'
    }
  ]
}
```

- [ ] **Step 6: Create troubleshooting.js documentation**

```js
export const troubleshootingDocs = {
  title: 'Troubleshooting',
  sections: [
    {
      heading: 'Common Issues',
      items: [
        'File upload fails: Check file format and size limits',
        'No matches found: Ensure files have GeneratedUniqueID columns',
        'Empty comparison results: Verify both files have matching identifier segments'
      ]
    },
    {
      heading: 'No Match Found in Comparison',
      type: 'info-warning',
      content: 'If no matches are found, check that: (1) Both files have GeneratedUniqueID columns, (2) The identifier segments overlap between files, (3) Category filters are not too restrictive.'
    },
    {
      heading: 'UniqueID Generator Not Available',
      content: 'The UniqueID Generator is only available in Single File view after selecting a CSV file. Ensure you have selected a file first.'
    },
    {
      heading: 'File Not Loading',
      items: [
        'Verify the file is a valid CSV or Excel format',
        'Check that the file encoding is UTF-8',
        'Ensure the file has a header row'
      ]
    }
  ]
}
```

- [ ] **Step 7: Commit**

```bash
git add src/docs/
git commit -m "docs: add documentation content for wiki pages"
```

---

## Task 3: Add Interactive Elements and Polish

**Files:**
- Modify: `src/components/Wiki/WikiDocumentation.jsx`
- Modify: `src/components/Wiki/WikiContentStyles.css`

- [ ] **Step 1: Add collapsible sections to WikiContent**

Update WikiContent to support collapsible accordion sections:
```jsx
function WikiSection({ section }) {
  const [isExpanded, setIsExpanded] = useState(true)
  
  if (section.collapsible) {
    return (
      <div className="wiki-accordion">
        <button className="wiki-accordion-header" onClick={() => setIsExpanded(!isExpanded)}>
          <h2>{section.heading}</h2>
          <span className={`wiki-accordion-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
        </button>
        {isExpanded && <div className="wiki-accordion-content">{/* render content */}</div>}
      </div>
    )
  }
  // ... existing rendering
}
```

- [ ] **Step 2: Add diagram support in content**

In WikiContent, add Mermaid diagram rendering for sections with `diagram` property:
```jsx
{section.diagram && (
  <MermaidDiagram definition={section.diagram} id={`diagram-${idx}`} />
)}
```

- [ ] **Step 3: Add responsive sidebar styles**

Add mobile styles to WikiContentStyles.css:
```css
@media (max-width: 768px) {
  .wiki-sidebar {
    position: fixed;
    left: -280px;
    height: 100vh;
    z-index: 1000;
    transition: left 0.3s;
  }
  .wiki-sidebar.open {
    left: 0;
  }
  .wiki-content-area {
    width: 100%;
  }
}
```

- [ ] **Step 4: Add active section highlighting in sidebar**

Update WikiSidebar to highlight the current section:
```jsx
const currentSection = '/' + location.pathname.split('/')[1]
const isSectionActive = (sectionPath) => location.pathname.startsWith(sectionPath)
```

- [ ] **Step 5: Verify everything works**

Run: `npm run dev`
Test navigation between all wiki pages, search modal, responsive sidebar

- [ ] **Step 6: Commit**

```bash
git add src/components/Wiki/
git commit -m "feat: add interactive elements and responsive styling to wiki"
```

---

## Verification

1. All wiki pages accessible via sidebar navigation
2. Search modal opens with Cmd/Ctrl+K
3. Breadcrumbs show correct path
4. Prev/Next navigation works between pages
5. Mermaid diagrams render correctly
6. Responsive sidebar works on mobile
7. No console errors

---

**Plan complete and saved to `docs/superpowers/plans/2026-05-27-wiki-docs-plan.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?