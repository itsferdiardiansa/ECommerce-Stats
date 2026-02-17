import { describe, it, expect } from 'vitest'
import { normalizeName, slugify, makeExternalUserData } from '../utils.js'

describe('libs/utils', () => {
  it('normalizeName trims and returns null for empty', () => {
    expect(normalizeName(undefined)).toBeNull()
    expect(normalizeName('   ')).toBeNull()
    expect(normalizeName('  hello ')).toBe('hello')
  })

  it('slugify returns fallback when input becomes empty', () => {
    const s = slugify('!!!', 'fallback')
    expect(s.startsWith('fallback-')).toBe(true)
  })

  it('makeExternalUserData returns expected shape', () => {
    const data = makeExternalUserData(7)
    expect(data).toEqual(
      expect.objectContaining({ id: 7, email: 'external-order-7@example.com' })
    )
  })
})
