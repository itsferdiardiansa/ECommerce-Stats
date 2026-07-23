import { Text, Section } from '@react-email/components'
import { Layout } from '../components/Layout'

export interface AlertEmailProps {
  preview: string
  heading: string
  greeting: string
  body: string
  where: string
  whereLabel: string
  action: string
  footer: string
}

/**
 * Shared layout for security-notification emails (new sign-in, blocked attempt,
 * suspicious activity, session compromise). Purely presentational — wording and
 * severity come from the copy layer via props.
 */
export function AlertEmail(props: AlertEmailProps) {
  return (
    <Layout
      preview={props.preview}
      heading={props.heading}
      footer={props.footer}
    >
      <Text>{props.greeting}</Text>
      <Text>{props.body}</Text>
      <Section
        style={{
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          padding: '12px 16px',
          margin: '16px 0',
        }}
      >
        <Text style={{ margin: '0', fontSize: '13px', color: '#6b7280' }}>
          {props.whereLabel}
        </Text>
        <Text
          style={{
            margin: '0',
            fontSize: '15px',
            fontWeight: 700,
            color: '#111827',
          }}
        >
          {props.where}
        </Text>
      </Section>
      <Text style={{ fontWeight: 700, color: '#b91c1c' }}>{props.action}</Text>
    </Layout>
  )
}
