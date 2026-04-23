import { useEffect, useMemo, useState } from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import SingleFilePage from './components/SingleFilePage'
import CompareFilesPage from './components/CompareFilesPage'
import CompareUniqueIdsPage from './components/CompareUniqueIdsPage'
import InfoPage from './components/InfoPage'
import UniqueIdGeneratorModal from './components/UniqueIdGeneratorModal'
import ExportMenu from './components/ExportMenu'
import Table from './components/Table'
import { generateUniqueIds, uniqueValues } from './components/shared'
import './App.css'

const normalizeHeader = (header) => header?.trim() ?? ''

const normalizeText = (text) => String(text ?? '').replace(/^\uFEFF/, '').normalize('NFC')

const ICONS = {
  dashboard: (
    <>
      <rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor" opacity="0.15" />
      <rect x="13" y="3" width="8" height="8" rx="2" fill="currentColor" opacity="0.15" />
      <rect x="3" y="13" width="8" height="8" rx="2" fill="currentColor" opacity="0.15" />
      <rect x="13" y="13" width="8" height="8" rx="2" fill="currentColor" opacity="0.15" />
      <rect x="3" y="3" width="8" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13" y="3" width="8" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <rect x="3" y="13" width="8" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13" y="13" width="8" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <rect x="5.5" y="5.5" width="3" height="3" rx="0.75" fill="currentColor" />
      <rect x="15.5" y="5.5" width="3" height="3" rx="0.75" fill="currentColor" />
      <rect x="5.5" y="15.5" width="3" height="3" rx="0.75" fill="currentColor" />
      <rect x="15.5" y="15.5" width="3" height="3" rx="0.75" fill="currentColor" />
    </>
  ),
  file: (
    <>
      <path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h5.379A1.5 1.5 0 0 1 15 2.44l3.56 3.56A1.5 1.5 0 0 1 19 6.879V18.5A1.5 1.5 0 0 1 17.5 20h-9A1.5 1.5 0 0 1 7 18.5v-15Z" fill="currentColor" opacity="0.12" />
      <path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h5.379A1.5 1.5 0 0 1 15 2.44l3.56 3.56A1.5 1.5 0 0 1 19 6.879V18.5A1.5 1.5 0 0 1 17.5 20h-9A1.5 1.5 0 0 1 7 18.5v-15Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M13 2v4.5a1 1 0 0 0 1 1h4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <line x1="10" y1="10" x2="16" y2="10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
      <line x1="10" y1="13" x2="16" y2="13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
      <line x1="10" y1="16" x2="14" y2="16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
    </>
  ),
  compare: (
    <>
      <rect x="2" y="2" width="9" height="20" rx="2" fill="currentColor" opacity="0.1" />
      <rect x="13" y="2" width="9" height="20" rx="2" fill="currentColor" opacity="0.1" />
      <rect x="2" y="2" width="9" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13" y="2" width="9" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <line x1="4" y1="7" x2="9" y2="7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.6" />
      <line x1="4" y1="10" x2="9" y2="10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.6" />
      <line x1="4" y1="13" x2="9" y2="13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.6" />
      <line x1="15" y1="7" x2="20" y2="7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.6" />
      <line x1="15" y1="10" x2="20" y2="10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.6" />
      <line x1="15" y1="13" x2="20" y2="13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.6" />
      <path d="M10 10l1.5 2-1.5 2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 10l-1.5 2 1.5 2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  link: (
    <>
      <path d="M10.5 13.5 13.5 10.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M8.5 7.5h-2A3.5 3.5 0 0 0 3 11v0a3.5 3.5 0 0 0 3.5 3.5h2" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M15.5 16.5h2A3.5 3.5 0 0 0 21 13v0a3.5 3.5 0 0 0-3.5-3.5h-2" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="6.5" cy="11" r="1" fill="currentColor" opacity="0.5" />
      <circle cx="17.5" cy="13" r="1" fill="currentColor" opacity="0.5" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.1" />
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 10.5v5.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="12" cy="7.5" r="1.3" fill="currentColor" />
    </>
  ),
  warning: (
    <>
      <path d="m12 2.5 10 17.5H2L12 2.5Z" fill="currentColor" opacity="0.1" />
      <path d="m12 2.5 10 17.5H2L12 2.5Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M12 8.5v5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1.3" fill="currentColor" />
    </>
  ),
  folder: (
    <>
      <path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h3.9a1.5 1.5 0 0 1 1.2.6l1 1.4H18.5A1.5 1.5 0 0 1 20 9.5v7A1.5 1.5 0 0 1 18.5 18h-13A1.5 1.5 0 0 1 4 16.5v-9Z" fill="currentColor" opacity="0.12" />
      <path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h3.9a1.5 1.5 0 0 1 1.2.6l1 1.4H18.5A1.5 1.5 0 0 1 20 9.5v7A1.5 1.5 0 0 1 18.5 18h-13A1.5 1.5 0 0 1 4 16.5v-9Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <line x1="8" y1="13" x2="16" y2="13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.4" />
    </>
  ),
  chart: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor" opacity="0.06" />
      <path d="M4 19.5h16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="5.5" y="9" width="3" height="10.5" rx="0.75" fill="currentColor" opacity="0.3" />
      <rect x="10.5" y="6" width="3" height="13.5" rx="0.75" fill="currentColor" opacity="0.3" />
      <rect x="15.5" y="12" width="3" height="7.5" rx="0.75" fill="currentColor" opacity="0.3" />
      <rect x="5.5" y="9" width="3" height="10.5" rx="0.75" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <rect x="10.5" y="6" width="3" height="13.5" rx="0.75" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <rect x="15.5" y="12" width="3" height="7.5" rx="0.75" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.08" />
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
      <line x1="12" y1="1" x2="12" y2="4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="12" y1="20" x2="12" y2="23" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="1" y1="12" x2="4" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="20" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" fill="currentColor" opacity="0.08" />
      <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16.2 16.2 4.5 4.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.08" />
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M15.5 8.5 8.5 15.5l1.5-6 6-1.5Z" fill="currentColor" opacity="0.9" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <line x1="12" y1="2" x2="12" y2="4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
      <line x1="12" y1="19.5" x2="12" y2="22" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
      <line x1="2" y1="12" x2="4.5" y2="12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
      <line x1="19.5" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
    </>
  ),
  tag: (
    <>
      <path d="M4.5 12.5 11 6h5l3.5 3.5v5L13 19l-8.5-6.5Z" fill="currentColor" opacity="0.12" />
      <path d="M4.5 12.5 11 6h5l3.5 3.5v5L13 19l-8.5-6.5Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="15.4" cy="8.6" r="1.5" fill="currentColor" />
    </>
  ),
  page: (
    <>
      <path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h5.379A1.5 1.5 0 0 1 15 2.44l3.56 3.56A1.5 1.5 0 0 1 19 6.879V18.5A1.5 1.5 0 0 1 17.5 20h-9A1.5 1.5 0 0 1 7 18.5v-15Z" fill="currentColor" opacity="0.12" />
      <path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h5.379A1.5 1.5 0 0 1 15 2.44l3.56 3.56A1.5 1.5 0 0 1 19 6.879V18.5A1.5 1.5 0 0 1 17.5 20h-9A1.5 1.5 0 0 1 7 18.5v-15Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9.5 10h5M9.5 13h5M9.5 16h3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  first: (
    <>
      <path d="M6 5v14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="m16 6-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  prev: (
    <path d="m15 6-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  next: (
    <path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  last: (
    <>
      <path d="M18 5v14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="m8 6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  close: (
    <>
      <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.08" />
      <path d="m8 8 8 8M16 8l-8 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  key: (
    <>
      <circle cx="8.5" cy="12" r="4" fill="currentColor" opacity="0.1" />
      <circle cx="8.5" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12.2 12H20M16 12v2.5M13.6 12v1.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="8.5" cy="12" r="1.5" fill="currentColor" opacity="0.5" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 12a8 8 0 0 0-13.6-5.7L4 8.7M4 4.5v4.2h4.2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 12a8 8 0 0 0 13.6 5.7L20 15.3M20 19.5v-4.2h-4.2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.2" />
    </>
  ),
  save: (
    <>
      <path d="M5.5 4h11L20 7.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19V5.5A1.5 1.5 0 0 1 5.5 4Z" fill="currentColor" opacity="0.1" />
      <path d="M5.5 4h11L20 7.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19V5.5A1.5 1.5 0 0 1 5.5 4Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8 4v5h8V4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="8" y="14" width="8" height="6.5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.6" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.1" />
      <path d="m6 12.5 4 4 8-8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  lightbulb: (
    <>
      <circle cx="12" cy="9" r="6" fill="currentColor" opacity="0.1" />
      <path d="M9 17h6M10 20h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 9a4 4 0 1 1 8 0c0 1.5-.8 2.8-2 3.6V15H10v-2.4A4.4 4.4 0 0 1 8 9Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <line x1="12" y1="4" x2="12" y2="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="4" y1="9" x2="2" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="20" y1="9" x2="22" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="17" y1="4" x2="18.2" y2="2.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="7" y1="4" x2="5.8" y2="2.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="6.5" rx="8" ry="3.5" fill="currentColor" opacity="0.1" />
      <ellipse cx="12" cy="6.5" rx="8" ry="3.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 6.5v6c0 1.9 3.6 3.5 8 3.5s8-1.6 8-3.5v-6" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 12.5v4c0 1.9 3.6 3.5 8 3.5s8-1.6 8-3.5v-4" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="10" cy="6.5" r="0.8" fill="currentColor" opacity="0.5" />
      <circle cx="14" cy="6.5" r="0.8" fill="currentColor" opacity="0.5" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12m0 0-4-4m4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 19h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 15v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  csv: (
    <>
      <path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h5.379A1.5 1.5 0 0 1 15 2.44l3.56 3.56A1.5 1.5 0 0 1 19 6.879V18.5A1.5 1.5 0 0 1 17.5 20h-9A1.5 1.5 0 0 1 7 18.5v-15Z" fill="currentColor" opacity="0.1" />
      <path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h5.379A1.5 1.5 0 0 1 15 2.44l3.56 3.56A1.5 1.5 0 0 1 19 6.879V18.5A1.5 1.5 0 0 1 17.5 20h-9A1.5 1.5 0 0 1 7 18.5v-15Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M13 2v4.5a1 1 0 0 0 1 1h4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <line x1="10" y1="10" x2="16" y2="10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.5" />
      <line x1="10" y1="13" x2="16" y2="13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.5" />
      <line x1="10" y1="16" x2="14" y2="16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.5" />
    </>
  ),
  excel: (
    <>
      <path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h5.379A1.5 1.5 0 0 1 15 2.44l3.56 3.56A1.5 1.5 0 0 1 19 6.879V18.5A1.5 1.5 0 0 1 17.5 20h-9A1.5 1.5 0 0 1 7 18.5v-15Z" fill="currentColor" opacity="0.1" />
      <path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h5.379A1.5 1.5 0 0 1 15 2.44l3.56 3.56A1.5 1.5 0 0 1 19 6.879V18.5A1.5 1.5 0 0 1 17.5 20h-9A1.5 1.5 0 0 1 7 18.5v-15Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M13 2v4.5a1 1 0 0 0 1 1h4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <rect x="9.5" y="9" width="7" height="8.5" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <line x1="10" y1="11.5" x2="16" y2="11.5" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <line x1="10" y1="14.5" x2="16" y2="14.5" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <line x1="13" y1="9.5" x2="13" y2="17" stroke="currentColor" strokeWidth="1" opacity="0.3" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V4m0 0-4 4m4-4 4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16M10 11v6M14 11v6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 4V3h4v1" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
}

export const Icon = ({ name, size = 20, className = '' }) => (
  <svg
    className={`app-icon ${className}`.trim()}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    {ICONS[name]}
  </svg>
)

export const InlineIcon = ({ name, size = 18, className = '' }) => <Icon name={name} size={size} className={`inline-icon ${className}`.trim()} />

export const SectionHeading = ({ icon, children, className = '' }) => (
  <div className={`section-heading ${className}`.trim()}>
    <Icon name={icon} size={22} />
    <span>{children}</span>
  </div>
)

const originalCsvSources = import.meta.glob('../*.csv', { query: '?raw', import: 'default' })
const generatedCsvSources = import.meta.glob('../ID_generated/*.csv', { query: '?raw', import: 'default' })

export const parseCsvText = (name, text) => {
  const normalizedText = normalizeText(text)
  const parseText = (delimiter) =>
    Papa.parse(normalizedText, {
      header: true,
      delimiter,
      skipEmptyLines: true,
      transformHeader: normalizeHeader,
      encoding: 'UTF-8',
    })

  let parsed = parseText(';')
  if (!parsed.meta.fields || parsed.meta.fields.length <= 1) {
    parsed = parseText(',')
  }

  return {
    name,
    rows: parsed.data,
    columns: parsed.meta.fields || [],
    errors: parsed.errors,
  }
}

export const parseXlsxFile = (name, arrayBuffer) => {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const json = XLSX.utils.sheet_to_json(sheet, { defval: '' })
  const columns = json.length > 0 ? Object.keys(json[0]).map(normalizeHeader) : []
  const rows = json.map((row) => {
    const normalized = {}
    Object.keys(row).forEach((key) => {
      normalized[normalizeHeader(key)] = row[key]
    })
    return normalized
  })
  return { name, rows, columns, errors: [] }
}

export const compareMultiColumn = (fileA, fileB) => {
  const rowsA = fileA.rows || []
  const rowsB = fileB.rows || []
  const matchedBIndexes = new Set()
  const colsA = fileA.columns || []
  const colsB = fileB.columns || []

  const parseGeneratedUniqueIdItems = (value) => {
    if (Array.isArray(value)) {
      return value.map((item) => String(item ?? '').trim()).filter((item) => item.length > 0)
    }
    const text = String(value ?? '').trim()
    if (!text) return []
    if (text.startsWith('[') && text.endsWith(']')) {
      try {
        const parsed = JSON.parse(text)
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item ?? '').trim()).filter((item) => item.length > 0)
        }
      } catch {}
    }
    return []
  }

  const getComparableUniqueIdItems = (row) => {
    return parseGeneratedUniqueIdItems(row?.GeneratedUniqueID)
      .map((item) => item.toUpperCase())
      .filter((item) => item.length > 0)
  }

  const formatGeneratedUniqueId = (value) => {
    const items = parseGeneratedUniqueIdItems(value)
    return JSON.stringify(items)
  }

  const getSharedItems = (itemsA, itemsB) => {
    const setB = new Set(itemsB)
    return itemsA.filter((itemA) => setB.has(itemA))
  }

  const leftRows = rowsA.map((rowA) => {
    const comparableAItems = getComparableUniqueIdItems(rowA)
    const cmdbOriginalDisplay = formatGeneratedUniqueId(rowA.GeneratedUniqueID)
    const matchedSegments = new Set()
    const matchedRightRows = []

    rowsB.forEach((rowB, idxB) => {
      const comparableBItems = getComparableUniqueIdItems(rowB)
      if (!comparableAItems.length || !comparableBItems.length) return
      const commonItems = getSharedItems(comparableAItems, comparableBItems)
      if (commonItems.length > 0) {
        matchedBIndexes.add(idxB)
        commonItems.forEach((item) => matchedSegments.add(item))
        matchedRightRows.push(rowB)
      }
    })

    const matchStatus = matchedRightRows.length > 0 ? 'Both' : 'Only in CMDB'
    const espOriginalDisplay = matchedRightRows.length > 0
      ? formatGeneratedUniqueId(matchedRightRows[0].GeneratedUniqueID)
      : ''

    const prefixedRow = { CMDB_GeneratedUniqueID: cmdbOriginalDisplay, ESP_GeneratedUniqueID: '' }
    colsA.forEach((col) => {
      if (col !== 'UniqueID' && col !== 'GeneratedUniqueID') {
        prefixedRow[`CMDB_${col}`] = rowA[col] || ''
      }
    })

    if (matchedRightRows.length > 0) {
      const firstMatchedRight = matchedRightRows[0]
      colsB.forEach((col) => {
        if (col !== 'UniqueID' && col !== 'GeneratedUniqueID') {
          prefixedRow[`ESP_${col}`] = firstMatchedRight[col] || ''
        }
      })
    }

    return {
      ...prefixedRow,
      ESP_GeneratedUniqueID: espOriginalDisplay,
      MatchStatus: matchStatus,
      MatchedSegments: Array.from(matchedSegments).sort().join(', '),
    }
  })

  const rightOnlyRows = rowsB.reduce((acc, rowB, idxB) => {
    if (!matchedBIndexes.has(idxB)) {
      const espOriginalDisplay = formatGeneratedUniqueId(rowB.GeneratedUniqueID)
      const prefixedRow = { CMDB_GeneratedUniqueID: '', ESP_GeneratedUniqueID: espOriginalDisplay }
      colsB.forEach((col) => {
        if (col !== 'UniqueID' && col !== 'GeneratedUniqueID') {
          prefixedRow[`ESP_${col}`] = rowB[col] || ''
        }
      })
      acc.push({
        ...prefixedRow,
        MatchStatus: 'Only in right file',
        MatchedSegments: '',
      })
    }
    return acc
  }, [])

  return {
    rows: [...leftRows, ...rightOnlyRows],
    stats: {
      totalA: rowsA.length,
      totalB: rowsB.length,
      both: leftRows.filter((row) => row.MatchStatus === 'Both').length,
      onlyInA: leftRows.filter((row) => row.MatchStatus === 'Only in CMDB').length,
      onlyInB: rightOnlyRows.length,
    },
  }
}

const getEspTypColumnName = (columns = []) => {
  const exact = columns.find((col) => String(col).trim().toLowerCase() === 'typ')
  if (exact) return exact
  const containsTyp = columns.find((col) => String(col).trim().toLowerCase().includes('typ'))
  if (containsTyp) return containsTyp
  return null
}

export const getEspTypValue = (row, columns = []) => {
  const typColumn = getEspTypColumnName(columns)
  if (typColumn) return String(row?.[typColumn] ?? '').trim()
  const fallback = row?.Typ ?? row?.TYP ?? row?.typ ?? ''
  return String(fallback).trim()
}

function App() {
  const VIEW_MODES = [
    { id: 'Single File', label: 'Single File', icon: 'file' },
    { id: 'Compare Files', label: 'Compare Files', icon: 'compare' },
    { id: 'Compare Unique IDs', label: 'Compare Unique IDs', icon: 'link' },
    { id: 'Info', label: 'Info', icon: 'info' },
  ]

  const [viewMode, setViewMode] = useState(VIEW_MODES[0].id)
  const [originalFiles, setOriginalFiles] = useState([])
  const [generatedFiles, setGeneratedFiles] = useState([])
  const [selectedFile, setSelectedFile] = useState('')
  const [compareA, setCompareA] = useState('')
  const [compareB, setCompareB] = useState('')
  const [mergeColumn, setMergeColumn] = useState('')
  const [singleFilterText, setSingleFilterText] = useState('')
  const [singleSearchColumn, setSingleSearchColumn] = useState('all')
  const [filterColumn, setFilterColumn] = useState('')
  const [filterValues, setFilterValues] = useState([])
  const [compareFilterA, setCompareFilterA] = useState('')
  const [compareFilterB, setCompareFilterB] = useState('')
  const [compareFilterValuesA, setCompareFilterValuesA] = useState([])
  const [compareFilterValuesB, setCompareFilterValuesB] = useState([])
  const [showDifferences, setShowDifferences] = useState(false)
  const [selectedSharesFile, setSelectedSharesFile] = useState('')
  const [selectedEspFile, setSelectedEspFile] = useState('')
  const [selectedShareRow, setSelectedShareRow] = useState(null)
  const [error, setError] = useState('')
  const [shareFilterText, setShareFilterText] = useState('')
  const [shareFilterStatus, setShareFilterStatus] = useState('all')
  const [shareSearchColumn, setShareSearchColumn] = useState('all')
  const [shareFilterColumn, setShareFilterColumn] = useState('all')
  const [shareFilterColumnValues, setShareFilterColumnValues] = useState([])
  const [shareESPCategoriesSelected, setShareESPCategoriesSelected] = useState([])
  const [sharePage, setSharePage] = useState(1)
  const [sharePageSize, setSharePageSize] = useState(50)
  const [shareSortColumn, setShareSortColumn] = useState('No')
  const [shareSortDirection, setShareSortDirection] = useState('asc')
  const [uniqueIdColumns, setUniqueIdColumns] = useState([])
  const [generatedUniqueIds, setGeneratedUniqueIds] = useState(null)
  const [showUniqueIdModal, setShowUniqueIdModal] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return

    const newUploaded = []
    const errors = []

    const processFiles = async () => {
      for (const file of files) {
        const ext = file.name.split('.').pop().toLowerCase()
        try {
          if (ext === 'csv') {
            const text = await file.text()
            const parsed = parseCsvText(file.name, text)
            newUploaded.push(parsed)
          } else if (ext === 'xlsx' || ext === 'xls') {
            const buffer = await file.arrayBuffer()
            const parsed = parseXlsxFile(file.name, buffer)
            newUploaded.push(parsed)
          } else {
            errors.push(`Unsupported file format: ${file.name}`)
          }
        } catch (e) {
          errors.push(`Failed to parse ${file.name}: ${e}`)
        }
      }

      setUploadedFiles((prev) => [...prev, ...newUploaded])
      if (errors.length > 0) setError(errors.join('; '))
    }

    processFiles()
    event.target.value = ''
  }

  const removeUploadedFile = (fileName) => {
    setUploadedFiles((prev) => prev.filter((f) => f.name !== fileName))
    if (selectedFile === fileName) setSelectedFile('')
  }

  const allOriginalFiles = useMemo(() => [...originalFiles, ...uploadedFiles], [originalFiles, uploadedFiles])

  const originalLoadedNames = useMemo(() => allOriginalFiles.map((file) => file.name), [allOriginalFiles])
  const generatedLoadedNames = useMemo(() => generatedFiles.map((file) => file.name), [generatedFiles])
  const originalFileMap = useMemo(
    () => Object.fromEntries(allOriginalFiles.map((file) => [file.name, file])),
    [allOriginalFiles],
  )
  const generatedFileMap = useMemo(
    () => Object.fromEntries(generatedFiles.map((file) => [file.name, file])),
    [generatedFiles],
  )

  const selectedFileData = originalFileMap[selectedFile]
  const compareAData = generatedFileMap[compareA]
  const compareBData = generatedFileMap[compareB]
  const sharesData = generatedFileMap[selectedSharesFile]
  const espData = generatedFileMap[selectedEspFile]
  const sharesHasGeneratedId = Boolean(sharesData?.columns?.includes('GeneratedUniqueID'))
  const espHasGeneratedId = Boolean(espData?.columns?.includes('GeneratedUniqueID'))

  const filteredSingleRows = useMemo(() => {
    if (!selectedFileData) return []
    let rows = [...selectedFileData.rows]
    if (filterColumn && filterValues.length) {
      rows = rows.filter((row) => filterValues.includes(row[filterColumn]))
    }
    if (singleFilterText.trim()) {
      const search = singleFilterText.toLowerCase()
      rows = rows.filter((row) => {
        if (singleSearchColumn !== 'all') {
          return String(row[singleSearchColumn] ?? '').toLowerCase().includes(search)
        }
        return selectedFileData.columns.some((column) => String(row[column] ?? '').toLowerCase().includes(search))
      })
    }
    return rows
  }, [selectedFileData, filterColumn, filterValues, singleFilterText, singleSearchColumn])

  const singleFilterStats = useMemo(() => {
    if (!selectedFileData) return null
    const totalRows = selectedFileData.rows.length
    const shownRows = filteredSingleRows.length
    const hiddenRows = Math.max(0, totalRows - shownRows)
    const shownPercent = totalRows > 0 ? Math.round((shownRows / totalRows) * 100) : 0
    return { totalRows, shownRows, hiddenRows, shownPercent }
  }, [selectedFileData, filteredSingleRows])

  const filteredCompareARows = useMemo(() => {
    if (!compareAData || !compareFilterA || !compareFilterValuesA.length) return compareAData?.rows || []
    return compareAData.rows.filter((row) => compareFilterValuesA.includes(row[compareFilterA]))
  }, [compareAData, compareFilterA, compareFilterValuesA])

  const filteredCompareBRows = useMemo(() => {
    if (!compareBData || !compareFilterB || !compareFilterValuesB.length) return compareBData?.rows || []
    return compareBData.rows.filter((row) => compareFilterValuesB.includes(row[compareFilterB]))
  }, [compareBData, compareFilterB, compareFilterValuesB])

  const commonColumns = useMemo(() => {
    if (!compareAData || !compareBData) return []
    return compareAData.columns.filter((col) => compareBData.columns.includes(col))
  }, [compareAData, compareBData])

  const { mergeRows } = useMemo(() => {
    const mergeRows = (rowsA, rowsB, mergeCol, fileA, fileB) => {
      const mapB = new Map()
      rowsB.forEach((row) => {
        const key = String(row[mergeCol] ?? '')
        if (!mapB.has(key)) mapB.set(key, [])
        mapB.get(key).push(row)
      })

      const merged = []
      const matchedB = new Set()
      const commonCols = rowsA.length && rowsB.length ? Object.keys(rowsA[0]).filter((col) => Object.keys(rowsB[0]).includes(col)) : []
      const suffixA = (col) => (commonCols.includes(col) && col !== mergeCol ? `${col} (${fileA})` : col)
      const suffixB = (col) => (commonCols.includes(col) && col !== mergeCol ? `${col} (${fileB})` : col)

      rowsA.forEach((rowA) => {
        const key = String(rowA[mergeCol] ?? '')
        const matches = mapB.get(key)
        if (matches?.length) {
          matches.forEach((rowB) => {
            matchedB.add(key)
            const mergedRow = {}
            Object.keys(rowA).forEach((col) => { mergedRow[suffixA(col)] = rowA[col] })
            Object.keys(rowB).forEach((col) => { mergedRow[suffixB(col)] = rowB[col] })
            mergedRow[mergeCol] = key
            mergedRow._merge = 'both'
            merged.push(mergedRow)
          })
        } else {
          const mergedRow = {}
          Object.keys(rowA).forEach((col) => { mergedRow[suffixA(col)] = rowA[col] })
          mergedRow[mergeCol] = key
          mergedRow._merge = 'left_only'
          merged.push(mergedRow)
        }
      })

      rowsB.forEach((rowB) => {
        const key = String(rowB[mergeCol] ?? '')
        if (!matchedB.has(key)) {
          const mergedRow = {}
          Object.keys(rowB).forEach((col) => { mergedRow[suffixB(col)] = rowB[col] })
          mergedRow[mergeCol] = key
          mergedRow._merge = 'right_only'
          merged.push(mergedRow)
        }
      })

      const onlyInA = merged.filter((row) => row._merge === 'left_only')
      const onlyInB = merged.filter((row) => row._merge === 'right_only')
      const inBoth = merged.filter((row) => row._merge === 'both')

      return { merged, onlyInA, onlyInB, inBoth }
    }
    return { mergeRows }
  }, [])

  const compareResults = useMemo(() => {
    if (!compareAData || !compareBData || !mergeColumn) return null
    return mergeRows(filteredCompareARows, filteredCompareBRows, mergeColumn, compareAData.name, compareBData.name)
  }, [compareAData, compareBData, mergeColumn, filteredCompareARows, filteredCompareBRows, mergeRows])

  const shareComparison = useMemo(() => {
    if (!sharesData || !espData) return null
    if (!sharesHasGeneratedId || !espHasGeneratedId) return null
    const selectedTypSet = new Set(shareESPCategoriesSelected)
    const filteredEspRows = shareESPCategoriesSelected.length === 0
      ? espData.rows
      : (espData.rows || []).filter((row) => selectedTypSet.has(getEspTypValue(row, espData.columns || [])))

    const filteredEspData = { ...espData, rows: filteredEspRows }
    return compareMultiColumn(sharesData, filteredEspData)
  }, [sharesData, espData, shareESPCategoriesSelected, sharesHasGeneratedId, espHasGeneratedId])

  const shareColumns = useMemo(() => {
    if (!shareComparison) return []
    const uniqueCols = new Set()
    shareComparison.rows.forEach((row) => {
      Object.keys(row).filter((col) => !col.includes('Upper')).forEach((column) => uniqueCols.add(column))
    })
    const ordered = []
    const cols = Array.from(uniqueCols)
    if (cols.includes('CMDB_GeneratedUniqueID')) ordered.push('CMDB_GeneratedUniqueID')
    if (cols.includes('ESP_GeneratedUniqueID')) ordered.push('ESP_GeneratedUniqueID')
    cols.filter((c) => c.startsWith('CMDB_') && c !== 'CMDB_GeneratedUniqueID').sort().forEach((c) => ordered.push(c))
    cols.filter((c) => c.startsWith('ESP_') && c !== 'ESP_GeneratedUniqueID').sort().forEach((c) => ordered.push(c))
    const metadata = ['MatchStatus', 'MatchedSegments']
    metadata.forEach((c) => { if (cols.includes(c)) ordered.push(c) })
    return ordered
  }, [shareComparison])

  const shareFilterValuesOptions = useMemo(() => {
    if (!shareComparison || shareFilterColumn === 'all') return []
    return uniqueValues(shareComparison.rows, shareFilterColumn)
  }, [shareComparison, shareFilterColumn])

  const shareESPCategories = useMemo(() => {
    if (!espData) return []
    const categories = new Set()
    ;(espData.rows || []).forEach((row) => {
      const typ = getEspTypValue(row, espData.columns || [])
      if (typ && String(typ).trim() !== '') {
        categories.add(String(typ).trim())
      }
    })
    return Array.from(categories).sort()
  }, [espData])

  const selectedEspTypSet = useMemo(() => new Set(shareESPCategoriesSelected), [shareESPCategoriesSelected])

  const filteredShareRows = useMemo(() => {
    if (!shareComparison) return []
    let rows = [...shareComparison.rows]
    if (shareFilterColumn !== 'all' && shareFilterColumnValues.length) {
      rows = rows.filter((row) => shareFilterColumnValues.includes(String(row[shareFilterColumn] ?? '')))
    }
    if (shareFilterText) {
      const search = shareFilterText.toLowerCase()
      rows = rows.filter((row) => {
        if (shareSearchColumn !== 'all') {
          return String(row[shareSearchColumn] ?? '').toLowerCase().includes(search)
        }
        return Object.values(row).some((val) => String(val).toLowerCase().includes(search))
      })
    }
    if (shareFilterStatus !== 'all') {
      rows = rows.filter((row) => row.MatchStatus === shareFilterStatus)
    }
    rows.sort((a, b) => {
      const aVal = a[shareSortColumn] ?? ''
      const bVal = b[shareSortColumn] ?? ''
      const comparison = String(aVal).localeCompare(String(bVal))
      return shareSortDirection === 'asc' ? comparison : -comparison
    })
    return rows
  }, [shareComparison, shareFilterText, shareFilterStatus, shareFilterColumn, shareFilterColumnValues, shareSearchColumn, shareSortColumn, shareSortDirection])

  const shareTotalPages = Math.ceil(filteredShareRows.length / sharePageSize) || 1
  const sharePaginatedRows = useMemo(() => {
    const start = (sharePage - 1) * sharePageSize
    return filteredShareRows.slice(start, start + sharePageSize)
  }, [filteredShareRows, sharePage, sharePageSize])

  const shareStats = useMemo(() => {
    if (!shareComparison) return null
    const statsRows = shareComparison.rows
    const sourceTotalA = sharesData?.rows?.length || 0
    const sourceTotalB = shareESPCategoriesSelected.length > 0
      ? (espData?.rows || []).filter((row) => selectedEspTypSet.has(getEspTypValue(row, espData?.columns || []))).length
      : (espData?.rows?.length || 0)
    const totalRows = statsRows.length
    const both = statsRows.filter((row) => row.MatchStatus === 'Both').length
    const onlyInA = statsRows.filter((row) => row.MatchStatus === 'Only in CMDB').length
    const onlyInB = statsRows.filter((row) => row.MatchStatus === 'Only in right file').length
    return {
      totalRows,
      totalA: sourceTotalA,
      totalB: sourceTotalB,
      both,
      onlyInA,
      onlyInB,
      leftMatchRate: onlyInA + both > 0 ? Math.round((both / (onlyInA + both)) * 100) : 0,
      rightMatchRate: onlyInB + both > 0 ? Math.round((both / (onlyInB + both)) * 100) : 0,
      overallMatchRate: totalRows ? Math.round((both / totalRows) * 100) : 0,
    }
  }, [shareComparison, sharesData, espData, selectedEspTypSet])

  useEffect(() => {
    const validSelected = shareESPCategoriesSelected.filter((category) => shareESPCategories.includes(category))
    if (validSelected.length !== shareESPCategoriesSelected.length) {
      setShareESPCategoriesSelected(validSelected)
      setSharePage(1)
    }
  }, [shareESPCategoriesSelected, shareESPCategories])

  useEffect(() => {
    const loadCsvFiles = async () => {
      const parsedOriginalFiles = []
      const parsedGeneratedFiles = []
      const errors = []

      for (const [path, loader] of Object.entries(originalCsvSources)) {
        const name = path.replace('../', '')
        try {
          const text = await loader()
          const parsed = parseCsvText(name, text)
          if (!name.toLowerCase().includes('_with_uniqueid')) {
            parsedOriginalFiles.push(parsed)
          }
        } catch (e) {
          errors.push(`Failed to load original file ${name}: ${e}`)
        }
      }

      for (const [path, loader] of Object.entries(generatedCsvSources)) {
        const name = path.replace('../ID_generated/', '')
        try {
          const text = await loader()
          const parsed = parseCsvText(name, text)
          parsedGeneratedFiles.push(parsed)
        } catch (e) {
          errors.push(`Failed to load generated file ${name}: ${e}`)
        }
      }

      setOriginalFiles(parsedOriginalFiles)
      setGeneratedFiles(parsedGeneratedFiles)
      if (errors.length > 0) setError(errors.join('; '))
    }
    loadCsvFiles()
  }, [])

  const reloadGeneratedFiles = async () => {
    try {
      const res = await fetch('/api/read-generated')
      const result = await res.json()
      if (result.ok && result.files) {
        const parsed = result.files.map((f) => parseCsvText(f.fileName, f.content))
        setGeneratedFiles(parsed)
      }
    } catch (e) {
      console.error('Failed to reload generated files:', e)
    }
  }

  return (
    <div className="app-shell">
      <header>
        <h1><Icon name="dashboard" size={32} /> CIO Data Intelligence</h1>
        <div className="header-copy">
          <p>CMDB vs ESP data intelligence and insight.</p>
          <p>Designed by Mohammed Kmail</p>
        </div>
      </header>

      {viewMode !== VIEW_MODES[3].id && (
        <section className="upload-panel">
          <div className="upload-label">
            <Icon name="folder" size={22} />
            <span>
              Single File: {originalFiles.length} original CSV file{originalFiles.length !== 1 ? 's' : ''} ·
              Compare: {generatedFiles.length} generated CSV file{generatedFiles.length !== 1 ? 's' : ''} from ID_generated
            </span>
          </div>
          <label className="upload-action">
            <Icon name="upload" size={20} />
            <span>Upload file</span>
            <input type="file" accept=".csv,.xlsx,.xls" multiple onChange={handleFileUpload} />
          </label>
          {uploadedFiles.length > 0 && (
            <div className="uploaded-files-list">
              {uploadedFiles.map((file) => (
                <span key={file.name} className="uploaded-file-tag">
                  <Icon name="file" size={14} />
                  {file.name}
                  <button type="button" className="remove-file-btn" onClick={() => removeUploadedFile(file.name)} title="Remove file">
                    <Icon name="close" size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
          {error && <div className="error-box"><Icon name="warning" size={20} /> {error}</div>}
        </section>
      )}

      <section className="tabs">
        {VIEW_MODES.map((mode) => (
          <button
            key={mode.id}
            className={mode.id === viewMode ? 'active' : ''}
            type="button"
            onClick={() => setViewMode(mode.id)}
            title={mode.label}
          >
            <Icon name={mode.icon} size={20} />
            {mode.label}
          </button>
        ))}
      </section>

      <div className="content">
        <main>
          {viewMode === VIEW_MODES[0].id && (
            <SingleFilePage
              Icon={Icon}
              originalLoadedNames={originalLoadedNames}
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              selectedFileData={selectedFileData}
              setUniqueIdColumns={setUniqueIdColumns}
              setGeneratedUniqueIds={setGeneratedUniqueIds}
              setShowUniqueIdModal={setShowUniqueIdModal}
              filterColumn={filterColumn}
              setFilterColumn={setFilterColumn}
              filterValues={filterValues}
              setFilterValues={setFilterValues}
              singleFilterText={singleFilterText}
              setSingleFilterText={setSingleFilterText}
              singleSearchColumn={singleSearchColumn}
              setSingleSearchColumn={setSingleSearchColumn}
              filteredSingleRows={filteredSingleRows}
              singleFilterStats={singleFilterStats}
            />
          )}

          {viewMode === VIEW_MODES[1].id && (
            <CompareFilesPage
              Icon={Icon}
              generatedLoadedNames={generatedLoadedNames}
              compareA={compareA}
              setCompareA={setCompareA}
              compareB={compareB}
              setCompareB={setCompareB}
              compareAData={compareAData}
              compareBData={compareBData}
              filteredCompareARows={filteredCompareARows}
              filteredCompareBRows={filteredCompareBRows}
              commonColumns={commonColumns}
              compareFilterA={compareFilterA}
              setCompareFilterA={setCompareFilterA}
              compareFilterValuesA={compareFilterValuesA}
              setCompareFilterValuesA={setCompareFilterValuesA}
              compareFilterB={compareFilterB}
              setCompareFilterB={setCompareFilterB}
              compareFilterValuesB={compareFilterValuesB}
              setCompareFilterValuesB={setCompareFilterValuesB}
              mergeColumn={mergeColumn}
              setMergeColumn={setMergeColumn}
              showDifferences={showDifferences}
              setShowDifferences={setShowDifferences}
              compareResults={compareResults}
            />
          )}

          {viewMode === VIEW_MODES[2].id && (
            <CompareUniqueIdsPage
              Icon={Icon}
              InlineIcon={InlineIcon}
              SectionHeading={SectionHeading}
              generatedLoadedNames={generatedLoadedNames}
              selectedSharesFile={selectedSharesFile}
              setSelectedSharesFile={setSelectedSharesFile}
              selectedEspFile={selectedEspFile}
              setSelectedEspFile={setSelectedEspFile}
              shareESPCategories={shareESPCategories}
              shareESPCategoriesSelected={shareESPCategoriesSelected}
              setShareESPCategoriesSelected={setShareESPCategoriesSelected}
              shareComparison={shareComparison}
              shareStats={shareStats}
              filteredShareRows={filteredShareRows}
              shareColumns={shareColumns}
              sharePaginatedRows={sharePaginatedRows}
              sharePage={sharePage}
              setSharePage={setSharePage}
              shareTotalPages={shareTotalPages}
              sharePageSize={sharePageSize}
              setSharePageSize={setSharePageSize}
              shareSortColumn={shareSortColumn}
              setShareSortColumn={setShareSortColumn}
              shareSortDirection={shareSortDirection}
              setShareSortDirection={setShareSortDirection}
              shareFilterText={shareFilterText}
              setShareFilterText={setShareFilterText}
              shareSearchColumn={shareSearchColumn}
              setShareSearchColumn={setShareSearchColumn}
              shareFilterStatus={shareFilterStatus}
              setShareFilterStatus={setShareFilterStatus}
              shareFilterColumn={shareFilterColumn}
              setShareFilterColumn={setShareFilterColumn}
              shareFilterColumnValues={shareFilterColumnValues}
              setShareFilterColumnValues={setShareFilterColumnValues}
              shareFilterValuesOptions={shareFilterValuesOptions}
              shareTotalRows={filteredShareRows.length}
              selectedShareRow={selectedShareRow}
              setSelectedShareRow={setSelectedShareRow}
              sharesData={sharesData}
              espData={espData}
              sharesHasGeneratedId={sharesHasGeneratedId}
              espHasGeneratedId={espHasGeneratedId}
            />
          )}

          {viewMode === VIEW_MODES[3].id && (
            <InfoPage Icon={Icon} SectionHeading={SectionHeading} />
          )}
        </main>
      </div>

      {showUniqueIdModal && selectedFileData && (
        <UniqueIdGeneratorModal
          Icon={Icon}
          selectedFile={selectedFile}
          selectedFileData={selectedFileData}
          uniqueIdColumns={uniqueIdColumns}
          setUniqueIdColumns={setUniqueIdColumns}
          generatedUniqueIds={generatedUniqueIds}
          setGeneratedUniqueIds={setGeneratedUniqueIds}
          onClose={() => setShowUniqueIdModal(false)}
          onSaved={reloadGeneratedFiles}
        />
      )}
    </div>
  )
}

export default App