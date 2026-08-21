export interface ExportColumn<T> {
  key: keyof T & string
  label: string
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function downloadJSON<T>(filename: string, rows: T[]) {
  const name = filename.endsWith('.json') ? filename : `${filename}.json`
  triggerDownload(
    new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' }),
    name
  )
}

export function downloadXLS<T>(
  filename: string,
  rows: T[],
  columns: ExportColumn<T>[]
) {
  const name = filename.endsWith('.xls') ? filename : `${filename}.xls`
  const head = `<tr>${columns
    .map(c => `<th>${escapeHtml(c.label)}</th>`)
    .join('')}</tr>`
  const body = rows
    .map(
      row =>
        `<tr>${columns
          .map(c => `<td>${escapeHtml(String(row[c.key] ?? ''))}</td>`)
          .join('')}</tr>`
    )
    .join('')
  const html = `<html><head><meta charset="utf-8" /></head><body><table>${head}${body}</table></body></html>`
  triggerDownload(new Blob([html], { type: 'application/vnd.ms-excel' }), name)
}
