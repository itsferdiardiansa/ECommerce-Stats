import { NavItem } from '@/types'

export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/',
    icon: 'dashboard',
    isActive: true,
    shortcut: ['d', 'd'],
    items: [],
  },
]

export const accountNavItems: NavItem[] = [
  { title: 'Profile', url: '/account', icon: 'profile', items: [] },
  {
    title: 'Security',
    url: '/account/security',
    icon: 'security',
    items: [
      { title: 'Password', url: '/account/security/password' },
      { title: 'Two factor', url: '/account/security/two-factor' },
      { title: 'Passkeys', url: '/account/security/passkeys' },
    ],
  },
  {
    title: 'Sessions and devices',
    url: '/account/sessions',
    icon: 'sessions',
    items: [],
  },
  {
    title: 'Preferences',
    url: '/account/preferences',
    icon: 'preferences',
    items: [],
  },
  {
    title: 'Notifications',
    url: '/account/notifications',
    icon: 'notifications',
    items: [],
  },
  {
    title: 'Addresses',
    url: '/account/addresses',
    icon: 'addresses',
    items: [],
  },
  { title: 'Activity', url: '/account/activity', icon: 'activity', items: [] },
  {
    title: 'Connections',
    url: '/account/connections',
    icon: 'connections',
    items: [],
  },
]
