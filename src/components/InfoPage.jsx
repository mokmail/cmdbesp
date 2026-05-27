import { useRef, useEffect } from 'react'
import mermaid from 'mermaid'

const comparisonMermaidDefinition = `flowchart TD
  subgraph Left[Left File]
    A1[Left CSV file rows]
    A2[Select columns for matching\nServer, Share, Path]
    A3[Build GeneratedUniqueID list\nsegment array per row]
  end
  subgraph Right[Right File]
    B1[Right CSV file rows]
    B2[Select fields for matching\nUniqueID, Category, Device]
    B3[Build GeneratedUniqueID list\nsegment array per row]
  end
  A1 --> A2 --> A3 --> Compare[Compare GeneratedUniqueID segment sets]
  B1 --> B2 --> B3 --> Compare
  Compare -->|Shared segments found| Both[Match: Both]
  Compare -->|No shared segments| OnlyA[Only in left file]
  Compare -->|No shared segments| OnlyB[Only in right file]
  Both --> Highlight[Highlight matched segments\nand record matched row pairs]
  Highlight --> ResultBoth[Display both-side rows with status badges]
  OnlyA --> ResultA[Display left-only rows]
  OnlyB --> ResultB[Display right-only rows]
  ResultBoth --> Detail[Open detail view with side-by-side fields]
  classDef matchNode fill:#dcfce7,stroke:#4ade80,stroke-width:1.5;
  classDef diffNode fill:#fef3c7,stroke:#f59e0b,stroke-width:1.5;
  classDef rightNode fill:#dbeafe,stroke:#3b82f6,stroke-width:1.5;
  class Both matchNode;
  class OnlyA,OnlyB diffNode;
  class ResultBoth,ResultA,ResultB,Detail rightNode;
`

function MermaidDiagram({ definition, id }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        primaryColor: '#2563eb',
        primaryBorderColor: '#93c5fd',
        primaryTextColor: '#0f172a',
        secondaryColor: '#dbeafe',
        tertiaryColor: '#f8fafc',
        lineColor: '#cbd5e1',
        textColor: '#334155',
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      securityLevel: 'loose',
    })

    let cancelled = false
    mermaid.render(`mermaid-${id}`, definition)
      .then(({ svg }) => {
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg
        }
      })
      .catch((error) => {
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = `<pre class="mermaid-error">${String(error)}</pre>`
        }
      })

    return () => {
      cancelled = true
    }
  }, [definition, id])

  return <div ref={containerRef} className="mermaid-diagram" aria-label="Comparison workflow diagram" />
}

