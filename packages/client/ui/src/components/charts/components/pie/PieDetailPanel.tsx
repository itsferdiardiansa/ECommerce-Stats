'use client'

import React from 'react'
import { readCssColor } from '@/components/charts/utils'
import type { PieDatum } from './types'

export const PieDetailPanel: React.FC<{
  items: PieDatum[]
  formatValue: (value: number) => string
}> = ({ items, formatValue }) => {
  const text = readCssColor('--text-color-ds-default', 'rgb(23, 23, 23)')
  const subtle = readCssColor('--text-color-ds-subtle', 'rgb(82, 82, 82)')
  const line = readCssColor('--border-color-ds-default', 'rgb(229, 229, 229)')
  const surface = readCssColor(
    '--background-color-ds-elevation-surface-sunken',
    'rgb(245, 245, 245)'
  )
  return (
    <div
      data-testid="pie-detail-panel"
      style={{
        display: 'grid',
        gap: 12,
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        marginTop: 12,
      }}
    >
      {items.map((item, idx) => {
        const { detail } = item
        return (
          <div
            key={`${item.label}-${idx}`}
            style={{
              border: `1px solid ${line}`,
              background: surface,
              borderRadius: 8,
              padding: 12,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: text,
                marginBottom: 8,
              }}
            >
              {detail?.title ?? item.label}
            </div>
            {detail ? (
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: 12,
                }}
              >
                <thead>
                  <tr>
                    {detail.columns.map((col, ci) => (
                      <th
                        key={col}
                        style={{
                          textAlign: ci === 0 ? 'left' : 'right',
                          color: subtle,
                          fontWeight: 500,
                          padding: '0 0 4px',
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detail.rows.map((row, ri) => (
                    <tr key={ri} style={{ borderTop: `1px solid ${line}` }}>
                      <td style={{ padding: '6px 0', color: text }}>
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          {row.icon ? (
                            <span
                              style={{
                                display: 'inline-block',
                                width: 20,
                                height: 16,
                                overflow: 'hidden',
                                flexShrink: 0,
                              }}
                            >
                              <img
                                src={row.icon}
                                alt=""
                                style={{ height: 16, display: 'block' }}
                              />
                            </span>
                          ) : null}
                          {row.label}
                        </span>
                      </td>
                      {row.cells.map((cell, ci) => (
                        <td
                          key={ci}
                          style={{
                            padding: '6px 0',
                            textAlign: 'right',
                            color: ci === row.cells.length - 1 ? subtle : text,
                          }}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ fontSize: 13, color: subtle }}>
                {formatValue(item.value)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
