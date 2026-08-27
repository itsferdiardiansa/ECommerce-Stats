import {
  Children,
  isValidElement,
  type ElementType,
  type ReactNode,
} from 'react'

export interface PickedSlots<K extends string> {
  slots: Partial<Record<K, ReactNode>>
  rest: ReactNode[]
}

export function pickSlots<K extends string>(
  children: ReactNode,
  slots: Record<K, ElementType>
): PickedSlots<K> {
  const keys = Object.keys(slots) as K[]
  const matched: Partial<Record<K, ReactNode>> = {}
  const rest: ReactNode[] = []

  Children.forEach(children, child => {
    if (isValidElement(child)) {
      const key = keys.find(name => child.type === slots[name])
      if (key) {
        matched[key] = child
        return
      }
    }
    rest.push(child)
  })

  return { slots: matched, rest }
}
