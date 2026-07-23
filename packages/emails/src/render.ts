import { createElement, type ComponentType } from 'react'
import { render } from '@react-email/render'
import { CodeEmail } from './templates/CodeEmail'
import { AlertEmail } from './templates/AlertEmail'
import { copy, type Locale, type CodeVars, type AlertVars } from './copy'

/** Maps each email to its variable shape (compile-time checked per template). */
export interface EmailVars {
  'verification-code': CodeVars
  'step-up-otp': CodeVars
  'new-sign-in': AlertVars
  'blocked-attempt': AlertVars
  'suspicious-login': AlertVars
  'session-compromise': AlertVars
}

export type EmailName = keyof EmailVars

export interface RenderedEmail {
  subject: string
  html: string
  text: string
}

type AnyComponent = ComponentType<Record<string, unknown>>

const COMPONENTS: Record<EmailName, AnyComponent> = {
  'verification-code': CodeEmail as unknown as AnyComponent,
  'step-up-otp': CodeEmail as unknown as AnyComponent,
  'new-sign-in': AlertEmail as unknown as AnyComponent,
  'blocked-attempt': AlertEmail as unknown as AnyComponent,
  'suspicious-login': AlertEmail as unknown as AnyComponent,
  'session-compromise': AlertEmail as unknown as AnyComponent,
}

function isCodeEmail(
  name: EmailName
): name is 'verification-code' | 'step-up-otp' {
  return name === 'verification-code' || name === 'step-up-otp'
}

/**
 * Renders a transactional email to { subject, html, text } for the given
 * locale. Self-contained: pass a locale + the dynamic vars, get a ready-to-send
 * message. Unknown locales fall back to English.
 */
export async function renderEmail<N extends EmailName>(
  name: N,
  locale: string,
  vars: EmailVars[N]
): Promise<RenderedEmail> {
  const localeCopy = copy[locale as Locale] ?? copy.en
  const build = localeCopy[name] as unknown as (
    v: EmailVars[N]
  ) => Record<string, string> & { subject: string }

  const { subject, ...strings } = build(vars)
  const props: Record<string, unknown> = isCodeEmail(name)
    ? { ...strings, code: (vars as CodeVars).code }
    : strings

  const element = createElement(COMPONENTS[name], props)

  const [html, text] = await Promise.all([
    render(element, { pretty: true }),
    render(element, { plainText: true }),
  ])

  return { subject, html, text }
}
