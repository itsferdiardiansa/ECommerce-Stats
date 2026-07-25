import { createElement, type ComponentType } from 'react'
import { render } from '@react-email/render'
import { CodeEmail } from './templates/CodeEmail'
import { AlertEmail } from './templates/AlertEmail'
import { MethodEmail } from './templates/MethodEmail'
import {
  copy,
  methodCopy,
  type Locale,
  type CodeVars,
  type AlertVars,
  type MethodVars,
} from './copy'

/** Maps each email to its variable shape (compile-time checked per template). */
export interface EmailVars {
  'verification-code': CodeVars
  'step-up-otp': CodeVars
  'new-sign-in': AlertVars
  'blocked-attempt': AlertVars
  'suspicious-login': AlertVars
  'session-compromise': AlertVars
  'password-changed': AlertVars
  'recovery-code-used': AlertVars
  'security-method-enabled': MethodVars
  'security-method-disabled': MethodVars
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
  'password-changed': AlertEmail as unknown as AnyComponent,
  'recovery-code-used': AlertEmail as unknown as AnyComponent,
  'security-method-enabled': MethodEmail as unknown as AnyComponent,
  'security-method-disabled': MethodEmail as unknown as AnyComponent,
}

function isCodeEmail(
  name: EmailName
): name is 'verification-code' | 'step-up-otp' {
  return name === 'verification-code' || name === 'step-up-otp'
}

type MethodEmailName = 'security-method-enabled' | 'security-method-disabled'

function isMethodEmail(name: EmailName): name is MethodEmailName {
  return (
    name === 'security-method-enabled' || name === 'security-method-disabled'
  )
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
  const key: Locale = locale === 'id' ? 'id' : 'en'

  type Build = (v: EmailVars[N]) => Record<string, unknown> & {
    subject: string
  }

  const build = isMethodEmail(name)
    ? (methodCopy[key][name] as unknown as Build)
    : (copy[key][
        name as Exclude<EmailName, MethodEmailName>
      ] as unknown as Build)

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
