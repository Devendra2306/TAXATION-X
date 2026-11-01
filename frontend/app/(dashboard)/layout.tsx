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
  CheckCircle2,
  ChevronRight,
  User,
  Award,
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
  const [userPan, setUserPan] = useState('');
  const [filingDropdownOpen, setFilingDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    // Check local storage for verified PAN
    if (typeof window !== 'undefined') {
      const storedPan = localStorage.getItem('verified_pan');
      if (storedPan) setUserPan(storedPan);
    }

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
          if (data.pan) setUserPan(data.pan);
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
        <header className="h-16 sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-muted text-muted-foreground"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Filing For Switcher Dropdown (ClearTax style) */}
            <div className="relative">
              <button
                onClick={() => {
                  setFilingDropdownOpen(!filingDropdownOpen);
                  setUserMenuOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left group"
              >
                <span className="text-xs font-medium text-slate-500">Filing for:</span>
                <span className="text-sm font-bold text-slate-800 max-w-[140px] sm:max-w-[200px] truncate">
                  {userName !== 'Loading...' ? userName : 'New User'}
                </span>
                <ChevronDown className={cn("h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-transform", filingDropdownOpen ? "rotate-180" : "")} />
              </button>

              <AnimatePresence>
                {filingDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setFilingDropdownOpen(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 p-2 overflow-hidden"
                    >
                      {/* Active profile */}
                      <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-start justify-between">
                        <div>
                          <div className="text-sm font-bold text-indigo-950 flex items-center gap-1.5">
                            {userName}
                            <span className="text-[10px] font-semibold bg-indigo-200/80 text-indigo-800 px-1.5 py-0.5 rounded">Active</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            PAN: <span className="font-mono font-medium text-slate-700">{userPan || 'Not Available'}</span>
                          </div>
                          <div className="text-[11px] text-indigo-600 font-medium mt-1">
                            Assessment Year: 2025 - 2026
                          </div>
                        </div>
                        <div className="h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </div>
                      </div>

                      <div className="mt-2 space-y-1">
                        <Link
                          href="/verify-pan"
                          onClick={() => setFilingDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-xs font-semibold text-indigo-600 transition-colors"
                        >
                          <span className="text-base leading-none">+</span> File for another person / family member
                        </Link>
                        <Link
                          href="/export"
                          onClick={() => setFilingDropdownOpen(false)}
                          className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors"
                        >
                          <span>View All Returns & Acknowledgements</span>
                          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                        </Link>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* AI Tax Assistant Pill / Button */}
            <Link 
              href="/chat" 
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/70 hover:border-indigo-300 text-indigo-700 transition-all text-xs font-semibold shadow-xs hover:shadow-sm"
              title="Ask AI Tax Assistant"
            >
              <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="hidden sm:inline">Ask AI Tax Assistant</span>
            </Link>

            {/* User Profile Avatar with dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setUserMenuOpen(!userMenuOpen);
                  setFilingDropdownOpen(false);
                }}
                className="h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300/80 flex items-center justify-center text-xs font-bold text-slate-700 transition-colors shadow-xs"
              >
                {userInitials}
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setUserMenuOpen(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden divide-y divide-slate-100 text-sm"
                    >
                      {/* 1. My Tax Returns */}
                      <Link
                        href="/export"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-6 py-3.5 text-slate-800 hover:bg-slate-50 transition-colors font-medium text-[13px] sm:text-sm"
                      >
                        My Tax Returns
                      </Link>

                      {/* 2. Profile */}
                      <Link
                        href="/verify-pan"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-6 py-3.5 text-slate-800 hover:bg-slate-50 transition-colors font-medium text-[13px] sm:text-sm"
                      >
                        Profile
                      </Link>

                      {/* 3. My Orders */}
                      <Link
                        href="/select-plan"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-6 py-3.5 text-slate-800 hover:bg-slate-50 transition-colors font-medium text-[13px] sm:text-sm"
                      >
                        My Orders
                      </Link>

                      {/* 4. My Rewards */}
                      <Link
                        href="/select-plan"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-6 py-3.5 text-slate-800 hover:bg-slate-50 transition-colors font-medium text-[13px] sm:text-sm"
                      >
                        My Rewards
                      </Link>

                      {/* 5. Advanced Options */}
                      <div className="block px-6 py-3 text-slate-800 font-semibold text-[13px] sm:text-sm bg-slate-50/50">
                        Advanced Options
                      </div>

                      {/* 6. Prepare Rectification JSON U/S 139(9) */}
                      <Link
                        href="/export"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-6 py-3.5 text-slate-800 hover:bg-slate-50 transition-colors font-medium text-[13px] sm:text-sm"
                      >
                        Prepare Rectification JSON U/S 139(9)
                      </Link>

                      {/* 7. Import Prefill JSON */}
                      <Link
                        href="/upload"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-6 py-3.5 text-slate-800 hover:bg-slate-50 transition-colors font-medium text-[13px] sm:text-sm"
                      >
                        Import Prefill JSON
                      </Link>

                      {/* 8. Check ITR Status */}
                      <Link
                        href="/refund"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-6 py-3.5 text-slate-800 hover:bg-slate-50 transition-colors font-medium text-[13px] sm:text-sm"
                      >
                        Check ITR Status
                      </Link>

                      {/* 9. Tax filing from experts */}
                      <Link
                        href="/review"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-6 py-3.5 text-slate-800 hover:bg-slate-50 transition-colors font-medium text-[13px] sm:text-sm"
                      >
                        Tax filing from experts
                      </Link>

                      {/* 10. Need Help? */}
                      <Link
                        href="/chat"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-6 py-3.5 text-slate-800 hover:bg-slate-50 transition-colors font-medium text-[13px] sm:text-sm"
                      >
                        Need Help?
                      </Link>

                      {/* 11. Logout */}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-6 py-3.5 text-slate-800 hover:bg-rose-50 hover:text-rose-600 transition-colors font-medium text-[13px] sm:text-sm"
                      >
                        Logout
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
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
