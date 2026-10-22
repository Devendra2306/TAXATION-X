'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Upload,
  FileText,
  Scale,
  Download,
  Lightbulb,
  Activity,
  MessageSquare,
  Bell,
  ChevronDown,
  Menu,
  X,
  Search,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '@/components/Logo';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Upload Data', href: '/upload', icon: Upload },
  { name: 'Review Form 16', href: '/review', icon: FileText },
  { name: 'Compare Regimes', href: '/compare', icon: Scale },
  { name: 'Tax Optimizer', href: '/optimizer', icon: Lightbulb },
  { name: 'Refund Status', href: '/refund', icon: Activity },
  { name: 'Download ITR', href: '/export', icon: Download },
  { name: 'AI Tax Studio', href: '/chat', icon: MessageSquare, badge: 'AI' },
];

const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  upload: 'Upload Documents',
  review: 'Review Data',
  compare: 'Regime Comparison',
  optimizer: 'Tax Optimizer',
  refund: 'Refund Status',
  export: 'Download ITR',
  chat: 'AI Tax Expert Studio',
  ais: 'AIS Data',
  'select-plan': 'Select Plan',
  'verify-pan': 'Verify PAN',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pageKey = pathname.split('/').pop() || 'dashboard';

  const [userName, setUserName] = useState('Loading...');
  const [userInitials, setUserInitials] = useState('..');

  useEffect(() => {
    const fetchProfile = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) {
        const dest = encodeURIComponent(pathname || '/dashboard');
        router.push(`/login?redirect=${dest}`);
        return;
      }

      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          const name = data.full_name || data.email.split('@')[0];
          setUserName(name);
          setUserInitials(name.substring(0, 2).toUpperCase());
        } else {
          // Token invalid or expired
          localStorage.removeItem('access_token');
          const dest = encodeURIComponent(pathname || '/dashboard');
          router.push(`/login?redirect=${dest}`);
        }
      } catch (err) {
        console.error('Profile fetch failed:', err);
        localStorage.removeItem('access_token');
        const dest = encodeURIComponent(pathname || '/dashboard');
        router.push(`/login?redirect=${dest}`);
      }
    };
    fetchProfile();
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'w-72 fixed inset-y-0 left-0 bg-white border-r border-border flex flex-col z-50 transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-border">
          <Logo size="sm" href="/dashboard" />
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Menu</p>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link key={item.name} href={item.href} onClick={() => setSidebarOpen(false)}>
                <div className={isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}>
                  <Icon className={cn('h-[18px] w-[18px]', isActive ? 'text-primary' : '')} />
                  <span className="flex-1 truncate">{item.name}</span>
                  {item.badge && (
                    <span className="text-[10px] font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 px-1.5 py-0.2 rounded-md">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary ml-1" />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div onClick={handleLogout} className="flex items-center gap-3 p-3 rounded-xl bg-muted/60 hover:bg-muted transition-colors cursor-pointer group">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-[hsl(260,80%,58%)] flex items-center justify-center text-xs font-bold text-white shadow-md shadow-primary/25">
              {userInitials}
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-semibold text-foreground truncate">{userName}</span>
              <span className="text-xs text-muted-foreground">Pro Plan • AY 2025-26</span>
            </div>
            <LogOut className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-72 flex flex-col min-h-screen">
        <header className="h-16 sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-muted text-muted-foreground"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-foreground">
                {pageTitles[pageKey] || 'Dashboard'}
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Assessment Year 2025-26</p>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            <div className="hidden md:flex items-center gap-2 bg-muted/60 rounded-xl px-3 py-2 border border-border/50">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-40"
              />
            </div>

            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-muted/60 rounded-xl px-3 py-2 border border-border/50">
              <span className="hidden sm:inline">AY 2025-26</span>
            </div>

            <Link href="/chat" className="p-2 rounded-xl hover:bg-indigo-50 text-indigo-600 transition-colors" title="Ask AI Tax Expert">
              <Sparkles className="h-5 w-5 text-amber-500" />
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 relative">
          <div className="absolute inset-0 dot-pattern opacity-30 pointer-events-none -z-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent pointer-events-none -z-10" />

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
