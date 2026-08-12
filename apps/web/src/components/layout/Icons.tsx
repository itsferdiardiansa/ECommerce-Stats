import {
  IconLayoutDashboard,
  IconUser,
  IconShieldLock,
  IconDevices,
  IconAdjustmentsHorizontal,
  IconBell,
  IconMapPin,
  IconActivity,
  IconPlugConnected,
  IconProps,
} from '@tabler/icons-react'

export type Icon = React.ComponentType<IconProps>

export const Icons = {
  dashboard: IconLayoutDashboard,
  profile: IconUser,
  security: IconShieldLock,
  sessions: IconDevices,
  preferences: IconAdjustmentsHorizontal,
  notifications: IconBell,
  addresses: IconMapPin,
  activity: IconActivity,
  connections: IconPlugConnected,
}

export type IconKey = keyof typeof Icons
