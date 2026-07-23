import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Text,
  Hr,
} from '@react-email/components'
import type { ReactNode } from 'react'

const styles = {
  body: {
    backgroundColor: '#f4f4f7',
    fontFamily: 'Helvetica, Arial, sans-serif',
    margin: '0',
    padding: '24px',
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    maxWidth: '480px',
    margin: '0 auto',
    padding: '32px',
  },
  brand: { fontSize: '18px', fontWeight: 700, color: '#111827', margin: '0' },
  heading: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#111827',
    marginTop: '8px',
  },
  footer: { fontSize: '12px', color: '#9ca3af', marginTop: '8px' },
  hr: { borderColor: '#e5e7eb', margin: '20px 0' },
}

export interface LayoutProps {
  preview?: string
  heading?: string
  footer?: string
  children: ReactNode
}

export function Layout({ preview, heading, footer, children }: LayoutProps) {
  return (
    <Html>
      <Head />
      {preview ? <Preview>{preview}</Preview> : null}
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={styles.brand}>Rufieltics</Text>
          <Hr style={styles.hr} />
          {heading ? <Text style={styles.heading}>{heading}</Text> : null}
          {children}
          <Hr style={styles.hr} />
          {footer ? <Text style={styles.footer}>{footer}</Text> : null}
        </Container>
      </Body>
    </Html>
  )
}
