'use client';

import React from 'react';
import {
  TrendingUp,
  Wallet,
  PieChart,
  AlertCircle,
  ArrowRight,
  Upload,
  Lightbulb,
  FileText,
  Scale,
  Sparkles,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { StatCard } from '@/components/ui/StatCard';
import { FilingProgress } from '@/components/ui/FilingProgress';

const quickActions = [
  {
    href: '/upload',
    icon: Upload,
    title: 'Upload Form 16',
    desc: 'Auto-extract data using our AI engine to start your filing process.',
    gradient: 'from-primary/15 via-primary/5 to-transparent',
    iconBg: 'bg-primary/15',
    iconColor: 'text-primary',
    cta: 'Start Upload',
    ctaColor: 'text-primary',
    border: 'border-primary/20 hover:border-primary/40',
  },
  {
    href: '/optimizer',
    icon: Lightbulb,
    title: 'Tax Optimizer',
    desc: 'Discover new ways to save tax based on your profile.',
    gradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    cta: 'Explore',
    ctaColor: 'text-amber-600',
    border: 'border-amber-200/60 hover:border-amber-300',
  },
  {
    href: '/compare',
    icon: Scale,
    title: 'Compare Regimes',
    desc: 'See which tax regime saves you more money this year.',
    gradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    cta: 'Compare Now',
    ctaColor: 'text-emerald-600',
    border: 'border-emerald-200/60 hover:border-emerald-300',
  },
];

const recentActivity: any[] = [];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-[hsl(260,80%,58%)] to-secondary p-6 md:p-8 text-white shadow-xl shadow-primary/20"
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span className="text-xs font-semibold uppercase tracking-wider text-white/80">Welcome to NexTax</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Ready to start your tax filing?</h2>
            <p className="text-white/80 text-sm max-w-md">Upload your Form 16 and let our AI handle the rest. We will instantly analyze your data and find the best tax-saving opportunities.</p>
          </div>
          <Link href="/upload" className="inline-flex items-center gap-2 bg-white text-primary font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all shrink-0">
            Start Filing <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Total Income" value="---" icon={Wallet} trend="Pending Upload" trendUp={false} accent="primary" index={0} />
        <StatCard title="Tax Liability (Est)" value="---" icon={PieChart} trend="Pending Upload" trendUp={false} accent="rose" index={1} />
        <StatCard title="Potential Savings" value="---" icon={TrendingUp} trend="Pending Upload" trendUp={false} accent="emerald" index={2} />
        <StatCard title="Missing Deductions" value="---" icon={AlertCircle} trend="Pending Upload" isAlert={false} accent="amber" index={3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-5">
          <h2 className="text-lg font-bold text-foreground">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, idx) => (
              <motion.div
                key={action.href}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.08 }}
              >
                <Link href={action.href} className="group block h-full">
                  <div className={`h-full bg-gradient-to-br ${action.gradient} border ${action.border} rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col`}>
                    <div className={`h-11 w-11 rounded-xl ${action.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <action.icon className={`h-5 w-5 ${action.iconColor}`} />
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-1.5">{action.title}</h3>
                    <p className="text-xs text-muted-foreground flex-1 leading-relaxed">{action.desc}</p>
                    <div className={`mt-4 flex items-center text-xs font-semibold ${action.ctaColor}`}>
                      {action.cta} <ArrowRight className="ml-1.5 h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Filing Progress */}
        <div className="space-y-5">
          <FilingProgress />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Recent Activity</h2>
        </div>
        <div className="card-elevated p-8 text-center border-border overflow-hidden">
          <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <h4 className="font-semibold text-foreground mb-1">No Activity Yet</h4>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">Upload your Form 16 or chat with the AI expert to see your activity history here.</p>
        </div>
      </div>
    </div>
  );
}
