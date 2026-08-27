import {
  readCssColor,
  lighten,
  resolveVariant,
  resolveCategoricalPalette,
  prefersReducedMotion,
  buildLegendOption,
} from '@/components/charts/utils'
import type {
  LegendPosition,
  LegendIcon,
  LegendAlign,
  LegendStyleOverrides,
} from '@/components/charts/utils'
import type {
  PieDatum,
  PieDetail,
  PieCustomLabel,
  PieSeries,
  PiePalette,
  PieCoord,
  PieGeo,
  PieCalendar,
  PieRoseType,
  PieLabelPosition,
  PieLabelAlignTo,
  PieLabelDatum,
} from './types'

export interface BuildPieOptionParams {
  data: PieDatum[]
  series?: PieSeries[]
  innerRadius?: PieCoord
  outerRadius?: PieCoord
  center?: [PieCoord, PieCoord]
  geo?: PieGeo
  calendar?: PieCalendar
  startAngle: number
  endAngle?: number
  padAngle: number
  borderRadius: number
  roseType: PieRoseType
  palette: PiePalette
  showLabels: boolean
  labelOnHover: boolean
  labelOnClick: boolean
  labelPosition: PieLabelPosition
  labelAlignTo: PieLabelAlignTo
  showLabelLine: boolean
  labelFormatter?: (datum: PieLabelDatum) => string
  showTooltip: boolean
  showLegend?: boolean
  legendPosition: LegendPosition
  legendIcon?: LegendIcon
  legendAlign?: LegendAlign
  legendStyle?: LegendStyleOverrides
  scrollableLegend: boolean
  highlightOnHover: boolean
  selectedMode: false | 'single' | 'multiple'
  formatValue: (value: number) => string
  animate: boolean
  emptyMessage: string
  compact?: boolean
  stacked?: boolean
  width?: number
  height?: number
  revealedIndex?: { seriesIndex: number; dataIndex: number } | null
}

function calendarBounds(range: string | [string, string]): [number, number] {
  if (Array.isArray(range)) return [Date.parse(range[0]), Date.parse(range[1])]
  if (/^\d{4}-\d{2}$/.test(range)) {
    const [y, m] = range.split('-').map(Number)
    return [Date.UTC(y, m - 1, 1), Date.UTC(y, m, 0)]
  }
  if (/^\d{4}$/.test(range))
    return [Date.UTC(Number(range), 0, 1), Date.UTC(Number(range), 11, 31)]
  const t = Date.parse(range)
  return [t, t]
}

function calendarWeeks(
  range: string | [string, string],
  firstDay: number
): number {
  const [start, end] = calendarBounds(range)
  if (Number.isNaN(start) || Number.isNaN(end)) return 6
  const numDays = Math.round((end - start) / 86400000) + 1
  const offset = (new Date(start).getUTCDay() - firstDay + 7) % 7
  return Math.max(1, Math.ceil((offset + numDays) / 7))
}

type SliceParams = {
  name: string
  value: number
  percent: number
  seriesName?: string
}

