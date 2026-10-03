import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  TrendingDown,
  Bell,
  BarChart3,
  FileText,
  Settings,
  PlusCircle,
  LucideIcon,
} from 'lucide-react'

export interface NavigationItem {
  title: string
  href: string
  icon: LucideIcon
  badge?: string | number
  description: string
}

export const MAIN_NAVIGATION: NavigationItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'System overview, KPIs, and alerts',
  },
  {
    title: 'Products',
    href: '/products',
    icon: Package,
    description: 'Catalog, barcodes, and product details',
  },
  {
    title: 'Inventory',
    href: '/inventory',
    icon: Layers,
    description: 'Stock levels, batches, and locations',
  },
  {
    title: 'Purchases',
    href: '/purchases',
    icon: ShoppingBag,
    description: 'Invoices, prices, and vendor tracking',
  },
  {
    title: 'Consumption',
    href: '/consumption',
    icon: TrendingDown,
    description: 'Depletion rate and usage history',
  },
  {
    title: 'Notifications',
    href: '/notifications',
    icon: Bell,
    badge: '3',
    description: 'Expiry alerts and stock warnings',
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    description: 'Trends, burn rate, and category insights',
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: FileText,
    description: 'Exportable logs and financial summaries',
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'Preferences, thresholds, and accounts',
  },
]

export const QUICK_ACTIONS = [
  {
    title: 'Add New Product',
    href: '/products/new',
    icon: PlusCircle,
    variant: 'primary' as const,
  },
]
