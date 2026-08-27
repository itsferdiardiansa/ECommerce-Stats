import * as echarts from 'echarts/core'
import { ScatterChart } from 'echarts/charts'
import { CalendarComponent } from 'echarts/components'

let used = false

export function registerCalendar(): void {
  if (used) return
  echarts.use([CalendarComponent, ScatterChart])
  used = true
}
