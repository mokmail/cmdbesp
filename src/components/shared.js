export const parseGeneratedUniqueIdItems = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? '').trim()).filter((item) => item.length > 0)
  }
  const text = String(value ?? '').trim()
  if (text.startsWith('[') && text.endsWith(']')) {
    try {
      const parsed = JSON.parse(text)
      if (Array.isArray(parsed)) return parsed.map((item) => String(item ?? '').trim()).filter((item) => item.length > 0)
    } catch {
      return text.slice(1, -1).split(',').map((item) => String(item ?? '').trim()).filter((item) => item.length > 0)
    }
  }
  if (text.includes(',')) {
    return text.split(',').map((item) => String(item ?? '').trim()).filter((item) => item.length > 0)
  }
  return [text]
}

export const splitMultiUniqueIdDisplay = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? '').trim()).filter((item) => item.length > 0)
  }
  const text = String(value ?? '').trim()
  if (text.startsWith('[') && text.endsWith(']')) {
    try {
      const parsed = JSON.parse(text)
      if (Array.isArray(parsed)) return parsed.map((item) => String(item ?? '').trim()).filter((item) => item.length > 0)
    } catch {
      return text.slice(1, -1).split(',').map((item) => String(item ?? '').trim()).filter((item) => item.length > 0)
    }
  }
  if (text.includes(',')) {
    return text.split(',').map((item) => String(item ?? '').trim()).filter((item) => item.length > 0)
  }
  return [text]
}

export const uniqueValues = (rows, column) =>
  Array.from(
    new Set(
      rows
        .map((row) => row[column])
        .filter((value) => value !== undefined && value !== null && String(value).trim() !== '')
    )
  ).sort((a, b) => String(a).localeCompare(String(b)))

export const escapeUniqueIdValue = (value) => {
  return String(value ?? '')
    .trim()
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
}

export const replaceUniqueIdValue = (value, search, replacement) => {
  const text = String(value ?? '').trim()
  if (!search || String(search).length === 0) return text
  return text.split(String(search)).join(String(replacement ?? ''))
}

export const trimToFirstDelimiter = (value, delimiter) => {
  const text = String(value ?? '').trim()
  if (!delimiter || String(delimiter).length === 0) return text
  const idx = text.indexOf(String(delimiter))
  return idx === -1 ? text : text.slice(0, idx)
}

export const generateUniqueIds = (rows, columns, options = {}) => {
  if (!columns || columns.length === 0) return null
  const { replaceFrom = '', replaceTo = '', trimBeforeFirstDelimiter = '', escapeValues = false } = options
  return rows.map((row) => {
    const parts = columns
      .map((col) => {
        let part = String(row[col] ?? '').trim()
        if (trimBeforeFirstDelimiter) {
          part = trimToFirstDelimiter(part, trimBeforeFirstDelimiter)
        }
        if (replaceFrom) {
          part = replaceUniqueIdValue(part, replaceFrom, replaceTo)
        }
        if (escapeValues) {
          part = escapeUniqueIdValue(part)
        }
        return part
      })
      .filter((val) => val.length > 0)
    return {
      ...row,
      GeneratedUniqueID: parts,
    }
  })
}

export const getGeneratedUniqueIdArray = (row) => {
  if (!row) return []
  return parseGeneratedUniqueIdItems(row?.GeneratedUniqueID)
}

