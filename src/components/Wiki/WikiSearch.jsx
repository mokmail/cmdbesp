import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const searchablePages = [
  { path: '/getting-started/overview', title: 'Overview', section: 'Getting Started', keywords: ['intro', 'welcome', 'start'] },
  { path: '/features/single-file', title: 'Single File View', section: 'Features', keywords: ['file', 'csv', 'browse', 'search', 'filter'] },
  { path: '/features/compare-ids', title: 'Compare Unique IDs', section: 'Features', keywords: ['compare', 'unique', 'id', 'matching'] },
  { path: '/features/uniqueid-generator', title: 'UniqueID Generator', section: 'Features', keywords: ['unique', 'id', 'generate', 'create'] },
  { path: '/reference/file-formats', title: 'File Formats', section: 'Reference', keywords: ['file', 'format', 'csv', 'xlsx', 'columns'] },
  { path: '/reference/troubleshooting', title: 'Troubleshooting', section: 'Reference', keywords: ['error', 'problem', 'fix', 'issue', 'help'] },
]

export default function WikiSearch({ isOpen, onClose, onOpen, Icon }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const navigate = useNavigate()

  const search = useCallback((searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }
    const lower = searchQuery.toLowerCase()
    const filtered = searchablePages.filter(page =>
      page.title.toLowerCase().includes(lower) ||
      page.section.toLowerCase().includes(lower) ||
      page.keywords.some(k => k.includes(lower))
    )
    setResults(filtered)
  }, [])

  useEffect(() => {
    if (isOpen) {
      search(query)
    }
  }, [isOpen, query, search])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onOpen()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onOpen])

  const handleResultClick = (path) => {
    navigate(path)
    setQuery('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="wiki-search-overlay" onClick={onClose}>
      <div className="wiki-search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wiki-search-header">
          <div className="wiki-search-input-wrap">
            <Icon name="search" size={18} />
            <input
              type="text"
              placeholder="Search documentation..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
          <button className="wiki-search-close" onClick={onClose} aria-label="Close search">
            <Icon name="close" size={18} />
          </button>
        </div>
        {results.length > 0 && (
          <ul className="wiki-search-results">
            {results.map((result) => (
              <li key={result.path}>
                <button onClick={() => handleResultClick(result.path)}>
                  <span className="result-section">{result.section}</span>
                  <span className="result-title">{result.title}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {query && results.length === 0 && (
          <div className="wiki-search-empty">No results found</div>
        )}
        {!query && (
          <div className="wiki-search-hint">
            <span>Type to search...</span>
          </div>
        )}
      </div>
    </div>
  )
}

export { searchablePages }
