import { Text, Section, Row, Column, Button } from '@react-email/components'
import { Layout } from '../components/Layout'

export interface AlertEmailProps {
  preview: string
  heading: string
  greeting: string
  body: string
  deviceLabel: string
  device: string | null
  locationLabel: string
  location: string | null
  ipLabel: string
  ip: string | null
  action: string
  secureLabel?: string
  secureUrl?: string
  footer: string
}

export function AlertEmail(props: AlertEmailProps) {
  const rows: Array<{ label: string; value: string }> = [
    { label: props.deviceLabel, value: props.device ?? '' },
    { label: props.locationLabel, value: props.location ?? '' },
    { label: props.ipLabel, value: props.ip ?? '' },
  ].filter(r => r.value)

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
        {rows.map(r => (
          <Row key={r.label} style={{ marginBottom: '4px' }}>
            <Column style={{ width: '42%', verticalAlign: 'top' }}>
              <Text style={{ margin: '0', fontSize: '13px', color: '#6b7280' }}>
                {r.label}
              </Text>
            </Column>
            <Column>
              <Text
                style={{
                  margin: '0',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#111827',
                }}
              >
                {r.value}
              </Text>
            </Column>
          </Row>
        ))}
      </Section>
      <Text style={{ fontWeight: 700, color: '#b91c1c' }}>{props.action}</Text>
      {props.secureUrl && props.secureLabel ? (
        <Section style={{ textAlign: 'center', margin: '24px 0' }}>
          <Button
            href={props.secureUrl}
            style={{
              backgroundColor: '#b91c1c',
              color: '#ffffff',
              borderRadius: '8px',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            {props.secureLabel}
          </Button>
        </Section>
      ) : null}
    </Layout>
  )
}
