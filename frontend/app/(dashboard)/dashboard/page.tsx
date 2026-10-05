'use client';

import React, { useState } from 'react';
import {
  ArrowRight,
  Upload,
  Lightbulb,
  FileText,
  Scale,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Activity,
  HelpCircle
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FilingProgress } from '@/components/ui/FilingProgress';

const quickActions = [
  {
    href: '/upload',
    icon: Upload,
    title: 'Upload Documents',
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

export default function DashboardPage() {
  const [surveyStep, setSurveyStep] = useState(0);
  const [answers, setAnswers] = useState({
    salary: false,
    stocks: false,
    business: false,
    above50L: false
  });
  const [resultItr, setResultItr] = useState<string | null>(null);

  const handleAnswer = (key: string, value: boolean) => {
    const newAnswers = { ...answers, [key]: value };
    setAnswers(newAnswers);
    
    if (surveyStep < 3) {
      setSurveyStep(surveyStep + 1);
    } else {
      if (newAnswers.business) {
        setResultItr('ITR-4 (Sugam)');
      } else if (newAnswers.stocks || newAnswers.above50L) {
        setResultItr('ITR-2');
      } else {
        setResultItr('ITR-1 (Sahaj)');
      }
      setSurveyStep(4);
    }
  };

  const resetSurvey = () => {
    setSurveyStep(0);
    setResultItr(null);
    setAnswers({ salary: false, stocks: false, business: false, above50L: false });
  };

  const surveyQuestions = [
    { key: 'salary', text: 'Do you have income from a Salary or Pension?' },
    { key: 'stocks', text: 'Did you sell any Stocks, Mutual Funds, or Crypto this year?' },
    { key: 'business', text: 'Do you run a Business or work as a Freelancer/Consultant?' },
    { key: 'above50L', text: 'Is your total income for the financial year above ₹50 Lakhs?' },
  ];

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
            <p className="text-white/80 text-sm max-w-md">Our AI handles everything from finding deductions to filling out your forms. Let's get started!</p>
          </div>
          <Link href="/upload" className="inline-flex items-center gap-2 bg-white text-primary font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all shrink-0">
            Start Filing <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.div>

      {/* Interactive Survey */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="border-b border-border p-5 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-foreground">Find Your ITR Form</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Answer 4 quick questions to know exactly which form you need to file.</p>
        </div>
        
        <div className="p-6 md:p-8">
          <AnimatePresence mode="wait">
            {surveyStep < 4 ? (
              <motion.div
                key={surveyStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="max-w-xl mx-auto text-center"
              >
                <div className="text-sm font-semibold text-indigo-600 mb-4">Question {surveyStep + 1} of 4</div>
                <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-8">{surveyQuestions[surveyStep].text}</h3>
                
                <div className="flex items-center justify-center gap-4">
                  <button 
                    onClick={() => handleAnswer(surveyQuestions[surveyStep].key, true)}
                    className="flex-1 max-w-xs py-3 px-6 rounded-xl border-2 border-indigo-100 hover:border-indigo-600 hover:bg-indigo-50 text-indigo-900 font-semibold transition-all"
                  >
                    Yes
                  </button>
                  <button 
                    onClick={() => handleAnswer(surveyQuestions[surveyStep].key, false)}
                    className="flex-1 max-w-xs py-3 px-6 rounded-xl border-2 border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-slate-700 font-semibold transition-all"
                  >
                    No
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-xl mx-auto text-center"
              >
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">You should file {resultItr}</h3>
                <p className="text-slate-600 mb-8">
                  Based on your income sources, {resultItr} is the correct form for you. Don't worry, our system will automatically select this for you when you upload your documents.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/upload" className="btn-primary w-full sm:w-auto px-8">
                    Upload Documents Now
                  </Link>
                  <button onClick={resetSurvey} className="text-slate-500 hover:text-slate-700 font-medium text-sm">
                    Retake Survey
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
    </div>
  );
}
