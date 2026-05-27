# Expert Analytics & Reporting - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Expert Analytics & Reporting page with widget-based dashboard, backend persistence, and progressive enhancement across 5 phases.

**Architecture:** Widget-based React dashboard with SQLite backend. Each widget is self-contained with dedicated API endpoint. Phases build sequentially - Phase 1 foundation required before subsequent phases.

**Tech Stack:** React 19, SQLite (better-sqlite3), Node.js HTTP server, Chart.js or Recharts, existing AG Grid/TanStack

---

## File Structure

```
src/components/Analytics/
├── ExpertAnalyticsPage.jsx      # Main page (NEW)
├── context/
│   └── AnalyticsContext.jsx      # Shared state & API client (NEW)
├── widgets/
│   ├── MatchRateWidget.jsx       # KPI card (NEW)
│   ├── ComparisonHistoryWidget.jsx # History list (NEW)
│   ├── SegmentFrequencyWidget.jsx # Bar chart (NEW - Phase 3)
│   ├── DataQualityWidget.jsx     # Issues table (NEW - Phase 2)
│   ├── FileMetricsWidget.jsx    # Metrics (NEW - Phase 2)
│   ├── TrendChartWidget.jsx      # Line charts (NEW - Phase 3)
│   ├── DrillDownModal.jsx        # Detail modal (NEW - Phase 4)
│   └── ExportWidget.jsx          # Export (NEW - Phase 4)
├── hooks/
│   ├── useWidgetData.js          # Data fetching hook (NEW)
│   └── useExport.js               # Export hook (NEW - Phase 4)
└── utils/
    └── widgetRegistry.js         # Widget config registry (NEW)

server.js                          # MODIFY - add analytics API routes
package.json                        # MODIFY - add better-sqlite3 dependency
docs/superpowers/plans/            # This plan location
```

---

## PHASE 1: Foundation

### Task 1: Backend SQLite Setup

**Files:**
- Modify: `package.json`
- Modify: `server.js`
- Create: `server/analytics-db.js`

- [ ] **Step 1: Add better-sqlite3 dependency**

Run: `cd /home/kmail/cmdbesp && npm install better-sqlite3 --save`

- [ ] **Step 2: Create analytics database module**

Create `server/analytics-db.js`:
```javascript
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'analytics.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS analytics_sessions (
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

  CREATE TABLE IF NOT EXISTS segment_frequencies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER REFERENCES analytics_sessions(id),
    segment_value TEXT NOT NULL,
    frequency INTEGER NOT NULL,
    position INTEGER,
    UNIQUE(session_id, segment_value, position)
  );

  CREATE TABLE IF NOT EXISTS quality_issues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER REFERENCES analytics_sessions(id),
    file_name TEXT NOT NULL,
    issue_type TEXT NOT NULL,
    column_name TEXT,
    row_count INTEGER,
    sample_values TEXT
  );

  CREATE TABLE IF NOT EXISTS file_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER REFERENCES analytics_sessions(id),
    file_name TEXT NOT NULL,
    file_size INTEGER,
    row_count INTEGER,
    upload_time DATETIME,
    processing_time_ms INTEGER,
    issues_count INTEGER
  );

  CREATE TABLE IF NOT EXISTS comparison_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    action TEXT NOT NULL,
    session_id INTEGER REFERENCES analytics_sessions(id),
    details TEXT
  );
`);

module.exports = db;
```

- [ ] **Step 3: Add analytics API routes to server.js**

Add after existing routes (around line 200 in server.js):
```javascript
const analyticsDb = require('./analytics-db');