export const mergeRows = (rowsA, rowsB, mergeCol, fileA, fileB) => {
  const mapA = new Map()
  const mapB = new Map()

  rowsA.forEach((row) => {
    const key = String(row[mergeCol] ?? '').trim()
    if (key) mapA.set(key, row)
  })

  rowsB.forEach((row) => {
    const key = String(row[mergeCol] ?? '').trim()
    if (key) mapB.set(key, row)
  })

  const inBoth = []
  const onlyInA = []
  const onlyInB = []

  const allKeys = new Set([...mapA.keys(), ...mapB.keys()])

  allKeys.forEach((key) => {
    const rowA = mapA.get(key)
    const rowB = mapB.get(key)

    if (rowA && rowB) {
      const merged = { [mergeCol]: key }
      Object.entries(rowA).forEach(([col, val]) => {
        merged[`${col} (${fileA})`] = val
      })
      Object.entries(rowB).forEach(([col, val]) => {
        merged[`${col} (${fileB})`] = val
      })
      inBoth.push(merged)
    } else if (rowA) {
      onlyInA.push(rowA)
    } else {
      onlyInB.push(rowB)
    }
  })

  return { inBoth, onlyInA, onlyInB }
}

export const compareUniqueIdRows = (rowsA, rowsB, idField = 'GeneratedUniqueID') => {
  const rowsAFiltered = rowsA.filter((row) => row[idField])
  const rowsBFiltered = rowsB.filter((row) => row[idField])

  const aMap = new Map()
  rowsAFiltered.forEach((row) => {
    const items = parseGeneratedUniqueIdItems(row[idField])
    items.forEach((item) => {
      if (!aMap.has(item)) aMap.set(item, [])
      aMap.get(item).push(row)
    })
  })

  const bMap = new Map()
  rowsBFiltered.forEach((row) => {
    const items = parseGeneratedUniqueIdItems(row[idField])
    items.forEach((item) => {
      if (!bMap.has(item)) bMap.set(item, [])
      bMap.get(item).push(row)
    })
  })

  const allSegments = new Set([...aMap.keys(), ...bMap.keys()])

  const resultMap = new Map()

  const getResultKey = (row, prefix) => {
    const uniqueKey = row._rowKey || JSON.stringify(row)
    return `${prefix}_${uniqueKey}`
  }

  rowsAFiltered.forEach((row) => {
    const key = getResultKey(row, 'A')
    const items = parseGeneratedUniqueIdItems(row[idField])
    resultMap.set(key, {
      ...row,
      MatchStatus: 'Only in left file',
      MatchedSegments: 0,
      _matchedSegmentsList: [],
    })
  })

  rowsBFiltered.forEach((row) => {
    const key = getResultKey(row, 'B')
    const items = parseGeneratedUniqueIdItems(row[idField])
    resultMap.set(key, {
      ...row,
      MatchStatus: 'Only in right file',
      MatchedSegments: 0,
      _matchedSegmentsList: [],
    })
  })

  allSegments.forEach((segment) => {
    const aRows = aMap.get(segment) || []
    const bRows = bMap.get(segment) || []

    aRows.forEach((aRow) => {
      bRows.forEach((bRow) => {
        const keyA = getResultKey(aRow, 'A')
        const keyB = getResultKey(bRow, 'B')
        const resultA = resultMap.get(keyA)
        const resultB = resultMap.get(keyB)

        if (resultA && resultB) {
          if (resultA.MatchStatus !== 'Both') {
            resultA.MatchStatus = 'Both'
            resultA._matchedSegmentsList = []
          }
          if (!resultA._matchedSegmentsList.includes(segment)) {
            resultA._matchedSegmentsList.push(segment)
            resultA.MatchedSegments = resultA._matchedSegmentsList.length
          }

          if (resultB.MatchStatus !== 'Both') {
            resultB.MatchStatus = 'Both'
            resultB._matchedSegmentsList = []
          }
          if (!resultB._matchedSegmentsList.includes(segment)) {
            resultB._matchedSegmentsList.push(segment)
            resultB.MatchedSegments = resultB._matchedSegmentsList.length
          }

          const existingIndex = resultMap.findIndex((r) => r._rowKey === keyA && r._matchedFrom === keyB)
          if (existingIndex === -1) {
            resultMap.set(keyA, { ...resultA })
          }
        }
      })
    })
  })

  const results = []
  const seenKeys = new Set()

  resultMap.forEach((row) => {
    const key = row._rowKey || JSON.stringify(row)
    if (!seenKeys.has(key)) {
      seenKeys.add(key)
      const { _rowKey, _matchedSegmentsList, _matchedFrom, ...cleanRow } = row
      results.push(cleanRow)
    }
  })

  return results
}

