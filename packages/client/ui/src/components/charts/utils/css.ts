// The element CSS variables are resolved against. Defaults to <body>, but charts
// set it to their own container so a nested `data-theme` scope (e.g. a themed
// Storybook canvas) resolves correctly instead of always using the root theme.
let colorScope: HTMLElement | null = null

export function setColorScope(el: HTMLElement | null): void {
  colorScope = el
}

export function readCssColor(varName: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback
  const host = colorScope?.isConnected ? colorScope : document.body
  const probe = document.createElement('span')
  probe.style.color = `var(${varName})`
  probe.style.position = 'absolute'
  probe.style.opacity = '0'
  probe.style.pointerEvents = 'none'
  host.appendChild(probe)
  const color = getComputedStyle(probe).color
  probe.remove()
  return color || fallback
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}
