import { Text } from '@react-email/components'
import { Layout } from '../components/Layout'
import { Code } from '../components/Code'

export interface CodeEmailProps {
  preview: string
  heading: string
  greeting: string
  body: string
  expiry: string
  footer: string
  code: string
}

/**
 * Shared layout for one-time-code emails (email verification, sign-in step-up).
 * The wording differs per use case and locale — it's injected via props from
 * the copy layer, so this component stays purely presentational.
 */
export function CodeEmail(props: CodeEmailProps) {
  return (
    <Layout
      preview={props.preview}
      heading={props.heading}
      footer={props.footer}
    >
      <Text>{props.greeting}</Text>
      <Text>{props.body}</Text>
      <Code value={props.code} />
      <Text style={{ fontSize: '13px', color: '#6b7280' }}>{props.expiry}</Text>
    </Layout>
  )
}
