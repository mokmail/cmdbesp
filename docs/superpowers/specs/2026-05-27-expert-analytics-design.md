# Expert Analytics & Reporting Page - Design Specification

**Date:** 2026-05-27
**Status:** Approved

---

## 1. Overview

The Expert Analytics & Reporting page provides a comprehensive analytics suite for the cmdbesp application, enabling performance analysis, pattern detection, data quality reporting, and business intelligence dashboards. This page is purely additive and does not modify existing SingleFilePage or CompareUniqueIdsPage components.

**Technology Stack:**
- Frontend: React 19 + Vite
- Backend: Node.js with SQLite
- Charts: Chart.js or Recharts
- Tables: Existing AG Grid/TanStack/DataTables implementations

---

## 2. Architecture

### 2.1 High-Level Structure

```
ExpertAnalyticsPage.jsx
├── Dashboard Grid (react-grid-layout or CSS Grid)
├── Widget Registry (widgetRegistry.js)
├── AnalyticsContext (shared state, API client)
└── Widgets (self-contained, independently loadable)
```

### 2.2 Component Structure

```
src/components/Analytics/
├── ExpertAnalyticsPage.jsx      # Main page component
├── context/
│   └── AnalyticsContext.jsx      # Shared state, API client
├── widgets/
│   ├── MatchRateWidget.jsx       # KPI + trend sparkline
│   ├── SegmentFrequencyWidget.jsx # Bar chart of top segments
│   ├── DataQualityWidget.jsx     # Issues summary table
│   ├── FileMetricsWidget.jsx    # Upload volume, processing times
│   ├── ComparisonHistoryWidget.jsx # Chronological log
│   ├── TrendChartWidget.jsx      # Line charts over time
│   ├── DrillDownModal.jsx        # Click-through to detail
│   └── ExportWidget.jsx          # Report generation
├── hooks/
│   ├── useWidgetData.js          # Data fetching + caching
│   └── useExport.js              # Export logic
└── utils/
    └── widgetRegistry.js         # Widget configuration registry
```

### 2.3 Backend Structure

```
server.js (additions)
├── /api/analytics/* endpoints
└── analytics.db (SQLite)
```

---

## 3. Widget System

### 3.1 Widget Contract

Each widget implements this interface:

```javascript
{
  id: 'widget-id',                    // Unique identifier
  title: 'Widget Title',             // Display name
  type: 'kpi-card' | 'chart' | 'table' | 'history',
  defaultSize: { w: 6, h: 3 },       // 12-column grid
  minSize: { w: 4, h: 2 },           // Minimum constraints
  dataEndpoint: '/api/analytics/...', // API endpoint
  refreshInterval: 30000,            // Auto-refresh (ms), null = manual
  exportFormats: ['csv', 'pdf'],      // Supported exports
}
```

### 3.2 Widget Types

| Type | Purpose | Examples |
|------|---------|----------|
| `kpi-card` | Single metric with trend indicator | Match rate %, total comparisons |
| `chart` | Visual data representation | Bar chart, line graph, pie chart |
| `table` | Tabular data with drill-down | Top segments, quality issues |
| `history` | Chronological list | Comparison log, audit trail |

### 3.3 Shared State (AnalyticsContext)

- `currentSession` - Active file pair being analyzed
- `dateRange` - Global filter for time-based queries
- `userRole` - 'analyst' | 'executive'
- `refreshAll()` - Trigger refresh across widgets

---

## 4. Data Model

### 4.1 Database Schema (SQLite)

