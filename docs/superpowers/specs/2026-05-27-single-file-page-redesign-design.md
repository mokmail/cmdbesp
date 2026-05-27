# Single File Page - Professional Redesign with Drag & Drop

**Date:** 2026-05-27
**Status:** Approved

## Overview

Redesign the Single File Page tab to feature a professional drag-and-drop file upload interface with a split-panel layout. The new design separates the upload zone (left) from the file management panel (right), providing clear visual hierarchy and improved user experience.

## Design Direction

**Selected Approach: Split Panel (Option C)**

### Layout Structure

```
+------------------+------------------+
|                  |                  |
|   Upload Zone    |  Uploaded Files  |
|   (Drop Area)    |     Panel        |
|                  |                  |
|   [Browse]       |  - file1.csv     |
|                  |  - file2.xlsx    |
|                  |                  |
+------------------+------------------+
```

### Components

#### Left Panel - Upload Zone
- Large drag-and-drop area with dashed border
- Cloud upload icon with gradient background
- Title: "Upload Area"
- Subtitle: "Drag & drop files here or click to browse"
- "Browse Files" button for click-to-upload fallback
- Visual feedback states:
  - **Default:** Dashed gray border
  - **Drag hover:** Blue dashed border with subtle blue background tint
  - **Active:** Solid blue border with glow effect

#### Right Panel - Uploaded Files
- Header with file count and folder icon
- List of uploaded files with:
  - File icon
  - Filename
  - Status badge (Ready / Processing / Error)
  - Remove button (X icon)
- Scrollable if many files

### Visual Design

**Color Palette:**
- Primary accent: `#2563eb` (blue)
- Success: `#059669` (green)
- Warning: `#d97706` (amber)
- Error: `#dc2626` (red)
- Background: `#f4f7fb`
- Card background: `#ffffff`
- Border: `#d9e2ec`
- Text primary: `#0f172a`
- Text muted: `#64748b`

**Typography:**
- Headings: 16-18px, semi-bold
- Body: 14px regular
- Labels: 12px uppercase with letter-spacing

**Spacing:**
- Card padding: 24px
- Gap between panels: 24px
- Border radius: 12px (cards), 8px (buttons/badges)

**Elevation:**
- Cards: `box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08)`
- Active drop zone: `box-shadow: 0 4px 16px rgba(37, 99, 235, 0.3)`

## Features

### 1. Drag & Drop Upload
- HTML5 drag-and-drop API
- Click-to-browse fallback (hidden file input)
- Accepts: `.csv`, `.xlsx`, `.xls` files
- Multiple file selection supported
- Visual feedback during drag operations

### 2. File Status Indicators
- **Ready** (green badge): File uploaded and processed
- **Processing** (amber badge): File being parsed
- **Error** (red badge): File failed to parse

### 3. File Management
- Remove individual files via X button
- Files listed with icon, name, and status
- Click file to select as active data source

### 4. Professional Polish
- Smooth transitions on hover
- Loading states during file processing
- Error messages for failed uploads
- Empty state when no files uploaded

## Implementation Notes

### Component: `SingleFilePage.jsx`
- Add `useState` for drag state (`isDragging`)
- Implement `handleDragOver`, `handleDragLeave`, `handleDrop`
- File input ref remains for click-to-upload
- Split layout with CSS grid

### CSS Classes to Add
- `.upload-split-panel` - Grid container for two columns
- `.upload-zone` - Left panel drop area
- `.upload-zone.dragging` - Active drag state styling
- `.file-list-panel` - Right panel file list
- `.file-item` - Individual file row
- `.file-status-badge` - Status indicator pills

### State Management
- `pendingFiles`: Files selected but not yet uploaded
- `uploadedFiles`: Files that have been processed
- `isDragging`: Boolean for drag visual state

## Acceptance Criteria

1. Drag-and-drop zone shows visual feedback when files are dragged over
2. Click on zone opens file browser
3. Selected files appear in right panel with status badges
4. Files can be removed individually
5. Send button triggers upload process for pending files
6. Existing file selection dropdown remains functional
7. All existing filtering and search functionality preserved