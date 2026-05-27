import { Link } from 'react-router-dom'

export default function WikiBreadcrumb({ section, page }) {
  return (
    <nav className="wiki-breadcrumb" aria-label="Breadcrumb">
      <ol>
        <li><Link to="/">Docs</Link></li>
        <li aria-hidden="true">/</li>
        <li><span className="breadcrumb-section">{section}</span></li>
        <li aria-hidden="true">/</li>
        <li className="breadcrumb-current">{page}</li>
      </ol>
    </nav>
  )
}
