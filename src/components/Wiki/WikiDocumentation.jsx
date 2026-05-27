import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import WikiSidebar from './WikiSidebar'
import WikiContent from './WikiContent'
import { PAGE_ORDER } from './wiki-nav-data'

export default function WikiDocumentation({ Icon }) {
  return (
    <HashRouter>
      <div className="wiki-documentation">
        <WikiSidebar Icon={Icon} />
        <main className="wiki-main">
          <Routes>
            <Route path="/" element={<Navigate to="/getting-started/overview" replace />} />
            {PAGE_ORDER.map(page => (
              <Route key={page.path} path={page.path} element={<WikiContent />} />
            ))}
            <Route path="*" element={<Navigate to="/getting-started/overview" replace />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  )
}
