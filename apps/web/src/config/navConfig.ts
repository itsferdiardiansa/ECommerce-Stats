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
  { title: 'Profile', url: '/account', items: [] },
  {
    title: 'Security',
    url: '/account/security',
    items: [
      { title: 'Password', url: '/account/security/password' },
      { title: 'Two factor', url: '/account/security/two-factor' },
      { title: 'Passkeys', url: '/account/security/passkeys' },
    ],
  },
  { title: 'Sessions and devices', url: '/account/sessions', items: [] },
  { title: 'Activity', url: '/account/activity', items: [] },
  { title: 'Connections', url: '/account/connections', items: [] },
  { title: 'Notifications', url: '/account/notifications', items: [] },
]
