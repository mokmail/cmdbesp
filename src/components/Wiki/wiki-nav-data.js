export const WIKI_NAVIGATION = [
  {
    section: 'Getting Started',
    path: '/getting-started',
    icon: 'compass',
    children: [
      { title: 'Overview', path: '/getting-started/overview', icon: 'info' },
    ],
  },
  {
    section: 'Features',
    path: '/features',
    icon: 'star',
    children: [
      { title: 'Single File View', path: '/features/single-file', icon: 'file' },
      { title: 'Compare Unique IDs', path: '/features/compare-ids', icon: 'compare' },
      { title: 'UniqueID Generator', path: '/features/uniqueid-generator', icon: 'generator' },
    ],
  },
  {
    section: 'Reference',
    path: '/reference',
    icon: 'book',
    children: [
      { title: 'File Formats', path: '/reference/file-formats', icon: 'format' },
      { title: 'Troubleshooting', path: '/reference/troubleshooting', icon: 'help' },
    ],
  },
]

export const PAGE_ORDER = [
  { path: '/getting-started/overview', section: 'Getting Started', title: 'Overview' },
  { path: '/features/single-file', section: 'Features', title: 'Single File View' },
  { path: '/features/compare-ids', section: 'Features', title: 'Compare Unique IDs' },
  { path: '/features/uniqueid-generator', section: 'Features', title: 'UniqueID Generator' },
  { path: '/reference/file-formats', section: 'Reference', title: 'File Formats' },
  { path: '/reference/troubleshooting', section: 'Reference', title: 'Troubleshooting' },
]

export const SEARCHABLE_PAGES = [
  { path: '/getting-started/overview', title: 'Overview', section: 'Getting Started', keywords: ['intro', 'welcome', 'start'] },
  { path: '/features/single-file', title: 'Single File View', section: 'Features', keywords: ['file', 'csv', 'browse', 'search', 'filter'] },
  { path: '/features/compare-ids', title: 'Compare Unique IDs', section: 'Features', keywords: ['compare', 'unique', 'id', 'matching'] },
  { path: '/features/uniqueid-generator', title: 'UniqueID Generator', section: 'Features', keywords: ['unique', 'id', 'generate', 'create'] },
  { path: '/reference/file-formats', title: 'File Formats', section: 'Reference', keywords: ['file', 'format', 'csv', 'xlsx', 'columns'] },
  { path: '/reference/troubleshooting', title: 'Troubleshooting', section: 'Reference', keywords: ['error', 'problem', 'fix', 'issue', 'help'] },
]