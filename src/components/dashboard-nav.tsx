'use client';

import type {
  LucideIcon,
} from 'lucide-react';
import {
  Building2,
  CalendarDays,
  CreditCard,
  Home,
  Music,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

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

// TypeScript interfaces for navigation structure
export type NavigationItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

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
          <item.icon className="size-4" />
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
