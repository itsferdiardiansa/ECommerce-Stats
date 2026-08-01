import { Text, Section } from '@react-email/components'
import { Layout } from '../components/Layout'

export interface MethodEmailProps {
  preview: string
  heading: string
  greeting: string
  body: string
  methodName: string
  methodNote: string
  whenLabel: string
  when: string
  fromLabel: string
  from: string | null
  action: string
  actionTone: 'neutral' | 'warning'
  footer: string
}

export function MethodEmail(props: MethodEmailProps) {
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
          borderLeft: '3px solid #111827',
          padding: '4px 0 4px 16px',
          margin: '20px 0',
        }}
      >
        <Text
          style={{
            margin: '0',
            fontSize: '17px',
            fontWeight: 700,
            color: '#111827',
          }}
        >
          {props.methodName}
        </Text>
        <Text
          style={{
            margin: '2px 0 0',
            fontSize: '13px',
            color: '#6b7280',
            lineHeight: '20px',
          }}
        >
          {props.methodNote}
        </Text>
      </Section>

      <Text style={{ margin: '0 0 6px', fontSize: '14px', color: '#374151' }}>
        <strong>{props.whenLabel}</strong> {props.when}
      </Text>
      {props.from ? (
        <Text style={{ margin: '0', fontSize: '14px', color: '#374151' }}>
          <strong>{props.fromLabel}</strong> {props.from}
        </Text>
      ) : null}

      <Text
        style={{
          marginTop: '20px',
          color: props.actionTone === 'warning' ? '#b91c1c' : '#374151',
          fontWeight: props.actionTone === 'warning' ? 700 : 400,
        }}
      >
        {props.action}
      </Text>
    </Layout>
  )
}
