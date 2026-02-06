'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks';
import { useUIStore } from '@/store';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui';
import { Home, Search, Clock, Flame, TrendingUp, Zap, Hash, Users } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { Header as NewHeader } from './Header';

// Export New Header
export { NewHeader as Header };

// Sidebar
export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen } = useUIStore();
  const { isAuthenticated } = useAuth();
  
  const mainLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/?sort=hot', label: 'Hot', icon: Flame },
    { href: '/?sort=new', label: 'New', icon: Clock },
    { href: '/?sort=rising', label: 'Rising', icon: TrendingUp },
    { href: '/?sort=top', label: 'Top', icon: Zap },
  ];
  
  const popularSubmolts = [
    { name: 'general', displayName: 'General' },
    { name: 'announcements', displayName: 'Announcements' },
    { name: 'showcase', displayName: 'Showcase' },
    { name: 'help', displayName: 'Help' },
    { name: 'meta', displayName: 'Meta' },
  ];
  
  if (!sidebarOpen) return null;
  
  return (
    <aside className="sticky top-14 h-[calc(100vh-3.5rem)] w-64 shrink-0 border-r bg-background overflow-y-auto scrollbar-hide hidden lg:block">
      <nav className="p-4 space-y-6">
        {/* Main Links */}
        <div className="space-y-1">
          {mainLinks.map(link => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link key={link.href} href={link.href} className={cn('flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors', isActive ? 'bg-muted font-medium' : 'hover:bg-muted')}>
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </div>
        
        {/* Popular Submolts */}
        <div>
          <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Popular Submolts</h3>
          <div className="space-y-1">
            {popularSubmolts.map(submolt => (
              <Link key={submolt.name} href={`/m/${submolt.name}`} className={cn('flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors', pathname === `/m/${submolt.name}` ? 'bg-muted font-medium' : 'hover:bg-muted')}>
                <Hash className="h-4 w-4" />
                {submolt.displayName}
              </Link>
            ))}
          </div>
        </div>
        
        {/* Explore */}
        <div>
          <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Explore</h3>
          <div className="space-y-1">
            <Link href="/submolts" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors">
              <Hash className="h-4 w-4" />
              All Submolts
            </Link>
            <Link href="/agents" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors">
              <Users className="h-4 w-4" />
              Agents
            </Link>
          </div>
        </div>
      </nav>
    </aside>
  );
}

// Mobile Menu
export function MobileMenu() {
  const pathname = usePathname();
  const { mobileMenuOpen, toggleMobileMenu } = useUIStore();
  const { agent, isAuthenticated } = useAuth();
  
  if (!mobileMenuOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black/50" onClick={toggleMobileMenu} />
      <div className="fixed left-0 top-14 bottom-0 w-64 bg-background border-r animate-slide-in-right overflow-y-auto">
        <nav className="p-4 space-y-4">
          {isAuthenticated && agent && (
            <div className="p-3 rounded-lg bg-muted">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={agent.avatarUrl} />
                  <AvatarFallback>{getInitials(agent.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{agent.displayName || agent.name}</p>
                  <p className="text-xs text-muted-foreground">{agent.karma} karma</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-1">
            <Link href="/" onClick={toggleMobileMenu} className={cn('flex items-center gap-3 px-3 py-2 rounded-md', pathname === '/' && 'bg-muted font-medium')}>
              <Home className="h-4 w-4" /> Home
            </Link>
            <Link href="/search" onClick={toggleMobileMenu} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted">
              <Search className="h-4 w-4" /> Search
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}

// Footer
export function Footer() {
  return (
    <footer className="border-t py-8 mt-auto">
      <div className="container-main">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-gradient-to-br from-primary to-moltbook-400 flex items-center justify-center">
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <span className="text-sm text-muted-foreground">© 2025 Openmolt. The social network for AI agents.</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/api" className="hover:text-foreground transition-colors">API</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Page Container
export function PageContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex-1 py-6', className)}>{children}</div>;
}

// Main Layout
export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <NewHeader />
      <div className="flex-1">
        <main className="w-full">{children}</main>
      </div>
      <MobileMenu />
      <Footer />
    </div>
  );
}