export const compareShareRows = (sharesRows, espRows) => {
  if (!sharesRows || !espRows) return null

  const sharesMap = new Map()
  sharesRows.forEach((row) => {
    const uid = row.GeneratedUniqueID
    if (uid) {
      const items = parseGeneratedUniqueIdItems(uid)
      items.forEach((item) => {
        if (!sharesMap.has(item)) sharesMap.set(item, [])
        sharesMap.get(item).push({ ...row, _source: 'shares' })
      })
    }
  })

  const espMap = new Map()
  espRows.forEach((row) => {
    const uid = row.GeneratedUniqueID
    if (uid) {
      const items = parseGeneratedUniqueIdItems(uid)
      items.forEach((item) => {
        if (!espMap.has(item)) espMap.set(item, [])
        espMap.get(item).push({ ...row, _source: 'esp' })
      })
    }
  })

  const allSegments = new Set([...sharesMap.keys(), ...espMap.keys()])
  const results = []
  const processedShares = new Set()
  const processedEsp = new Set()

  allSegments.forEach((segment) => {
    const shareEntries = sharesMap.get(segment) || []
    const espEntries = espMap.get(segment) || []

    shareEntries.forEach((shareRow) => {
      const shareKey = JSON.stringify(shareRow)
      if (!processedShares.has(shareKey)) {
        processedShares.add(shareKey)

        const espEntry = espEntries.find((e) => !processedEsp.has(JSON.stringify(e)))

        if (espEntry) {
          processedEsp.add(JSON.stringify(espEntry))
          results.push({
            MatchStatus: 'Both',
            MatchedSegments: 1,
            ...shareRow,
            ...Object.fromEntries(
              Object.entries(espEntry).map(([k, v]) => [k.startsWith('ESP_') ? k : `ESP_${k}`, v])
            ),
          })
        } else {
          results.push({
            MatchStatus: 'Only in left file',
            MatchedSegments: 0,
            ...shareRow,
          })
        }
      }
    })

    espEntries.forEach((espRow) => {
      const espKey = JSON.stringify(espRow)
      if (!processedEsp.has(espKey)) {
        processedEsp.add(espKey)
        results.push({
          MatchStatus: 'Only in right file',
          MatchedSegments: 0,
          ...Object.fromEntries(
            Object.entries(espRow).map(([k, v]) => [k.startsWith('ESP_') ? k : `ESP_${k}`, v])
          ),
        })
      }
    })
  })

  return results
}

export const GENERATED_IDS_DIR = 'ID_generated'

export const buildUniqueIdCsvContent = (generatedUniqueIds, originalColumns) => {
  if (!generatedUniqueIds || generatedUniqueIds.length === 0) {
    throw new Error('No data to save')
  }
  const newColumns = [...originalColumns, 'GeneratedUniqueID']
  return [
    newColumns.join(';'),
    ...generatedUniqueIds.map((row) =>
      newColumns.map((col) => {
        const value = row[col]
        if (Array.isArray(value)) return JSON.stringify(value)
        return String(value ?? '')
      }).join(';')
    ),
  ].join('\n')
}

export const saveUniqueIdCsv = async (generatedUniqueIds, originalColumns, fileName) => {
  const csvContent = buildUniqueIdCsvContent(generatedUniqueIds, originalColumns)
  const outputName = `${fileName.replace(/\.csv$/i, '')}_with_uid.csv`

  const res = await fetch('/api/save-uniqueid', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName: outputName, content: csvContent }),
  })

  const result = await res.json()
  if (!result.ok) {
    throw new Error(result.error || 'Save failed')
  }

  return result
}