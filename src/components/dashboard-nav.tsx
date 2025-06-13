'use client';

import {
  Home,
  Music,
  Settings,
  Building2,
  CreditCard,
  CalendarDays,
  LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

// TypeScript interfaces for navigation structure
export interface NavigationItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export interface NavigationGroup {
  label: string;
  items: NavigationItem[];
}

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export function DashboardNav(): JSX.Element {
  const pathname = usePathname();
  const t = useTranslations('DashboardLayout');

  // Helper function to check if a route is active
  const isActiveRoute = (href: string): boolean => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  // Helper function to render navigation items
  const renderNavigationItem = (item: NavigationItem): JSX.Element => (
    <SidebarMenuItem key={item.href}>
      <SidebarMenuButton asChild isActive={isActiveRoute(item.href)}>
        <Link href={item.href}>
          <item.icon className="h-4 w-4" />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  const navItems: NavigationItem[] = [
    {
      title: t('dashboard'),
      href: '/dashboard',
      icon: Home,
    },
    {
      title: t('organization'),
      href: '/dashboard/organization',
      icon: Building2,
    },
    {
      title: t('programs'),
      href: '/dashboard/programs',
      icon: CalendarDays,
    },
    {
      title: t('hymns'),
      href: '/dashboard/hymns',
      icon: Music,
    },
    {
      title: t('subscription'),
      href: '/dashboard/subscription',
      icon: CreditCard,
    },
  ];

  const settingsItem: NavigationItem = {
    title: t('settings'),
    href: '/dashboard/organization-profile',
    icon: Settings,
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(renderNavigationItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Configuration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {renderNavigationItem(settingsItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}