# Single File Page - Professional Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Single File Page tab with a split-panel drag-and-drop interface for file uploads.

**Architecture:** Split-panel layout with left side for drag-drop upload zone and right side for uploaded files list. Uses HTML5 drag-and-drop API with click-to-upload fallback. CSS Grid for layout.

**Tech Stack:** React, CSS (existing design system)

---

## Files

**Modify:**
- `src/components/SingleFilePage.jsx` - Main component with drag-drop logic
- `src/App.css` - Split panel and upload zone styles

**Read:**
- `src/components/SingleFilePage.jsx` - Current implementation
- `src/App.css` - Current styles

---

## Tasks

### Task 1: Add CSS for Split Panel and Upload Zone

**Files:**
- Modify: `src/App.css:2000-2100` (append new styles)

- [ ] **Step 1: Add upload zone and split panel CSS**

Append these styles to `src/App.css`:

```css
/* Split Panel Upload Layout */
.upload-split-panel {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

@media (max-width: 768px) {
  .upload-split-panel {
    grid-template-columns: 1fr;
  }
}

/* Upload Zone - Left Panel */
.upload-zone {
  background: var(--bg-elevated);
  border: 2px dashed var(--border);
  border-radius: 12px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
}

.upload-zone:hover {
  border-color: var(--accent-border);
  background: var(--accent-bg);
}

.upload-zone.dragging {
  border-color: var(--accent);
  border-style: solid;
  background: var(--accent-bg);
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.2);
}

.upload-zone-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.3);
}

.upload-zone-icon .app-icon {
  color: white;
}

.upload-zone h3 {
  margin: 0 0 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-h);
}

.upload-zone p {
  margin: 0 0 1.25rem;
  font-size: 0.875rem;
  color: var(--text-muted);
}

.upload-zone-browse {
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.upload-zone-browse:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow);
}

/* File List Panel - Right Panel */
.file-list-panel {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.5rem;
}

.file-list-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--border);
}

.file-list-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-h);
}

.file-list-header .file-count {
  background: var(--accent-bg);
  color: var(--accent);
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 320px;
  overflow-y: auto;
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.file-item:hover {
  border-color: var(--accent-border);
  box-shadow: var(--shadow-sm);
}

.file-item-info {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.file-item-icon .app-icon {
  color: var(--accent);
}

.file-item-name {
  font-size: 0.875rem;
  color: var(--text);
  font-weight: 500;
}

.file-status-badge {
  padding: 0.25rem 0.625rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

.file-status-badge.ready {
  background: var(--success-bg);
  color: var(--success);
}

.file-status-badge.processing {
  background: var(--warning-bg);
  color: var(--warning);
}

.file-status-badge.error {
  background: var(--error-bg);
  color: var(--error);
}

.file-item-remove {
  background: none;
  border: none;
  padding: 0.375rem;
  cursor: pointer;
  color: var(--text-muted);
  border-radius: 4px;
  transition: all 0.15s ease;
}

.file-item-remove:hover {
  background: var(--error-bg);
  color: var(--error);
}

.file-list-empty {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--text-muted);
  font-size: 0.875rem;
  font-style: italic;
}

.pending-files-section {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px dashed var(--border);
}

.pending-files-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.pending-files-header h5 {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.pending-files-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.pending-file-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  background: var(--warning-bg);
  border: 1px solid var(--warning);
  border-radius: 6px;
  font-size: 0.8125rem;
  color: var(--warning);
}

.send-upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.send-upload-btn:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow);
}
```

- [ ] **Step 2: Verify CSS syntax is valid**

Run: `npm run lint 2>&1 | head -20`

---

### Task 2: Implement Drag-and-Drop Functionality in SingleFilePage

**Files:**
- Modify: `src/components/SingleFilePage.jsx`

- [ ] **Step 1: Read current SingleFilePage implementation**

Read the full file to understand current state structure.

- [ ] **Step 2: Update imports to include useState**

Current line 1:
```jsx
import { useRef, useState } from 'react'
```
Keep as-is (useState already imported).

- [ ] **Step 3: Add drag state and handlers to SingleFilePage component**

Find the component function and add drag state after the existing state:

```jsx
const [pendingFiles, setPendingFiles] = useState([])
const [isDragging, setIsDragging] = useState(false)
```

- [ ] **Step 4: Add drag event handlers**

Add these functions before the return statement:

```jsx
const handleDragOver = (event) => {
  event.preventDefault()
  event.stopPropagation()
  setIsDragging(true)
}

const handleDragLeave = (event) => {
  event.preventDefault()
  event.stopPropagation()
  setIsDragging(false)
}

const handleDrop = (event) => {
  event.preventDefault()
  event.stopPropagation()
  setIsDragging(false)
  
  const files = Array.from(event.dataTransfer.files || [])
  if (files.length > 0) {
    setPendingFiles(prev => [...prev, ...files])
  }
}
```