```sql
-- Comparison sessions (tracks file pairs analyzed)
CREATE TABLE analytics_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  left_file TEXT NOT NULL,
  right_file TEXT NOT NULL,
  total_rows INTEGER,
  match_count INTEGER,
  left_only_count INTEGER,
  right_only_count INTEGER,
  match_rate REAL
);

-- UniqueID segment frequency cache
CREATE TABLE segment_frequencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER REFERENCES analytics_sessions(id),
  segment_value TEXT NOT NULL,
  frequency INTEGER NOT NULL,
  position INTEGER,
  UNIQUE(session_id, segment_value, position)
);

-- Data quality issues log
CREATE TABLE quality_issues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER REFERENCES analytics_sessions(id),
  file_name TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  column_name TEXT,
  row_count INTEGER,
  sample_values TEXT
);

-- File processing metrics
CREATE TABLE file_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER REFERENCES analytics_sessions(id),
  file_name TEXT NOT NULL,
  file_size INTEGER,
  row_count INTEGER,
  upload_time DATETIME,
  processing_time_ms INTEGER,
  issues_count INTEGER
);

-- Audit log
CREATE TABLE comparison_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  action TEXT NOT NULL,
  session_id INTEGER REFERENCES analytics_sessions(id),
  details TEXT
);
```

---

## 5. API Endpoints

### 5.1 Endpoint Specification

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/analytics | Dashboard overview |
| GET | /api/analytics/sessions | List sessions (paginated) |
| POST | /api/analytics/sessions | Create session |
| GET | /api/analytics/sessions/:id | Get session details |
| GET | /api/analytics/sessions/:id/segments | Segment frequencies |
| GET | /api/analytics/sessions/:id/quality | Quality issues |
| GET | /api/analytics/match-rates | Match rate time-series |
| GET | /api/analytics/segments | Global segment frequencies |
| GET | /api/analytics/quality | Recent quality issues |
| GET | /api/analytics/metrics | File processing metrics |
| GET | /api/analytics/trends | Time-series for charts |
| GET | /api/analytics/history | Audit log |
| POST | /api/analytics/export | Generate export |
| GET | /api/analytics/drilldown/:type/:id | Drill-down detail |

### 5.2 Response Format

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-05-27T10:30:00Z",
    "cached": false,
    "nextRefresh": 30000
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

---

## 6. Dashboard Layout

### 6.1 Grid Layout (12-column)

```
┌────────────────────┬────────────────────┐
│   Match Rate KPI   │   Match Rate KPI   │
│     (w:6, h:3)     │     (w:6, h:3)     │
├────────────────────┴────────────────────┤
│         Trend Chart (w:12, h:4)         │
├────────────────────┬────────────────────┤
│ Segment Frequency │   Data Quality     │
│     (w:6, h:4)    │     (w:6, h:4)     │
├────────────────────┴────────────────────┤
│     File Metrics Widget (w:12, h:3)     │
├────────────────────┬────────────────────┤
│  Comparison History│     Export         │
│     (w:8, h:5)     │    (w:4, h:5)      │
└────────────────────┴────────────────────┘
```

### 6.2 Role-Based Views

- **Executive View**: KPI cards, trend charts, summary tables
- **Analyst View**: Full widgets, drill-down, raw data, exports

---

## 7. Implementation Phases

### Phase 1: Foundation
- SQLite database setup
- Analytics tables
- Session CRUD API
- AnalyticsContext
- Widget registry
- Basic grid layout
- MatchRateWidget
- ComparisonHistoryWidget

### Phase 2: Data Collection
- Auto-log comparison results
- Segment frequency endpoints
- Quality issues endpoints
- FileMetricsWidget
- DataQualityWidget

### Phase 3: Visualization
- TrendChartWidget
- SegmentFrequencyWidget
- Time-series API endpoints
- Connect to real data

### Phase 4: Advanced Features
- DrillDownModal
- ExportWidget
- Export generation API
- Role-based view switching

### Phase 5: Polish
- Caching optimization
- Responsive adjustments
- Error handling
- Loading states

---

## 8. Progressive Enhancement

| Phase | localStorage | Backend | Features |
|-------|-------------|---------|----------|
| 1-2 | Required | Optional | Basic caching |
| 3+ | Cache only | Required | Full analytics |

Graceful degradation: widgets show "no data" state if backend unavailable.

---

## 9. Constraints

1. **No Existing Page Modification**: SingleFilePage and CompareUniqueIdsPage remain unchanged
2. **Purely Additive**: Analytics page adds functionality without affecting existing workflows
3. **Backward Compatible**: Backend changes don't affect existing API contracts
4. **Modular Widgets**: Each widget is independently testable and deployable
