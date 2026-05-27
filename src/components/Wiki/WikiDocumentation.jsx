import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import WikiSidebar from './WikiSidebar'
import WikiContent from './WikiContent'

export default function WikiDocumentation({ Icon }) {
  return (
    <HashRouter>
      <div className="wiki-documentation">
        <WikiSidebar Icon={Icon} />
        <main className="wiki-main">
          <Routes>
            <Route path="/" element={<Navigate to="/getting-started/overview" replace />} />
            <Route path="/getting-started/overview" element={<WikiContent />} />
            <Route path="/features/single-file" element={<WikiContent />} />
            <Route path="/features/compare-ids" element={<WikiContent />} />
            <Route path="/features/uniqueid-generator" element={<WikiContent />} />
            <Route path="/reference/file-formats" element={<WikiContent />} />
            <Route path="/reference/troubleshooting" element={<WikiContent />} />
            <Route path="*" element={<Navigate to="/getting-started/overview" replace />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  )
}
