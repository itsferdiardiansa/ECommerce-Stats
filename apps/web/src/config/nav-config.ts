import { NavItem } from '@/types';

/**
 * Navigation configuration
 *
 * Simplified navigation with only the overview dashboard.
 */
export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/',
    icon: 'dashboard',
    isActive: true,
    shortcut: ['d', 'd'],
    items: []
  }
];