// GET /api/analytics - Dashboard overview
app.get('/api/analytics', (req, res) => {
  try {
    const stats = analyticsDb.prepare(`
      SELECT 
        COUNT(*) as total_sessions,
        AVG(match_rate) as avg_match_rate,
        SUM(total_rows) as total_rows_processed
      FROM analytics_sessions
    `).get();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

// GET /api/analytics/sessions - List sessions
app.get('/api/analytics/sessions', (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const sessions = analyticsDb.prepare(`
      SELECT * FROM analytics_sessions 
      ORDER BY session_date DESC 
      LIMIT ? OFFSET ?
    `).all(limit, offset);
    const total = analyticsDb.prepare('SELECT COUNT(*) as count FROM analytics_sessions').get();
    res.json({ success: true, data: sessions, meta: { total: total.count, page, limit } });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

// POST /api/analytics/sessions - Create session
app.post('/api/analytics/sessions', (req, res) => {
  try {
    const { left_file, right_file, total_rows, match_count, left_only_count, right_only_count } = req.body;
    const match_rate = total_rows > 0 ? ((match_count / total_rows) * 100).toFixed(2) : 0;
    const result = analyticsDb.prepare(`
      INSERT INTO analytics_sessions (left_file, right_file, total_rows, match_count, left_only_count, right_only_count, match_rate)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(left_file, right_file, total_rows, match_count, left_only_count, right_only_count, match_rate);
    
    // Log to comparison_history
    analyticsDb.prepare(`
      INSERT INTO comparison_history (action, session_id, details)
      VALUES ('comparison', ?, ?)
    `).run(result.lastInsertRowid, JSON.stringify({ left_file, right_file }));
    
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

// GET /api/analytics/match-rates - Match rate time-series
app.get('/api/analytics/match-rates', (req, res) => {
  try {
    const { days = 30 } = req.query;
    const rates = analyticsDb.prepare(`
      SELECT session_date, match_rate 
      FROM analytics_sessions 
      WHERE session_date >= datetime('now', '-${parseInt(days)} days')
      ORDER BY session_date ASC
    `).all();
    res.json({ success: true, data: rates });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

// GET /api/analytics/history - Audit log
app.get('/api/analytics/history', (req, res) => {
  try {
    const history = analyticsDb.prepare(`
      SELECT * FROM comparison_history 
      ORDER BY session_date DESC 
      LIMIT 100
    `).all();
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json server.js server/analytics-db.js
git commit -m "feat(analytics): add SQLite backend and basic API endpoints"
```

---

### Task 2: Frontend Context & Widget Registry

**Files:**
- Create: `src/components/Analytics/context/AnalyticsContext.jsx`
- Create: `src/components/Analytics/utils/widgetRegistry.js`
- Create: `src/components/Analytics/hooks/useWidgetData.js`
- Modify: `src/App.jsx` (add route)

- [ ] **Step 1: Create AnalyticsContext**

Create `src/components/Analytics/context/AnalyticsContext.jsx`:
```jsx
import { createContext, useContext, useState, useCallback } from 'react';

const AnalyticsContext = createContext(null);

export function AnalyticsProvider({ children }) {
  const [currentSession, setCurrentSession] = useState(null);
  const [dateRange, setDateRange] = useState({ days: 30 });
  const [userRole, setUserRole] = useState('analyst');
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const refreshAll = useCallback(() => {
    setLastRefresh(Date.now());
  }, []);

  const api = useCallback(async (endpoint, options = {}) => {
    const url = `/api${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error?.message || 'API error');
    return data;
  }, []);

  return (
    <AnalyticsContext.Provider value={{
      currentSession, setCurrentSession,
      dateRange, setDateRange,
      userRole, setUserRole,
      lastRefresh, refreshAll,
      api
    }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) throw new Error('useAnalytics must be used within AnalyticsProvider');
  return context;
};
```

- [ ] **Step 2: Create widgetRegistry**

Create `src/components/Analytics/utils/widgetRegistry.js`:
```javascript
export const widgetRegistry = {
  'match-rate': {
    id: 'match-rate',
    title: 'Match Rate Overview',
    type: 'kpi-card',
    defaultSize: { w: 6, h: 3 },
    minSize: { w: 4, h: 2 },
    dataEndpoint: '/api/analytics',
    refreshInterval: 30000,
  },
  'comparison-history': {
    id: 'comparison-history',
    title: 'Comparison History',
    type: 'history',
    defaultSize: { w: 8, h: 5 },
    minSize: { w: 6, h: 3 },
    dataEndpoint: '/api/analytics/sessions',
    refreshInterval: null,
  },
};

export const getWidgetById = (id) => widgetRegistry[id];
export const getAllWidgets = () => Object.values(widgetRegistry);
```

- [ ] **Step 3: Create useWidgetData hook**

Create `src/components/Analytics/hooks/useWidgetData.js`:
```jsx
import { useState, useEffect, useCallback } from 'react';
import { useAnalytics } from '../context/AnalyticsContext';

export function useWidgetData(endpoint, { refreshInterval = 30000, deps = [] } = {}) {
  const { api, lastRefresh } = useAnalytics();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await api(endpoint);
      setData(result.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [api, endpoint, ...deps]);

  useEffect(() => {
    fetchData();
  }, [fetchData, lastRefresh]);

  useEffect(() => {
    if (!refreshInterval) return;
    const timer = setInterval(fetchData, refreshInterval);
    return () => clearInterval(timer);
  }, [fetchData, refreshInterval]);

  return { data, loading, error, refresh: fetchData };
}
```

- [ ] **Step 4: Add route to App.jsx**

Add import and route after existing routes:
```jsx
import ExpertAnalyticsPage from './components/Analytics/ExpertAnalyticsPage';

// Add route:
<Route path="/expert-analytics" element={<ExpertAnalyticsPage />} />
```

- [ ] **Step 5: Commit**

```bash
git add src/components/Analytics/context/AnalyticsContext.jsx
git add src/components/Analytics/utils/widgetRegistry.js
git add src/components/Analytics/hooks/useWidgetData.js
git add src/App.jsx
git commit -m "feat(analytics): add context, widget registry, and useWidgetData hook"
```

---

### Task 3: ExpertAnalyticsPage & MatchRateWidget

**Files:**
- Create: `src/components/Analytics/ExpertAnalyticsPage.jsx`
- Create: `src/components/Analytics/widgets/MatchRateWidget.jsx`

- [ ] **Step 1: Create ExpertAnalyticsPage**

Create `src/components/Analytics/ExpertAnalyticsPage.jsx`:
```jsx
import { AnalyticsProvider, useAnalytics } from './context/AnalyticsContext';
import { getAllWidgets } from './utils/widgetRegistry';
import MatchRateWidget from './widgets/MatchRateWidget';
import ComparisonHistoryWidget from './widgets/ComparisonHistoryWidget';

const widgetComponents = {
  'match-rate': MatchRateWidget,
  'comparison-history': ComparisonHistoryWidget,
};

function Dashboard() {
  const { userRole, refreshAll, dateRange, setDateRange } = useAnalytics();
  const widgets = getAllWidgets();

  return (
    <div className="expert-analytics">
      <header className="analytics-header">
        <h1>Expert Analytics & Reporting</h1>
        <div className="analytics-controls">
          <select 
            value={dateRange.days} 
            onChange={(e) => setDateRange({ days: Number(e.target.value) })}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button onClick={refreshAll}>Refresh</button>
        </div>
      </header>

      <div className="analytics-grid">
        {widgets.map((widget) => {
          const Component = widgetComponents[widget.id];
          if (!Component) return null;
          return (
            <div 
              key={widget.id} 
              className={`widget widget-${widget.type}`}
              style={{ gridColumn: `span ${widget.defaultSize.w}` }}
            >
              <Component config={widget} />
            </div>
          );
        })}
      </div>

      <style>{`
        .expert-analytics { padding: 20px; }
        .analytics-header { 
          display: flex; 
          justify-content: space-between; 
          align-items: center;
          margin-bottom: 20px;
        }
        .analytics-controls { display: flex; gap: 10px; }
        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 20px;
        }
        .widget { background: #fff; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .widget-kpi-card { min-height: 120px; }
        .widget-history { min-height: 200px; overflow: auto; }
      `}</style>
    </div>
  );
}

export default function ExpertAnalyticsPage() {
  return (
    <AnalyticsProvider>
      <Dashboard />
    </AnalyticsProvider>
  );
}
```

- [ ] **Step 2: Create MatchRateWidget**

Create `src/components/Analytics/widgets/MatchRateWidget.jsx`:
```jsx
import { useWidgetData } from '../hooks/useWidgetData';

export default function MatchRateWidget({ config }) {
  const { data, loading, error } = useWidgetData(config.dataEndpoint, {
    refreshInterval: config.refreshInterval,
  });

  if (loading) return <div className="widget-loading">Loading...</div>;
  if (error) return <div className="widget-error">{error}</div>;

  const matchRate = data?.avg_match_rate?.toFixed(1) || '0.0';
  const totalRows = data?.total_rows_processed?.toLocaleString() || '0';

  return (
    <div className="match-rate-widget">
      <h3>{config.title}</h3>
      <div className="kpi-value">{matchRate}%</div>
      <div className="kpi-label">Average Match Rate</div>
      <div className="kpi-secondary">{totalRows} rows processed</div>
    </div>
  );
}
```

- [ ] **Step 3: Create ComparisonHistoryWidget**

Create `src/components/Analytics/widgets/ComparisonHistoryWidget.jsx`:
```jsx
import { useWidgetData } from '../hooks/useWidgetData';

export default function ComparisonHistoryWidget({ config }) {
  const { data, loading, error } = useWidgetData(config.dataEndpoint, {
    refreshInterval: config.refreshInterval,
  });

  if (loading) return <div className="widget-loading">Loading...</div>;
  if (error) return <div className="widget-error">{error}</div>;

  const sessions = data || [];

  return (
    <div className="comparison-history-widget">
      <h3>{config.title}</h3>
      {sessions.length === 0 ? (
        <div className="widget-empty">No comparisons yet</div>
      ) : (
        <table className="history-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Files</th>
              <th>Match Rate</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.id}>
                <td>{new Date(session.session_date).toLocaleDateString()}</td>
                <td>{session.left_file} vs {session.right_file}</td>
                <td>{session.match_rate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Analytics/ExpertAnalyticsPage.jsx
git add src/components/Analytics/widgets/MatchRateWidget.jsx
git add src/components/Analytics/widgets/ComparisonHistoryWidget.jsx
git commit -m "feat(analytics): add ExpertAnalyticsPage with MatchRate and ComparisonHistory widgets"
```

---

### Task 4: Connect Comparison to Analytics

**Files:**
- Modify: `src/App.jsx` (update comparison logic to log to analytics)

- [ ] **Step 1: Find comparison function in App.jsx**

Search for the comparison function that runs when user clicks "Compare". It likely calls `compareMultiColumn` and displays results.

- [ ] **Step 2: Add analytics logging after successful comparison**

After the comparison completes and before showing results modal, add:
```jsx
// Log to analytics
try {
  await fetch('/api/analytics/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      left_file: leftFile.name,
      right_file: rightFile.name,
      total_rows: results.both.length + results.onlyLeft.length + results.onlyRight.length,
      match_count: results.both.length,
      left_only_count: results.onlyLeft.length,
      right_only_count: results.onlyRight.length,
    }),
  });
} catch (err) {
  console.warn('Analytics logging failed:', err);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat(analytics): connect comparison results to analytics logging"
```

---

## PHASE 1 COMPLETE

After Phase 1:
- SQLite database with analytics tables
- Basic API endpoints for sessions, match-rates, history
- AnalyticsContext with shared state
- Widget registry system
- ExpertAnalyticsPage with MatchRateWidget and ComparisonHistoryWidget
- Comparison results auto-logged to analytics

---

## PHASE 2: Data Collection

### Task 5: Segment Frequency Tracking

**Files:**
- Modify: `server/analytics-db.js`
- Modify: `server.js`

- [ ] **Step 1: Add segment frequency endpoint**

Add to server.js:
```javascript
// GET /api/analytics/sessions/:id/segments
app.get('/api/analytics/sessions/:id/segments', (req, res) => {
  try {
    const { id } = req.params;
    const segments = analyticsDb.prepare(`
      SELECT segment_value, frequency, position 
      FROM segment_frequencies 
      WHERE session_id = ?
      ORDER BY frequency DESC
      LIMIT 50
    `).all(id);
    res.json({ success: true, data: segments });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

// GET /api/analytics/segments - Global segment aggregation
app.get('/api/analytics/segments', (req, res) => {
  try {
    const segments = analyticsDb.prepare(`
      SELECT segment_value, SUM(frequency) as total_frequency, COUNT(DISTINCT session_id) as sessions
      FROM segment_frequencies
      GROUP BY segment_value
      ORDER BY total_frequency DESC
      LIMIT 50
    `).all();
    res.json({ success: true, data: segments });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});
```

- [ ] **Step 2: Add segment logging when comparison runs**

Modify the comparison logging in App.jsx to also extract and store segment frequencies:
```javascript
// After logging session, extract segment frequencies
const segmentCounts = {};
results.both.forEach(row => {
  const uid = row.GeneratedUniqueID || '';
  const segments = uid.split(',').map(s => s.trim());
  segments.forEach((seg, idx) => {
    if (seg) {
      segmentCounts[seg] = (segmentCounts[seg] || 0) + 1;
    }
  });
});

// Insert segment frequencies
Object.entries(segmentCounts).forEach(([segment, count]) => {
  analyticsDb.prepare(`
    INSERT INTO segment_frequencies (session_id, segment_value, frequency, position)
    VALUES (?, ?, ?, 0)
  `).run(sessionId, segment, count);
});
```

- [ ] **Step 3: Commit**

```bash
git add server.js
git commit -m "feat(analytics): add segment frequency tracking"
```

---

### Task 6: Data Quality Widget

**Files:**
- Create: `src/components/Analytics/widgets/DataQualityWidget.jsx`
- Modify: `server.js`

- [ ] **Step 1: Add quality issues API**

Add to server.js:
```javascript
// POST /api/analytics/sessions/:id/quality - Log quality issue
app.post('/api/analytics/sessions/:id/quality', (req, res) => {
  try {
    const { id } = req.params;
    const { file_name, issue_type, column_name, row_count, sample_values } = req.body;
    analyticsDb.prepare(`
      INSERT INTO quality_issues (session_id, file_name, issue_type, column_name, row_count, sample_values)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, file_name, issue_type, column_name, row_count, JSON.stringify(sample_values));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

// GET /api/analytics/quality - Recent quality issues
app.get('/api/analytics/quality', (req, res) => {
  try {
    const issues = analyticsDb.prepare(`
      SELECT * FROM quality_issues 
      ORDER BY id DESC 
      LIMIT 100
    `).all();
    res.json({ success: true, data: issues });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});
```

- [ ] **Step 2: Create DataQualityWidget**

Create `src/components/Analytics/widgets/DataQualityWidget.jsx`:
```jsx
import { useWidgetData } from '../hooks/useWidgetData';

export default function DataQualityWidget({ config }) {
  const { data, loading, error } = useWidgetData('/api/analytics/quality');

  if (loading) return <div className="widget-loading">Loading...</div>;
  if (error) return <div className="widget-error">{error}</div>;

  const issues = data || [];
  const missingCount = issues.filter(i => i.issue_type === 'missing').length;
  const duplicateCount = issues.filter(i => i.issue_type === 'duplicate').length;
  const formatCount = issues.filter(i => i.issue_type === 'format').length;

  return (
    <div className="data-quality-widget">
      <h3>Data Quality Issues</h3>
      <div className="quality-summary">
        <div className="quality-stat missing">
          <span className="quality-count">{missingCount}</span>
          <span className="quality-label">Missing</span>
        </div>
        <div className="quality-stat duplicate">
          <span className="quality-count">{duplicateCount}</span>
          <span className="quality-label">Duplicates</span>
        </div>
        <div className="quality-stat format">
          <span className="quality-count">{formatCount}</span>
          <span className="quality-label">Format</span>
        </div>
      </div>
      {issues.length > 0 && (
        <table className="quality-table">
          <thead>
            <tr><th>File</th><th>Type</th><th>Column</th><th>Rows</th></tr>
          </thead>
          <tbody>
            {issues.slice(0, 5).map((issue, idx) => (
              <tr key={idx}>
                <td>{issue.file_name}</td>
                <td>{issue.issue_type}</td>
                <td>{issue.column_name || '-'}</td>
                <td>{issue.row_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Update widget registry**

Add to `widgetRegistry.js`:
```javascript
'data-quality': {
  id: 'data-quality',
  title: 'Data Quality',
  type: 'table',
  defaultSize: { w: 6, h: 4 },
  minSize: { w: 4, h: 3 },
  dataEndpoint: '/api/analytics/quality',
  refreshInterval: 60000,
},
```

- [ ] **Step 4: Register in ExpertAnalyticsPage**

Add to the widgetComponents map and dashboard grid.

- [ ] **Step 5: Commit**

```bash
git add server.js
git add src/components/Analytics/widgets/DataQualityWidget.jsx
git add src/components/Analytics/utils/widgetRegistry.js
git commit -m "feat(analytics): add data quality tracking and widget"
```

---

### Task 7: File Metrics Widget

**Files:**
- Create: `src/components/Analytics/widgets/FileMetricsWidget.jsx`
- Modify: `server.js`

- [ ] **Step 1: Add file metrics API**

Add to server.js:
```javascript
// POST /api/analytics/metrics - Log file metrics
app.post('/api/analytics/metrics', (req, res) => {
  try {
    const { session_id, file_name, file_size, row_count, processing_time_ms } = req.body;
    analyticsDb.prepare(`
      INSERT INTO file_metrics (session_id, file_name, file_size, row_count, processing_time_ms, upload_time)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).run(session_id, file_name, file_size, row_count, processing_time_ms);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

// GET /api/analytics/metrics - File processing metrics
app.get('/api/analytics/metrics', (req, res) => {
  try {
    const metrics = analyticsDb.prepare(`
      SELECT * FROM file_metrics 
      ORDER BY upload_time DESC 
      LIMIT 50
    `).all();
    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});
```

- [ ] **Step 2: Create FileMetricsWidget**

Create `src/components/Analytics/widgets/FileMetricsWidget.jsx`:
```jsx
import { useWidgetData } from '../hooks/useWidgetData';

export default function FileMetricsWidget({ config }) {
  const { data, loading, error } = useWidgetData(config.dataEndpoint);

  if (loading) return <div className="widget-loading">Loading...</div>;
  if (error) return <div className="widget-error">{error}</div>;

  const metrics = data || [];
  const totalSize = metrics.reduce((sum, m) => sum + (m.file_size || 0), 0);
  const avgProcessing = metrics.length > 0 
    ? Math.round(metrics.reduce((sum, m) => sum + (m.processing_time_ms || 0), 0) / metrics.length)
    : 0;

  return (
    <div className="file-metrics-widget">
      <h3>File Processing</h3>
      <div className="metrics-summary">
        <div className="metric">
          <span className="metric-value">{metrics.length}</span>
          <span className="metric-label">Files Processed</span>
        </div>
        <div className="metric">
          <span className="metric-value">{(totalSize / 1024 / 1024).toFixed(1)} MB</span>
          <span className="metric-label">Total Size</span>
        </div>
        <div className="metric">
          <span className="metric-value">{avgProcessing} ms</span>
          <span className="metric-label">Avg Processing</span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update registry and page, commit**

```bash
git add server.js src/components/Analytics/widgets/FileMetricsWidget.jsx
git commit -m "feat(analytics): add file metrics tracking and widget"
```

---

## PHASE 3: Visualization

### Task 8: TrendChartWidget

**Files:**
- Create: `src/components/Analytics/widgets/TrendChartWidget.jsx`
- Modify: `package.json`

- [ ] **Step 1: Install chart library**

Run: `npm install chart.js react-chartjs-2`

- [ ] **Step 2: Create TrendChartWidget**

Create `src/components/Analytics/widgets/TrendChartWidget.jsx`:
```jsx
import { useWidgetData } from '../hooks/useWidgetData';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function TrendChartWidget({ config }) {
  const { data, loading, error } = useWidgetData('/api/analytics/match-rates');

  if (loading) return <div className="widget-loading">Loading...</div>;
  if (error) return <div className="widget-error">{error}</div>;

  const rates = data || [];
  const chartData = {
    labels: rates.map(r => new Date(r.session_date).toLocaleDateString()),
    datasets: [{
      label: 'Match Rate %',
      data: rates.map(r => r.match_rate),
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.1)',
      tension: 0.3,
    }],
  };

  const options = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { min: 0, max: 100 } },
  };

  return (
    <div className="trend-chart-widget">
      <h3>Match Rate Trend</h3>
      <div className="chart-container">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update registry with w:12 span for chart, commit**

---

### Task 9: SegmentFrequencyWidget

**Files:**
- Create: `src/components/Analytics/widgets/SegmentFrequencyWidget.jsx`

- [ ] **Step 1: Create SegmentFrequencyWidget**

Create `src/components/Analytics/widgets/SegmentFrequencyWidget.jsx`:
```jsx
import { useWidgetData } from '../hooks/useWidgetData';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip);

export default function SegmentFrequencyWidget({ config }) {
  const { data, loading, error } = useWidgetData('/api/analytics/segments');

  if (loading) return <div className="widget-loading">Loading...</div>;
  if (error) return <div className="widget-error">{error}</div>;

  const segments = (data || []).slice(0, 10);
  const chartData = {
    labels: segments.map(s => s.segment_value),
    datasets: [{
      label: 'Frequency',
      data: segments.map(s => s.total_frequency),
      backgroundColor: 'rgba(54, 162, 235, 0.6)',
    }],
  };

  const options = {
    indexAxis: 'y',
    plugins: { legend: { display: false } },
  };

  return (
    <div className="segment-frequency-widget">
      <h3>Top Segments</h3>
      <Bar data={chartData} options={options} />
    </div>
  );
}
```

- [ ] **Step 2: Update registry, add to page, commit**

```bash
git add src/components/Analytics/widgets/TrendChartWidget.jsx
git add src/components/Analytics/widgets/SegmentFrequencyWidget.jsx
git add package.json package-lock.json
git commit -m "feat(analytics): add trend and segment frequency chart widgets"
```

---

## PHASE 4: Advanced Features

### Task 10: DrillDownModal

**Files:**
- Create: `src/components/Analytics/widgets/DrillDownModal.jsx`
- Modify: `server.js`

- [ ] **Step 1: Add drilldown API endpoint**

Add to server.js:
```javascript
// GET /api/analytics/drilldown/:type/:id
app.get('/api/analytics/drilldown/:type/:id', (req, res) => {
  try {
    const { type, id } = req.params;
    let data;
    if (type === 'session') {
      data = analyticsDb.prepare('SELECT * FROM analytics_sessions WHERE id = ?').get(id);
    } else if (type === 'quality') {
      data = analyticsDb.prepare('SELECT * FROM quality_issues WHERE id = ?').get(id);
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});
```

- [ ] **Step 2: Create DrillDownModal**

Create `src/components/Analytics/widgets/DrillDownModal.jsx`:
```jsx
import { useEffect, useState } from 'react';
import { useAnalytics } from '../context/AnalyticsContext';

export default function DrillDownModal({ type, id, onClose }) {
  const { api } = useAnalytics();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api(`/analytics/drilldown/${type}/${id}`)
      .then(result => setData(result.data))
      .finally(() => setLoading(false));
  }, [type, id, api]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <header>
          <h2>Details</h2>
          <button onClick={onClose}>X</button>
        </header>
        {loading ? <p>Loading...</p> : (
          <pre>{JSON.stringify(data, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Integrate into ComparisonHistoryWidget to open modal on row click**

- [ ] **Step 4: Commit**

---

### Task 11: ExportWidget

**Files:**
- Create: `src/components/Analytics/widgets/ExportWidget.jsx`
- Modify: `server.js`

- [ ] **Step 1: Add export API endpoint**

Add to server.js:
```javascript
// POST /api/analytics/export
app.post('/api/analytics/export', (req, res) => {
  try {
    const { type, format, filters } = req.body;
    let data, filename;
    if (type === 'sessions') {
      data = analyticsDb.prepare('SELECT * FROM analytics_sessions ORDER BY session_date DESC').all();
      filename = `analytics-sessions.${format}`;
    } else if (type === 'history') {
      data = analyticsDb.prepare('SELECT * FROM comparison_history ORDER BY session_date DESC').all();
      filename = `comparison-history.${format}`;
    }
    // Return CSV formatted data
    if (format === 'csv' && data) {
      const headers = Object.keys(data[0] || {});
      const rows = data.map(row => headers.map(h => row[h] ?? '').join(','));
      const csv = [headers.join(','), ...rows].join('\n');
      res.json({ success: true, data: csv, filename });
    } else {
      res.json({ success: true, data, filename });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});
```

- [ ] **Step 2: Create ExportWidget**

Create `src/components/Analytics/widgets/ExportWidget.jsx`:
```jsx
import { useAnalytics } from '../context/AnalyticsContext';

export default function ExportWidget() {
  const { api } = useAnalytics();

  const handleExport = async (type, format) => {
    try {
      const result = await api('/analytics/export', {
        method: 'POST',
        body: JSON.stringify({ type, format }),
      });
      const blob = new Blob([result.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed: ' + err.message);
    }
  };

  return (
    <div className="export-widget">
      <h3>Export Reports</h3>
      <div className="export-buttons">
        <button onClick={() => handleExport('sessions', 'csv')}>Sessions CSV</button>
        <button onClick={() => handleExport('history', 'csv')}>History CSV</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add CSS for modal, commit**

---

## PHASE 5: Polish

### Task 12: Performance & Error Handling

**Files:**
- Modify: Various widgets for consistent error/loading states
- Add: CSS polish

- [ ] **Step 1: Add consistent loading/error states to all widgets**
- [ ] **Step 2: Add responsive grid CSS**
- [ ] **Step 3: Add role-based view toggle**
- [ ] **Step 4: Final commit**

```bash
git add src/components/Analytics/
git commit -m "feat(analytics): add polish - responsive layout, error handling, role toggle"
```

---

## Summary

| Phase | Tasks | Files Created/Modified |
|-------|-------|----------------------|
| 1 | 4 tasks | server/analytics-db.js, server.js, Context, Registry, 2 widgets |
| 2 | 3 tasks | +2 widgets, +quality/metrics APIs |
| 3 | 2 tasks | +2 chart widgets |
| 4 | 2 tasks | +DrillDownModal, +ExportWidget |
| 5 | 1 task | Polish |

**Total: 11 tasks across 5 phases**

---

## Verification

After implementation, verify:
1. Navigate to `/expert-analytics` - page loads without errors
2. Run a comparison on CompareUniqueIdsPage - session appears in history
3. Refresh analytics page - match rate updates
4. Click history row - drill-down modal opens
5. Click export - CSV downloads

Run lint: `npm run lint`
Run build: `npm run build`
