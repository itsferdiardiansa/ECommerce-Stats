import * as echarts from 'echarts/core'
import { GeoComponent } from 'echarts/components'

type GeoJson = Parameters<typeof echarts.registerMap>[1]

let used = false

export function registerGeoMap(name: string, geoJson: unknown): void {
  if (!used) {
    echarts.use([GeoComponent])
    used = true
  }
  echarts.registerMap(name, geoJson as GeoJson)
}
