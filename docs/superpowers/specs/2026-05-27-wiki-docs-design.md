# Info Page Wiki Documentation System - Design Spec

**Date:** 2026-05-27
**Status:** Draft

## Overview

Transform the Info page into a professional wiki-style documentation system with sidebar navigation, multiple doc pages, search functionality, and interactive elements.

## Architecture

### Tech Stack
- **Routing:** React Router v6 (hash-based routing for simplicity)
- **Styling:** CSS modules or existing CSS variables
- **Diagrams:** Mermaid.js (already in use)
- **Icons:** Existing Icon component from App.jsx

### Page Structure

```
/#/getting-started          - Overview & quick start
/#/features/single-file      - Single file view documentation
/#/features/compare-ids     - Compare Unique IDs documentation
/#/features/uniqueid-gen    - UniqueID Generator documentation
/#/how-to/                  - Step-by-step tutorials
/#/reference/file-formats   - Supported file formats
/#/reference/columns        - Column definitions
/#/reference/troubleshooting - Common issues & solutions
```

### Component Hierarchy

```
WikiDocumentation
├── WikiSidebar
│   ├── WikiLogo
│   ├── WikiSearch
│   └── WikiNavTree (collapsible sections)
├── WikiContent
│   ├── WikiBreadcrumb
│   ├── WikiPage (renders md content)
│   └── WikiNavigationFooter (prev/next)
└── WikiTOC (optional right-side TOC for long pages)
```

## Features

### 1. Sidebar Navigation
- Collapsible sections (Getting Started, Features, How-to, Reference)
- Active page highlighting
- Section icons using existing Icon component
- Smooth expand/collapse animations

### 2. Search
- Global search across all documentation pages
- Keyboard shortcut (Cmd/Ctrl + K)
- Fuzzy matching results

### 3. Content Rendering
- Markdown-style content with custom components
- Collapsible sections (accordion style)
- Code blocks with syntax highlighting
- Interactive Mermaid diagrams (already working)
- Info boxes (tip, warning, note)

### 4. Navigation
- Breadcrumb trail on each page
- Previous/Next page navigation at bottom
- Table of contents for long pages

## Design System

### Colors (using existing CSS variables)
- Primary: `--primary-color` (blue)
- Sidebar background: `--bg-secondary`
- Content background: `--bg-primary`
- Active item: `--primary-light`
- Text: `--text-primary`, `--text-secondary`

### Typography
- Headings: Inter/system-ui font
- Body: Inter/system-ui
- Code: monospace

### Spacing
- Sidebar width: 280px
- Content max-width: 900px
- Section padding: 24px
- Component spacing: 16px

## Pages Content

### Getting Started
1. **Overview** - What is CIO Data Intelligence
2. **Quick Start** - 3-step tutorial to start comparing files

### Features
1. **Single File View** - Browse, search, filter CSV files
2. **Compare Unique IDs** - How comparison works, interpreting results
3. **UniqueID Generator** - How to create and use generated IDs
4. **File Upload** - Upload and manage CSV/XLSX files

### How-to Guides
1. **Compare Files** - Step-by-step comparison workflow
2. **Filter Results** - Advanced filtering and search
3. **Export Data** - Export comparison results

### Reference
1. **File Formats** - CSV, XLSX specifications
2. **Column Definitions** - Common column meanings
3. **Troubleshooting** - Common issues and solutions

## Component States

### WikiNavItem
- Default: text color
- Hover: background highlight
- Active: primary color left border, bold text
- Expanded: chevron rotates 90°

### WikiSearch
- Default: placeholder text
- Focus: border highlight, show recent searches
- Results: dropdown with categorized results

### WikiAccordion
- Collapsed: show header only
- Expanded: show content with smooth height animation
- Hover: subtle background change

## Implementation Notes

1. Keep existing InfoPage component as fallback
2. Use React Router's HashRouter for simple routing without server config
3. Documentation content stored as JS objects/modules for easy editing
4. Reuse existing Icon component for consistency
5. Mermaid diagrams work as-is in the new structure

## Scope for First Implementation

Phase 1:
- Wiki layout with sidebar
- 4-5 core doc pages (Getting Started, Single File, Compare IDs, UniqueID Gen, Quick Reference)
- Basic search
- Prev/Next navigation
- Responsive sidebar (collapses on mobile)

Phase 2 (future):
- Advanced search
- More documentation pages
- Comments/feedback system
- Version tracking