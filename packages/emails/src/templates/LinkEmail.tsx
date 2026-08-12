import { Text, Button, Link, Section } from '@react-email/components'
import { Layout } from '../components/Layout'

export interface LinkEmailProps {
  preview: string
  heading: string
  greeting: string
  body: string
  buttonLabel: string
  url: string
  expiry: string
  fallback: string
  footer: string
}

/**
 * Shared layout for action-link emails (password reset). The wording differs
 * per use case and locale - it's injected via props from the copy layer, so
 * this component stays purely presentational.
 */
export function LinkEmail(props: LinkEmailProps) {
  return (
    <Layout
      preview={props.preview}
      heading={props.heading}
      footer={props.footer}
    >
      <Text>{props.greeting}</Text>
      <Text>{props.body}</Text>
      <Section style={{ textAlign: 'center', margin: '24px 0' }}>
        <Button
          href={props.url}
          style={{
            backgroundColor: '#111827',
            color: '#ffffff',
            borderRadius: '8px',
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          {props.buttonLabel}
        </Button>
      </Section>
      <Text style={{ fontSize: '13px', color: '#6b7280' }}>{props.expiry}</Text>
      <Text style={{ fontSize: '12px', color: '#9ca3af' }}>
        {props.fallback}{' '}
        <Link
          href={props.url}
          style={{ color: '#2563eb', wordBreak: 'break-all' }}
        >
          {props.url}
        </Link>
      </Text>
    </Layout>
  )
}