export function buildPieOption(params: BuildPieOptionParams) {
  const {
    data,
    series,
    innerRadius,
    outerRadius,
    center,
    geo,
    calendar,
    startAngle,
    endAngle,
    padAngle,
    borderRadius,
    roseType,
    palette,
    showLabels,
    labelOnHover,
    labelOnClick,
    labelPosition,
    labelAlignTo,
    showLabelLine,
    labelFormatter,
    showTooltip,
    showLegend,
    legendPosition,
    legendIcon,
    legendAlign,
    legendStyle,
    scrollableLegend,
    highlightOnHover,
    selectedMode,
    formatValue,
    animate,
    emptyMessage,
    compact = false,
    stacked = false,
    width = 0,
    height = 0,
    revealedIndex,
  } = params

  const labelColor = readCssColor('--text-color-ds-default', 'rgb(23, 23, 23)')
  const subtleColor = readCssColor('--text-color-ds-subtle', 'rgb(82, 82, 82)')
  const lineColor = readCssColor(
    '--border-color-ds-default',
    'rgb(229, 229, 229)'
  )
  const surface = readCssColor(
    '--background-color-ds-elevation-surface-raised',
    'rgb(255, 255, 255)'
  )
  const sunken = readCssColor(
    '--background-color-ds-elevation-surface-sunken',
    'rgb(245, 245, 245)'
  )
  const inverse = readCssColor('--text-color-ds-inverse', 'rgb(250, 250, 250)')

  const contrastText = (fill: string) => {
    const m = fill.match(/[\d.]+/g)
    if (!m || m.length < 3) return 'rgb(250, 250, 250)'
    const [r, g, b] = m.map(Number)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.6 ? 'rgb(23, 23, 23)' : 'rgb(250, 250, 250)'
  }

  const multi = Boolean(series?.length)
  const seriesInput: PieSeries[] = multi ? (series as PieSeries[]) : [{ data }]

  const hasData = seriesInput.some(item => item.data.length > 0)
  if (!hasData) {
    return {
      title: {
        text: emptyMessage,
        left: 'center',
        top: 'middle',
        textStyle: {
          color: subtleColor,
          fontSize: 13,
          fontWeight: 'normal' as const,
        },
      },
    }
  }

  const categorical = resolveCategoricalPalette()

  const brandRamp = (count: number) => {
    const base = resolveVariant('primary')
    return Array.from({ length: Math.max(count, 1) }, (_, index) =>
      lighten(base, Math.min(0.62, index * 0.12))
    )
  }

  const legendShown = showLegend ?? seriesInput.length === 1
  const legendVertical = legendPosition === 'left' || legendPosition === 'right'

  const calOrientVertical = (calendar?.orient ?? 'horizontal') === 'vertical'
  const calWeeks = calendar
    ? calendarWeeks(calendar.range, calendar.firstDay ?? 1)
    : 1
  const calCols = calOrientVertical ? 7 : calWeeks
  const calRows = calOrientVertical ? calWeeks : 7

  const legendLabelChars = seriesInput.reduce(
    (acc, item) =>
      item.data.reduce((acc, item) => Math.max(acc, item.label.length), acc),
    0
  )
  const legendBand = 44
  const legendSideWidth = 20 + legendLabelChars * 7
  // On narrow (mobile) containers a side legend sized purely off label length
  // can eat past half the width and collide with the pie itself, so once the
  // real pixel width is known, cap it and shrink/shift the pie to match.
  const sideLegendWidth =
    legendVertical && width > 0
      ? Math.min(legendSideWidth, Math.max(64, Math.round(width * 0.42)))
      : legendSideWidth

  const calInset = calendar
    ? {
        top:
          (legendShown && legendPosition === 'top' ? legendBand : 8) +
          (calOrientVertical ? 26 : 0),
        bottom: legendShown && legendPosition === 'bottom' ? legendBand : 8,
        left:
          (legendShown && legendPosition === 'left' ? legendSideWidth : 0) +
          (calOrientVertical ? 8 : 40),
        right:
          (legendShown && legendPosition === 'right' ? legendSideWidth : 0) + 8,
      }
    : { top: 8, bottom: 8, left: 8, right: 8 }

  const explicitCell = calendar?.cellSize
  const cellSize: [number, number] = Array.isArray(explicitCell)
    ? explicitCell
    : explicitCell !== undefined
      ? [explicitCell, explicitCell]
      : calendar && width > 0
        ? (() => {
            const availW = width - calInset.left - calInset.right
            const availH =
              (height > 0 ? height : Number.POSITIVE_INFINITY) -
              calInset.top -
              calInset.bottom
            const cell = Math.max(
              24,
              Math.floor(Math.min(availW / calCols, availH / calRows))
            )
            return [cell, cell]
          })()
        : [72, 72]

  const calAvailW = width - calInset.left - calInset.right
  const calAvailH =
    (height > 0 ? height : Number.POSITIVE_INFINITY) -
    calInset.top -
    calInset.bottom
  const calGridW = cellSize[0] * calCols
  const calGridH = cellSize[1] * calRows
  const calLeft =
    calInset.left + (width > 0 ? Math.max(0, (calAvailW - calGridW) / 2) : 0)
  // Anchor the grid to the legend's edge so it sits next to the legend rather
  // than floating in the centre; only centre vertically when the legend is on
  // the side or hidden.
  const calTop =
    legendShown && legendPosition === 'top'
      ? calInset.top
      : legendShown && legendPosition === 'bottom' && Number.isFinite(calAvailH)
        ? Math.max(calInset.top, height - calInset.bottom - calGridH)
        : calInset.top +
          (Number.isFinite(calAvailH)
            ? Math.max(0, (calAvailH - calGridH) / 2)
            : 0)

  const calCell = Math.min(cellSize[0], cellSize[1])
  const calSliceFont = Math.max(7, Math.min(12, Math.round(calCell * 0.14)))
  const calDayFont = Math.max(8, Math.min(13, Math.round(calCell * 0.16)))
  const calDayInset = Math.max(6, Math.round(calCell * 0.14))

  const legendSideKnown =
    legendShown && legendVertical && seriesInput.length === 1 && width > 0

  const defaultOuterRadius = (): PieCoord => {
    if (calendar) return Math.round(calCell * 0.38)
    if (geo) return 24
    if (legendSideKnown) {
      const pieAreaW = Math.max(0, width - sideLegendWidth)
      return Math.round(Math.min(pieAreaW, height || pieAreaW) * 0.375)
    }
    return '75%'
  }

  const resolveRadius = (
    inner?: PieCoord,
    outer?: PieCoord
  ): [PieCoord, PieCoord] => [inner ?? 0, outer ?? defaultOuterRadius()]

  const defaultCenter = (): [PieCoord, PieCoord] => {
    if (!legendShown || seriesInput.length > 1) return ['50%', '50%']
    if (legendPosition === 'top') return ['50%', '56%']
    if (legendPosition === 'bottom') return ['50%', '46%']
    if (legendSideKnown) {
      const pieAreaW = Math.max(0, width - sideLegendWidth)
      const centerX =
        legendPosition === 'left'
          ? sideLegendWidth + pieAreaW / 2
          : pieAreaW / 2
      return [Math.round(centerX), '50%']
    }
    if (legendPosition === 'left') return ['56%', '50%']
    return ['44%', '50%']
  }

  const buildLabel = (
    position: PieLabelPosition,
    alignTo: PieLabelAlignTo,
    show: boolean
  ) => ({
    show,
    position,
    overflow: (position === 'inside' ? 'none' : 'truncate') as
      | 'none'
      | 'truncate',
    color: position === 'inside' ? inverse : labelColor,
    fontSize: calendar ? calSliceFont : 12,
    ...(position === 'outside' && alignTo !== 'none'
      ? {
          alignTo,
          edgeDistance: alignTo === 'edge' ? '12%' : undefined,
          bleedMargin: 6,
        }
      : {}),
    formatter: (p: SliceParams) =>
      labelFormatter
        ? labelFormatter({
            name: p.name,
            value: p.value,
            percent: p.percent,
          })
        : p.name,
  })

  const buildDetailLabel = (detail: PieDetail, show: boolean) => {
    const { title, columns, rows } = detail
    const last = columns.length - 1
    const cellFontSize = compact ? 10 : 11
    const colGap = compact ? 8 : 12
    const colPad = (index: number) =>
      index === last ? [0, 0, 0, 0] : [0, colGap, 0, 0]
    const colWidth = (index: number) => {
      if (index === 0) return compact ? 44 : 54
      if (index === last) return compact ? 40 : 50
      return compact ? 50 : 64
    }
    const colAlign = (index: number): 'left' | 'right' =>
      index === last ? 'right' : 'left'

    const header = columns
      .map((column, index) => `{h${index}|${column}}`)
      .join('')
    const rowLines = rows.map((row, ri) => {
      const first = row.icon ? `{ic${ri}|}` : `{lbl|${row.label ?? ''}}`
      const rest = row.cells.map((cell, ci) => `{c${ci + 1}|${cell}}`).join('')
      return first + rest
    })
    const formatter = [
      `{title|${title ?? '{b}'}}`,
      header,
      '{hr|}',
      ...rowLines,
    ].join('\n')

    const rich: Record<string, unknown> = {
      title: {
        color: labelColor,
        align: 'center',
        fontWeight: 700,
        fontSize: compact ? 11 : 12,
        height: compact ? 18 : 22,
        padding: [0, 0, compact ? 5 : 6, 0],
      },
      hr: {
        borderColor: lineColor,
        width: '100%',
        borderWidth: 0.5,
        height: 0,
      },
      lbl: {
        color: labelColor,
        width: colWidth(0),
        align: 'left',
        fontSize: cellFontSize,
        padding: colPad(0),
      },
    }
    columns.forEach((_, index) => {
      rich[`h${index}`] = {
        color: subtleColor,
        width: colWidth(index),
        align: index === 0 ? 'left' : colAlign(index),
        height: compact ? 18 : 22,
        fontSize: cellFontSize,
        padding: colPad(index),
      }
    })
    for (let i = 1; i <= last; i++) {
      rich[`c${i}`] = {
        color: labelColor,
        width: colWidth(i),
        align: colAlign(i),
        fontSize: cellFontSize,
        padding: colPad(i),
      }
    }
    rows.forEach((row, ri) => {
      if (row.icon) {
        rich[`ic${ri}`] = {
          height: compact ? 16 : 20,
          width: colWidth(0),
          align: 'left',
          padding: colPad(0),
          backgroundColor: { image: row.icon },
        }
      }
    })

    return {
      show,
      position: 'outside' as const,
      formatter,
      backgroundColor: sunken,
      borderColor: lineColor,
      borderWidth: 1,
      borderRadius: 6,
      padding: detail.padding ?? (compact ? [6, 8, 6, 8] : [8, 10, 8, 10]),
      rich,
    }
  }

  const buildRichLabel = (label: PieCustomLabel, show: boolean) => {
    const { formatter, rich, ...rest } = label
    const themedRich =
      rich && 'hr' in rich
        ? {
            ...rich,
            hr: {
              ...(rich.hr as Record<string, unknown>),
              borderColor: lineColor,
            },
          }
        : rich
    return {
      show,
      position: 'outside' as const,
      color: labelColor,
      backgroundColor: sunken,
      borderColor: lineColor,
      borderWidth: 1,
      borderRadius: 6,
      padding: [6, 8, 6, 8] as [number, number, number, number],
      ...rest,
      ...(themedRich ? { rich: themedRich } : {}),
      formatter: Array.isArray(formatter) ? formatter.join('\n') : formatter,
    }
  }

  const pieSeries = seriesInput.map((item, seriesIndex) => {
    const sequence =
      palette === 'brand' ? brandRamp(item.data.length) : categorical
    const position = stacked ? 'inside' : (item.labelPosition ?? labelPosition)
    const alignTo = item.labelAlignTo ?? labelAlignTo
    const seriesShowLabels = item.showLabels ?? showLabels
    const seriesShowLabelLine = item.showLabelLine ?? showLabelLine
    const seriesPadAngle = item.padAngle ?? padAngle
    const seriesBorderRadius = item.borderRadius ?? borderRadius
    const seriesEndAngle = item.endAngle ?? endAngle
    const separated = seriesBorderRadius > 0 || seriesPadAngle > 0
    const clickReveal = labelOnClick && !stacked
    const restShow = clickReveal ? false : seriesShowLabels
    const revealOnHover = !restShow && labelOnHover && position === 'outside'
    const hasCard =
      Boolean(item.richLabel) ||
      item.data.some(item => item.detail || item.richLabel)

    return {
      name: item.name,
      type: 'pie' as const,
      ...(geo ? { coordinateSystem: 'geo' as const, geoIndex: 0 } : {}),
      ...(calendar
        ? { coordinateSystem: 'calendar' as const, calendarIndex: 0 }
        : {}),
      radius: resolveRadius(
        item.innerRadius ?? innerRadius,
        item.outerRadius ?? outerRadius
      ),
      center: calendar
        ? item.date
        : (item.center ?? center ?? (geo ? undefined : defaultCenter())),
      startAngle: item.startAngle ?? startAngle,
      ...(seriesEndAngle !== undefined ? { endAngle: seriesEndAngle } : {}),
      padAngle: seriesPadAngle,
      roseType: (item.roseType ?? roseType) || undefined,
      selectedMode:
        item.selectedMode ?? (clickReveal ? ('single' as const) : selectedMode),
      avoidLabelOverlap: true,
      label:
        !stacked && item.richLabel
          ? buildRichLabel(item.richLabel, restShow)
          : buildLabel(position, alignTo, restShow),
      labelLine: {
        show:
          (seriesShowLabelLine && position === 'outside' && restShow) ||
          (revealOnHover && seriesShowLabelLine),
        length: item.labelLineLength ?? (hasCard ? 26 : 12),
        length2: hasCard ? 10 : 6,
        smooth: true,
        lineStyle: { color: subtleColor },
      },
      itemStyle: {
        borderRadius: seriesBorderRadius,
        borderColor: separated ? surface : undefined,
        borderWidth: separated ? 2 : 0,
      },
      emphasis: {
        scale: true,
        scaleSize: 6,
        focus: highlightOnHover ? ('self' as const) : undefined,
        blurScope: highlightOnHover ? ('series' as const) : undefined,
        label: clickReveal
          ? undefined
          : seriesShowLabels
            ? { fontWeight: 'bold' as const }
            : labelOnHover
              ? { show: true }
              : undefined,
        labelLine:
          revealOnHover && seriesShowLabelLine ? { show: true } : undefined,
      },
      data: item.data.map((item, index) => {
        const color =
          item.color ??
          (item.variant
            ? resolveVariant(item.variant)
            : sequence[index % sequence.length])
        const isRevealed =
          clickReveal &&
          revealedIndex?.seriesIndex === seriesIndex &&
          revealedIndex?.dataIndex === index
        const labelPatch: { label?: Record<string, unknown> } = stacked
          ? { label: { color: contrastText(color) } }
          : item.richLabel
            ? { label: buildRichLabel(item.richLabel, restShow) }
            : item.detail
              ? { label: buildDetailLabel(item.detail, restShow) }
              : position === 'inside'
                ? { label: { color: contrastText(color) } }
                : {}
        return {
          name: item.label,
          value: item.value,
          ...(item.selected !== undefined ? { selected: item.selected } : {}),
          itemStyle: { color },
          emphasis: {
            itemStyle: { color: lighten(color) },
            ...(!stacked && !clickReveal && (item.detail || item.richLabel)
              ? { label: { show: true } }
              : {}),
          },
          ...(clickReveal
            ? {
                label: { ...(labelPatch.label ?? {}), show: isRevealed },
                labelLine: { show: isRevealed },
              }
            : labelPatch),
        }
      }),
    }
  })

  const datesInRange = (range: string | [string, string]): string[] => {
    const pad = (n: number) => String(n).padStart(2, '0')
    const iso = (t: number) => {
      const d = new Date(t)
      return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
    }
    let start: number
    let end: number
    if (Array.isArray(range)) {
      start = Date.parse(range[0])
      end = Date.parse(range[1])
    } else if (/^\d{4}-\d{2}$/.test(range)) {
      const [y, m] = range.split('-').map(Number)
      start = Date.UTC(y, m - 1, 1)
      end = Date.UTC(y, m, 0)
    } else if (/^\d{4}$/.test(range)) {
      start = Date.UTC(Number(range), 0, 1)
      end = Date.UTC(Number(range), 11, 31)
    } else {
      start = Date.parse(range)
      end = start
    }
    if (Number.isNaN(start) || Number.isNaN(end)) return []
    const out: string[] = []
    for (let t = start; t <= end; t += 86400000) out.push(iso(t))
    return out
  }

  const dayNumberSeries =
    calendar && calendar.showDayNumbers !== false
      ? [
          {
            type: 'scatter' as const,
            coordinateSystem: 'calendar' as const,
            calendarIndex: 0,
            symbolSize: 0,
            silent: true,
            animation: false,
            label: {
              show: true,
              formatter: (p: { data: [string, number, number] }) =>
                String(p.data[2]),
              offset: [
                -cellSize[0] / 2 + calDayInset,
                -cellSize[1] / 2 + calDayInset,
              ] as [number, number],
              color: subtleColor,
              fontSize: calDayFont,
            },
            data: datesInRange(calendar.range).map(item => [
              item,
              0,
              Number(item.slice(-2)),
            ]),
          },
        ]
      : []

  const legendData: string[] = []
  const seen = new Set<string>()
  seriesInput.forEach(item =>
    item.data.forEach(item => {
      if (!seen.has(item.label)) {
        seen.add(item.label)
        legendData.push(item.label)
      }
    })
  )

  return {
    animation: animate && !prefersReducedMotion(),
    animationDuration: 600,
    animationEasing: 'cubicOut' as const,
    ...(geo
      ? {
          geo: {
            map: geo.map,
            roam: geo.roam ?? false,
            silent: !geo.roam,
            layoutCenter: geo.layoutCenter ?? ['50%', '50%'],
            layoutSize: geo.layoutSize ?? '92%',
            ...(geo.aspectScale !== undefined
              ? { aspectScale: geo.aspectScale }
              : {}),
            itemStyle: {
              areaColor: geo.areaColor ?? sunken,
              borderColor: geo.borderColor ?? lineColor,
              borderWidth: 1,
            },
            emphasis: { disabled: true },
          },
        }
      : {}),
    ...(calendar
      ? {
          calendar: {
            range: calendar.range,
            cellSize,
            orient: calendar.orient ?? 'horizontal',
            top: calendar.top ?? Math.round(calTop),
            left: calendar.left ?? Math.round(calLeft),
            ...(calendar.bottom !== undefined
              ? { bottom: calendar.bottom }
              : {}),
            ...(calendar.right !== undefined ? { right: calendar.right } : {}),
            itemStyle: {
              color: calendar.cellColor ?? surface,
              borderColor: calendar.borderColor ?? lineColor,
              borderWidth: 1,
            },
            splitLine: {
              lineStyle: { color: calendar.borderColor ?? lineColor },
            },
            dayLabel: {
              margin: 12,
              firstDay: calendar.firstDay ?? 1,
              ...(calendar.dayNames ? { nameMap: calendar.dayNames } : {}),
              color: subtleColor,
              fontSize: 12,
            },
            monthLabel: {
              show: calendar.showMonthLabel ?? false,
              color: labelColor,
              fontSize: 12,
            },
            yearLabel: { show: calendar.showYearLabel ?? false },
          },
        }
      : {}),
    legend: buildLegendOption({
      shown: legendShown,
      data: legendData,
      position: legendPosition,
      icon: legendIcon,
      align: legendAlign,
      scrollable: scrollableLegend,
      sideWidth: legendVertical && width > 0 ? sideLegendWidth : undefined,
      colors: { label: labelColor, subtle: subtleColor, line: lineColor },
      style: legendStyle,
    }),
    tooltip: {
      show: showTooltip,
      trigger: 'item' as const,
      backgroundColor: surface,
      borderColor: lineColor,
      borderWidth: 1,
      padding: [4, 8] as [number, number],
      textStyle: { color: labelColor, fontSize: 11 },
      extraCssText: 'border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.08);',
      formatter: (p: SliceParams) => {
        const head =
          multi && p.seriesName ? `${p.seriesName} · ${p.name}` : p.name
        return `${head}: ${formatValue(p.value)} (${p.percent}%)`
      },
    },
    series: [...dayNumberSeries, ...pieSeries],
  }
}
