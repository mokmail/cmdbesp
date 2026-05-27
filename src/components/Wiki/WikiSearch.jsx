import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { SEARCHABLE_PAGES } from './wiki-nav-data'

export default function WikiSearch({ isOpen, onClose, onOpen, Icon }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const navigate = useNavigate()
  const inputRef = useRef(null)

  const search = useCallback((searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }
    const lower = searchQuery.toLowerCase()
    const filtered = SEARCHABLE_PAGES.filter(page =>
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

  const handleInputKeyDown = useCallback((e) => {
  if (results.length === 0) return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0))
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1))
  } else if (e.key === 'Enter' && selectedIndex >= 0) {
    e.preventDefault()
    handleResultClick(results[selectedIndex].path)
  }
}, [results, selectedIndex])

useEffect(() => {
  setSelectedIndex(-1)
}, [results])

if (!isOpen) return null

return (
  <div className="wiki-search-overlay" onClick={onClose} role="presentation">
    <div
      className="wiki-search-modal"
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-label="Search documentation"
    >
        <div className="wiki-search-header">
          <div className="wiki-search-input-wrap">
            <Icon name="search" size={18} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search documentation..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
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