export default function InfoPage({ Icon, SectionHeading }) {
  return (
    <div className="mode-panel info-panel">
      <div className="info-container">
        <h2><Icon name="info" size={32} /> Dashboard Guide</h2>

        <section className="info-section">
          <h3>Welcome to CIO Data Intelligence</h3>
          <p>This platform helps you compare and analyze data from various sources, uncovering mismatches and synchronization insights.</p>
        </section>

        <section className="info-section">
          <SectionHeading icon="target">Main Features</SectionHeading>
          <div className="feature-list">
            <div className="feature-item">
              <strong><Icon name="file" size={20} /> Single File View:</strong>
              <p>Browse and search through individual CSV files. Filter data by columns and values to find specific records quickly.</p>
            </div>
            <div className="feature-item">
              <strong><Icon name="compare" size={20} /> Compare Unique IDs:</strong>
              <p>Specialized comparison tool that matches records based on UniqueID field segments. Filter results by category for focused analysis.</p>
            </div>
          </div>
        </section>

        <section className="info-section">
          <SectionHeading icon="folder">Pre-provided Files</SectionHeading>
          <p>This dashboard comes with the following pre-loaded CSV files ready for immediate analysis:</p>
          <div className="files-grid">
            <div className="file-card">
              <div className="file-icon"><Icon name="file" size={40} /></div>
              <div className="file-name">CMDB_Bladeserver_2026_04_10.csv</div>
              <div className="file-desc">Configuration data for blade servers from CMDB</div>
              <div className="column-badges">
                <span className="badge-column">Title</span>
                <span className="badge-column">Manufacturer</span>
                <span className="badge-column">Model</span>
                <span className="badge-column">Primary hostaddress</span>
                <span className="badge-column">Primary hostname</span>
                <span className="badge-column">Location path</span>
                <span className="badge-column">CMDB status</span>
              </div>
            </div>
            <div className="file-card">
              <div className="file-icon"><Icon name="file" size={40} /></div>
              <div className="file-name">CMDB_Server_2026_04_10.csv</div>
              <div className="file-desc">Configuration data for physical servers from CMDB</div>
              <div className="column-badges">
                <span className="badge-column">Title</span>
                <span className="badge-column">Primary hostaddress</span>
                <span className="badge-column">Primary hostname</span>
                <span className="badge-column">Manufacturer</span>
                <span className="badge-column">Model</span>
                <span className="badge-column">Location path</span>
                <span className="badge-column">CMDB status</span>
              </div>
            </div>
            <div className="file-card">
              <div className="file-icon"><Icon name="file" size={40} /></div>
              <div className="file-name">CMDB_Virtualserver_2026_04_10.csv</div>
              <div className="file-desc">Configuration data for virtual servers from CMDB</div>
              <div className="column-badges">
                <span className="badge-column">UniqueID</span>
                <span className="badge-column">Title</span>
                <span className="badge-column">Primary hostaddress</span>
                <span className="badge-column">Host in cluster</span>
                <span className="badge-column">Running on host / cluster</span>
                <span className="badge-column">CMDB status</span>
                <span className="badge-column">Operating system</span>
              </div>
            </div>
            <div className="file-card">
              <div className="file-icon"><Icon name="file" size={40} /></div>
              <div className="file-name">CMDB_fileshares.csv</div>
              <div className="file-desc">Configuration data for file shares from CMDB</div>
              <div className="column-badges">
                <span className="badge-column">Server</span>
                <span className="badge-column">Share</span>
              </div>
            </div>
            <div className="file-card">
              <div className="file-icon"><Icon name="chart" size={40} /></div>
              <div className="file-name">ESP_20260416.csv</div>
              <div className="file-desc">Equipment and asset data from ESP system</div>
              <div className="column-badges">
                <span className="badge-column">UniqueID</span>
                <span className="badge-column">Komponente Nr.</span>
                <span className="badge-column">Gerätename</span>
                <span className="badge-column">IP Adresse</span>
                <span className="badge-column">Person (System)</span>
                <span className="badge-column">Typ</span>
                <span className="badge-column">System Name</span>
                <span className="badge-column">Status</span>
                <span className="badge-column">BS</span>
                <span className="badge-column">BS SP</span>
                <span className="badge-column">Bemerkungen</span>
              </div>
            </div>
          </div>
          <p style={{marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)'}}>
            All files are automatically loaded and ready to use. Click on "Show Files" in the top menu to see the complete list and details of loaded CSV files.
          </p>
        </section>

        <section className="info-section">
          <SectionHeading icon="search">How to Use Compare Unique IDs</SectionHeading>
          <div className="step-list">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <strong>Select Left File:</strong> Choose which file to analyze. The right file is automatically used as the comparison source.
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <strong>Filter by Category:</strong> Select a category (if available) to focus on specific types of records. Choose "All categories" to see all records.
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <strong>Review Results:</strong> The comparison shows three types of records:
                <ul>
                  <li><span className="badge-both">Both</span> - Records found in both files</li>
                  <li><span className="badge-left">Only in left file</span> - Records only in left file</li>
                  <li><span className="badge-right">Only in right file</span> - Records only in right file</li>
                </ul>
              </div>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <strong>Click Details:</strong> Click on any row to see detailed side-by-side comparison, matched segments, and actionable insights.
              </div>
            </div>
          </div>
        </section>

        <section className="info-section">
          <SectionHeading icon="chart">Comparison Flow</SectionHeading>
          <p>The diagram below explains how records are aligned through generated UniqueIDs, and how the tool categorizes matches.</p>
          <MermaidDiagram definition={comparisonMermaidDefinition} id="comparison-flow" />
        </section>

        <section className="info-section">
          <SectionHeading icon="key">UniqueID Generator Tool</SectionHeading>
          <p>UniqueIDs are unique identifiers created by combining values from multiple columns in your CSV files. They enable accurate record matching and comparison across different systems.</p>

          <div className="uniqueid-info">
            <div className="info-box">
              <strong>How UniqueIDs Work:</strong>
              <p>GeneratedUniqueID stores selected columns as an array. For display and matching, array items are compared as individual elements. For example:</p>
              <div className="example-code">
                Columns: [Manufacturer, Model, Location]<br/>
                Values: [Dell, PowerEdge R750, DC-A-01]<br/>
                Result: <strong>["Dell", "PowerEdge R750", "DC-A-01"]</strong>
              </div>
            </div>

            <div className="info-box">
              <strong>How to Use the Generator:</strong>
              <ol style={{marginLeft: '1.5rem'}}>
                <li>Go to <strong>Single File</strong> view</li>
                <li>Select the CSV file you want to work with</li>
                <li>Click the <strong><Icon name="key" size={18} /> UniqueID Generator</strong> button at the top right</li>
                <li>A modal window will open - select the columns you want to combine (checkboxes)</li>
                <li>Click <strong>Generate & Save UniqueID</strong> - the file will be saved automatically in <strong>ID_generated</strong> and a preview will appear</li>
                <li>Optional: Use the <strong><Icon name="save" size={18} /> Save Again</strong> button to save again if needed</li>
              </ol>
            </div>

            <div className="info-box">
              <strong>Key Benefits:</strong>
              <ul style={{marginLeft: '1.5rem'}}>
                <li><Icon name="check" size={18} /> Ensures unique identification of records across systems</li>
                <li><Icon name="check" size={18} /> Enables precise record matching in comparisons</li>
                <li><Icon name="check" size={18} /> Handles special characters automatically</li>
                <li><Icon name="check" size={18} /> Customizable - choose which columns to include</li>
                <li><Icon name="check" size={18} /> Exportable - download the results as CSV</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="info-section">
          <SectionHeading icon="chart">Understanding the Results</SectionHeading>
          <div className="result-info">
            <div className="result-item">
              <strong>Matched Segments:</strong> The system matches records by comparing parts of the UniqueID field (segments separated by underscores). When segments match between records from both files, they are highlighted in yellow.
            </div>
            <div className="result-item">
              <strong>Match Status:</strong> Color-coded rows indicate match status:
              <ul>
                <li><span className="status-dot status-both" /> Green - Found in both files (matched)</li>
                <li><span className="status-dot status-left" /> Blue - Only in left file</li>
                <li><span className="status-dot status-right" /> Red - Only in right file</li>
              </ul>
            </div>
            <div className="result-item">
              <strong>Statistics Cards:</strong> Show match rates and counts for quick overview.
            </div>
          </div>
        </section>

        <section className="info-section">
          <SectionHeading icon="search">Filtering & Searching</SectionHeading>
          <div className="filter-info">
            <p><strong>Text Search:</strong> Search across all columns or select a specific column to filter results.</p>
            <p><strong>Match Status Filter:</strong> Show only "Both" matches, "Only in left file", or "Only in right file" records.</p>
            <p><strong>Column Filter:</strong> Filter records based on specific column values.</p>
            <p><strong>Page Size:</strong> Adjust how many rows are shown per page (25, 50, 100, or 250).</p>
          </div>
        </section>

        <section className="info-section">
          <SectionHeading icon="lightbulb">Tips & Best Practices</SectionHeading>
          <div className="tips-list">
            <div className="tip">
              <Icon name="check" size={18} /> Start with "All categories" to see the full picture, then filter by specific categories for deeper analysis.

              <Icon name="check" size={18} /> Use the detail modal to understand why records matched and what fields differ between systems.

              <Icon name="check" size={18} /> Records with "Only in left file" or "Only in right file" indicate data synchronization issues that may need attention.

              <Icon name="check" size={18} /> The matched segments are the basis for record matching - more matched segments = stronger match.

              <Icon name="check" size={18} /> Use the search feature to quickly locate specific records by hostname, IP, or other identifiers.
            </div>
          </div>
        </section>

        <section className="info-section info-footer">
          <p style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>
            For support, please contact your system administrator.
          </p>
        </section>
      </div>
    </div>
  )
}