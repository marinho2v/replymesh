const normalizeColumns = (columns) => (
  columns.map(column => (
    typeof column === 'string'
      ? { key: column, label: column }
      : column
  ))
)

export const exportToCsv = (data, filename, headers) => {
  const columns = normalizeColumns(headers)
  const csvContent = [
    columns.map(column => column.label).join(','),
    ...data.map(row => 
      columns.map(column => {
        const value = row[column.key] ?? ''
        return `"${String(value).replace(/"/g, '""')}"`
      }).join(',')
    ),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const exportToXlsx = async (data, filename, columns, sheetName = 'Relatorio') => {
  const normalizedColumns = normalizeColumns(columns)
  const rows = [
    normalizedColumns.map(column => column.label),
    ...data.map(row => normalizedColumns.map(column => row[column.key] ?? '')),
  ]

  const workbookFiles = buildWorkbookFiles(rows, sheetName)
  const zipBlob = new Blob([createZip(workbookFiles)], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  downloadBlob(zipBlob, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`)
}

const downloadBlob = (blob, filename) => {
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.href = url
  link.download = filename
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const buildWorkbookFiles = (rows, sheetName) => {
  const safeSheetName = escapeXml(String(sheetName || 'Relatorio').slice(0, 31))
  const worksheetXml = buildWorksheetXml(rows)

  return [
    {
      path: '[Content_Types].xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`,
    },
    {
      path: '_rels/.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    },
    {
      path: 'xl/workbook.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${safeSheetName}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`,
    },
    {
      path: 'xl/_rels/workbook.xml.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`,
    },
    {
      path: 'xl/worksheets/sheet1.xml',
      content: worksheetXml,
    },
  ]
}

const buildWorksheetXml = (rows) => {
  const xmlRows = rows.map((row, rowIndex) => {
    const rowNumber = rowIndex + 1
    const cells = row.map((value, columnIndex) => {
      const cellRef = `${columnName(columnIndex)}${rowNumber}`

      if (typeof value === 'number' || (value !== '' && value !== null && !Number.isNaN(Number(value)))) {
        return `<c r="${cellRef}"><v>${Number(value)}</v></c>`
      }

      return `<c r="${cellRef}" t="inlineStr"><is><t>${escapeXml(String(value ?? ''))}</t></is></c>`
    }).join('')

    return `<row r="${rowNumber}">${cells}</row>`
  }).join('')

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${xmlRows}</sheetData>
</worksheet>`
}

const columnName = (index) => {
  let name = ''
  let value = index + 1

  while (value > 0) {
    const remainder = (value - 1) % 26
    name = String.fromCharCode(65 + remainder) + name
    value = Math.floor((value - 1) / 26)
  }

  return name
}

const escapeXml = (value) => (
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
)

const createZip = (files) => {
  const encoder = new TextEncoder()
  const localParts = []
  const centralParts = []
  let offset = 0

  files.forEach(file => {
    const nameBytes = encoder.encode(file.path)
    const dataBytes = encoder.encode(file.content)
    const crc = crc32(dataBytes)
    const localHeader = createZipHeader(0x04034b50, nameBytes, dataBytes, crc, offset)

    localParts.push(localHeader, nameBytes, dataBytes)

    const centralHeader = createZipHeader(0x02014b50, nameBytes, dataBytes, crc, offset, true)
    centralParts.push(centralHeader, nameBytes)

    offset += localHeader.length + nameBytes.length + dataBytes.length
  })

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0)
  const endRecord = createEndRecord(files.length, centralSize, offset)
  const totalLength = offset + centralSize + endRecord.length
  const output = new Uint8Array(totalLength)
  let cursor = 0

  ;[...localParts, ...centralParts, endRecord].forEach(part => {
    output.set(part, cursor)
    cursor += part.length
  })

  return output
}

const createZipHeader = (signature, nameBytes, dataBytes, crc, offset, central = false) => {
  const headerLength = central ? 46 : 30
  const header = new Uint8Array(headerLength)
  const view = new DataView(header.buffer)

  view.setUint32(0, signature, true)

  if (central) {
    view.setUint16(4, 20, true)
    view.setUint16(6, 20, true)
    view.setUint16(28, nameBytes.length, true)
    view.setUint32(42, offset, true)
  } else {
    view.setUint16(4, 20, true)
    view.setUint16(26, nameBytes.length, true)
  }

  const base = central ? 16 : 14
  view.setUint32(base, crc, true)
  view.setUint32(base + 4, dataBytes.length, true)
  view.setUint32(base + 8, dataBytes.length, true)

  return header
}

const createEndRecord = (fileCount, centralSize, centralOffset) => {
  const record = new Uint8Array(22)
  const view = new DataView(record.buffer)

  view.setUint32(0, 0x06054b50, true)
  view.setUint16(8, fileCount, true)
  view.setUint16(10, fileCount, true)
  view.setUint32(12, centralSize, true)
  view.setUint32(16, centralOffset, true)

  return record
}

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let crc = index
  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1
  }
  return crc >>> 0
})

const crc32 = (bytes) => {
  let crc = 0xffffffff
  for (let index = 0; index < bytes.length; index += 1) {
    crc = crcTable[(crc ^ bytes[index]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}
