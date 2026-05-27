import { Link } from 'react-router-dom'

const PAGE_ORDER = [
  { path: '/getting-started/overview', section: 'Getting Started', title: 'Overview' },
  { path: '/features/single-file', section: 'Features', title: 'Single File View' },
  { path: '/features/compare-ids', section: 'Features', title: 'Compare Unique IDs' },
  { path: '/features/uniqueid-generator', section: 'Features', title: 'UniqueID Generator' },
  { path: '/reference/file-formats', section: 'Reference', title: 'File Formats' },
  { path: '/reference/troubleshooting', section: 'Reference', title: 'Troubleshooting' },
]

export default function WikiPrevNext({ currentPath }) {
  const currentIndex = PAGE_ORDER.findIndex(page => page.path === currentPath)
  const prevPage = currentIndex > 0 ? PAGE_ORDER[currentIndex - 1] : null
  const nextPage = currentIndex < PAGE_ORDER.length - 1 ? PAGE_ORDER[currentIndex + 1] : null

  return (
    <nav className="wiki-prev-next" aria-label="Page navigation">
      <div className="prev-next-container">
        {prevPage ? (
          <Link to={prevPage.path} className="prev-link">
            <span className="prev-label">Previous</span>
            <span className="prev-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 6-6 6 6 6" />
              </svg>
              {prevPage.title}
            </span>
          </Link>
        ) : (
          <div />
        )}
        {nextPage && (
          <Link to={nextPage.path} className="next-link">
            <span className="next-label">Next</span>
            <span className="next-title">
              {nextPage.title}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 6 6 6-6 6" />
              </svg>
            </span>
          </Link>
        )}
      </div>
    </nav>
  )
}

export { PAGE_ORDER }