- [ ] **Step 5: Replace the existing file controls row with split panel layout**

Find the row that contains the file selection controls (lines 41-100 approximately). Replace the entire `<div className="row">` section with the new split panel:

```jsx
<div className="upload-split-panel">
  {/* Left Panel - Upload Zone */}
  <div
    className={`upload-zone ${isDragging ? 'dragging' : ''}`}
    onDragOver={handleDragOver}
    onDragLeave={handleDragLeave}
    onDrop={handleDrop}
    onClick={() => fileInputRef.current?.click()}
  >
    <div className="upload-zone-icon">
      <Icon name="upload" size={28} />
    </div>
    <h3>Upload Area</h3>
    <p>Drag & drop files here or click to browse</p>
    <button type="button" className="upload-zone-browse">
      Browse Files
    </button>
    <input
      ref={fileInputRef}
      type="file"
      accept=".csv,.xlsx,.xls"
      multiple
      onChange={(event) => {
        const files = Array.from(event.target.files || [])
        if (files.length > 0) {
          setPendingFiles(prev => [...prev, ...files])
        }
        event.target.value = ''
      }}
      style={{ display: 'none' }}
    />
  </div>

  {/* Right Panel - File List */}
  <div className="file-list-panel">
    <div className="file-list-header">
      <Icon name="folder" size={18} />
      <h4>Uploaded Files</h4>
      <span className="file-count">{uploadedFiles.length}</span>
    </div>
    
    {uploadedFiles.length === 0 ? (
      <div className="file-list-empty">
        No files uploaded yet
      </div>
    ) : (
      <div className="file-list">
        {uploadedFiles.map((file) => (
          <div key={file.name} className="file-item">
            <div className="file-item-info">
              <span className="file-item-icon">
                <Icon name="file" size={18} />
              </span>
              <span className="file-item-name">{file.name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="file-status-badge ready">Ready</span>
              <button
                type="button"
                className="file-item-remove"
                onClick={() => removeUploadedFile(file.name)}
                title="Remove file"
              >
                <Icon name="close" size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    )}

    {/* Pending Files Section */}
    {pendingFiles.length > 0 && (
      <div className="pending-files-section">
        <div className="pending-files-header">
          <h5>Pending Upload ({pendingFiles.length})</h5>
        </div>
        <div className="pending-files-list">
          {pendingFiles.map((file, index) => (
            <span key={`${file.name}-${index}`} className="pending-file-tag">
              <Icon name="file" size={14} />
              {file.name}
            </span>
          ))}
        </div>
        <button
          type="button"
          className="send-upload-btn"
          style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}
          onClick={() => {
            if (pendingFiles.length > 0) {
              handleFileUpload({ target: { files: pendingFiles } })
              setPendingFiles([])
            }
          }}
        >
          <Icon name="send" size={18} /> Upload {pendingFiles.length} File{pendingFiles.length > 1 ? 's' : ''}
        </button>
      </div>
    )}
  </div>
</div>
```

- [ ] **Step 5: Verify changes compile**

Run: `npm run lint 2>&1 | grep -E "(error|SingleFilePage)" | head -10`

---

### Task 3: Verify Complete Functionality

**Files:**
- Modify: `src/components/SingleFilePage.jsx`

- [ ] **Step 1: Ensure UniqueID Generator button is preserved**

After the split panel, ensure the UniqueID Generator button is still present for when a file is selected:

```jsx
{selectedFileData && (
  <button
    type="button"
    className="action-button"
    onClick={() => {
      setUniqueIdColumns([])
      setGeneratedUniqueIds(null)
      setShowUniqueIdModal(true)
    }}
  >
    <Icon name="key" size={20} /> UniqueID Generator
  </button>
)}
```

- [ ] **Step 2: Ensure error display is preserved**

Ensure the error box rendering remains intact after the split panel:

```jsx
{error && <div className="error-box"><Icon name="warning" size={20} /> {error}</div>}
```

- [ ] **Step 3: Run full lint check**

Run: `npm run lint 2>&1 | head -30`

---

### Task 4: Test the Implementation

- [ ] **Step 1: Start dev server**

Run: `npm run dev`

- [ ] **Step 2: Verify in browser**
- Open the Single File tab
- Verify split panel layout appears
- Test drag-and-drop by dragging a file over the upload zone
- Test click-to-upload by clicking the upload zone
- Verify pending files appear with send button
- Verify uploaded files appear in right panel with remove option

---

## Notes

- The send icon (`send`) was already added to `ICONS` in `App.jsx` during the previous fix
- All existing functionality (file selection dropdown, filtering, search) is preserved as the new layout is additional, not replacement
- Error handling for invalid file types remains the same via `handleFileUpload` function in parent