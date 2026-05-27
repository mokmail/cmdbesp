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