import { Section, Text } from '@react-email/components'

const styles = {
  wrap: { textAlign: 'center' as const, margin: '24px 0' },
  code: {
    display: 'inline-block',
    fontSize: '30px',
    letterSpacing: '10px',
    fontWeight: 700,
    color: '#111827',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    padding: '12px 20px',
  },
}

export function Code({ value }: { value: string }) {
  return (
    <Section style={styles.wrap}>
      <Text style={styles.code}>{value}</Text>
    </Section>
  )
}
