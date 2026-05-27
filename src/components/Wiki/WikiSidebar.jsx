import { useState } from 'react'
import WikiNavItem from './WikiNavItem'
import WikiSearch from './WikiSearch'
import { WIKI_NAVIGATION } from './wiki-nav-data'

const SECTIONS = WIKI_NAVIGATION.map(nav => ({
  title: nav.section,
  items: nav.children.map(child => ({ path: child.path, label: child.title })),
}))

export default function WikiSidebar({ Icon }) {
  const [expandedSections, setExpandedSections] = useState(
    SECTIONS.reduce((acc, section) => ({ ...acc, [section.title]: true }), {})
  )
  const [searchOpen, setSearchOpen] = useState(false)

  const toggleSection = (title) => {
    setExpandedSections((prev) => ({ ...prev, [title]: !prev[title] }))
  }

  const handleSearchClick = () => {
    setSearchOpen(true)
  }

  return (
    <>
      <aside className="wiki-sidebar">
        <div className="wiki-sidebar-header">
          <button className="wiki-search-trigger" onClick={handleSearchClick}>
            <Icon name="search" size={16} />
            <span>Search docs...</span>
            <kbd>⌘K</kbd>
          </button>
        </div>
        <nav className="wiki-sidebar-nav">
          {SECTIONS.map((section) => (
            <div key={section.title} className="wiki-nav-section">
              <button
                className="wiki-section-header"
                onClick={() => toggleSection(section.title)}
                aria-expanded={expandedSections[section.title]}
              >
                <span>{section.title}</span>
                <svg
                  className={`wiki-chevron ${expandedSections[section.title] ? 'expanded' : ''}`}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
              {expandedSections[section.title] && (
                <ul className="wiki-section-items">
                  {section.items.map((item) => (
                    <li key={item.path}>
                      <WikiNavItem to={item.path}>{item.label}</WikiNavItem>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </nav>
      </aside>
      <WikiSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} onOpen={() => setSearchOpen(true)} Icon={Icon} />
    </>
  )
}

export { SECTIONS }
