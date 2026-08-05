import type { ComponentType } from 'react'
import { Fingerprint, KeyRound, Smartphone } from 'lucide-react'
import AppleIcon from '@/assets/icons/brands/apple.svg'
import GoogleIcon from '@/assets/icons/brands/google.svg'
import WindowsIcon from '@/assets/icons/brands/windows.svg'
import OnePasswordIcon from '@/assets/icons/brands/1password.svg'
import type { PasskeySummary } from '@/features/auth/types'

type IconComponent = ComponentType<{ className?: string }>

interface Provider {
  name: string
  icon?: IconComponent
}

const AAGUID_PROVIDERS: Record<string, Provider> = {
  'fbfc3007-154e-4ecc-8c0b-6e020557d7bd': {
    name: 'iCloud Keychain',
    icon: AppleIcon,
  },
  'ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4': {
    name: 'Google Password Manager',
    icon: GoogleIcon,
  },
  'adce0002-35bc-c60a-648b-0b25f1f05503': {
    name: 'Chrome on Mac',
    icon: GoogleIcon,
  },
  'bada5566-a7aa-401f-bd96-45619a55120d': {
    name: '1Password',
    icon: OnePasswordIcon,
  },
  '08987058-cadc-4b81-b6e1-30de50dcbe96': {
    name: 'Windows Hello',
    icon: WindowsIcon,
  },
  '9ddd1817-af5a-4672-a2b9-3e3dd95000a9': {
    name: 'Windows Hello',
    icon: WindowsIcon,
  },
  '6028b017-b1d4-4c02-b4b3-afcdafc96bb2': {
    name: 'Windows Hello',
    icon: WindowsIcon,
  },
  'ee882879-721c-4913-9775-3dfcce97072a': {
    name: 'Windows Hello',
    icon: WindowsIcon,
  },
  'd548826e-79b4-db40-a3d8-11116f7e8349': { name: 'Bitwarden' },
  '531126d6-e717-415c-9320-3d9aa6981239': { name: 'Dashlane' },
  'b84e4048-15dc-4dd0-8640-f4f60813c8af': { name: 'NordPass' },
  'cc45f64e-52a2-451b-831a-4edd8022a202': { name: 'ToothPic' },
  '891494da-2c90-4d31-a9d4-4eb0676e3d31': { name: 'Samsung Pass' },
}

type PasskeyLike = Pick<PasskeySummary, 'aaguid' | 'transports' | 'deviceType'>

function isSecurityKey(pk: PasskeyLike): boolean {
  const t = pk.transports ?? []
  return t.includes('usb') || t.includes('nfc') || t.includes('ble')
}

export function passkeyProviderName(pk: PasskeyLike): string {
  const provider = pk.aaguid ? AAGUID_PROVIDERS[pk.aaguid] : undefined
  if (provider) return provider.name
  if (isSecurityKey(pk)) return 'Security key'
  return 'Device passkey'
}

export function passkeyIcon(pk: PasskeyLike): IconComponent {
  const provider = pk.aaguid ? AAGUID_PROVIDERS[pk.aaguid] : undefined
  if (provider?.icon) return provider.icon
  if (isSecurityKey(pk)) return KeyRound
  if (pk.deviceType === 'multiDevice') return Smartphone
  return Fingerprint
}
