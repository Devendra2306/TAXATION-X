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

const recentActivity = [
  { title: 'Form 16 Uploaded', desc: 'Auto-parsed successfully', time: '2h ago', icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50 ring-emerald-200' },
  { title: 'Tax Regime Analyzed', desc: 'New regime is better', time: '5h ago', icon: Scale, color: 'text-primary', bg: 'bg-primary/10 ring-primary/20' },
  { title: 'Profile Updated', desc: 'Added HRA details', time: '1d ago', icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50 ring-blue-200' },
];

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
              <span className="text-xs font-semibold uppercase tracking-wider text-white/80">Welcome back, John</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Your tax filing is 50% complete</h2>
            <p className="text-white/80 text-sm max-w-md">Upload your Form 16 and let our AI handle the rest. You could save up to ₹1,45,000 this year.</p>
          </div>
          <Link href="/upload" className="inline-flex items-center gap-2 bg-white text-primary font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all shrink-0">
            Continue Filing <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Total Income" value="₹24,50,000" icon={Wallet} trend="+12%" trendUp accent="primary" index={0} />
        <StatCard title="Tax Liability (Est)" value="₹4,12,000" icon={PieChart} trend="-5%" trendUp={false} accent="rose" index={1} />
        <StatCard title="Potential Savings" value="₹1,45,000" icon={TrendingUp} trend="+24%" trendUp accent="emerald" index={2} />
        <StatCard title="Missing Deductions" value="3 Found" icon={AlertCircle} trend="Action Needed" isAlert accent="amber" index={3} />
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
          <button className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">View all</button>
        </div>
        <div className="card-elevated divide-y divide-border overflow-hidden">
          {recentActivity.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="flex items-center gap-4 p-4 hover:bg-muted/40 transition-colors"
            >
              <div className={`p-2.5 rounded-xl ring-1 ${item.bg}`}>
                <item.icon className={`h-4 w-4 ${item.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-foreground">{item.title}</h4>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                <Clock className="h-3 w-3" />
                {item.time}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
