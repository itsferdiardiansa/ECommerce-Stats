'use client'

import { useEffect, useState } from 'react'

export function usePrimaryColor(fallback = 'rgb(109, 40, 217)') {
  const [color, setColor] = useState(fallback)

  useEffect(() => {
    const probe = document.createElement('span')
    probe.style.color = 'var(--primary)'
    probe.style.position = 'absolute'
    probe.style.opacity = '0'
    probe.style.pointerEvents = 'none'
    document.body.appendChild(probe)
    const resolved = getComputedStyle(probe).color
    probe.remove()
    if (resolved) setColor(resolved)
  }, [])

  return color
}
