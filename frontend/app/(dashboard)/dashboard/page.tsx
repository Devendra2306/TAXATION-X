'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Play,
  FileText,
  User,
  Lock,
  Award,
  HelpCircle,
  X,
  Phone,
  Calendar,
  Clock,
  Layers,
  TrendingUp,
  Percent,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardPage() {
  const router = useRouter();

  // User state
  const [userName, setUserName] = useState('Taxpayer');
  const [userEmail, setUserEmail] = useState('');
  const [pan, setPan] = useState<string | null>(null);
  const [hasForm16, setHasForm16] = useState(false);

  // Modals state
  const [stepsModalOpen, setStepsModalOpen] = useState(false);
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [expertModalOpen, setExpertModalOpen] = useState(false);
  const [expertBooked, setExpertBooked] = useState(false);
  const [expertForm, setExpertForm] = useState({ phone: '', slot: 'Morning (10 AM - 1 PM)' });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedPan = localStorage.getItem('verified_pan');
      if (storedPan) setPan(storedPan);

      const parsedTax = localStorage.getItem('parsedTaxData');
      if (parsedTax) setHasForm16(true);

      const storedName = localStorage.getItem('verified_name');
      if (storedName) setUserName(storedName);

      // Fetch user profile from API
      const token = localStorage.getItem('access_token');
      if (token) {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data) {
              const name = data.full_name || data.email?.split('@')[0] || 'Taxpayer';
              setUserName(name);
              setUserEmail(data.email || '');
              if (data.pan) setPan(data.pan);
            }
          })
          .catch(() => {});
      }
    }
  }, []);

  // Determine current filing step
  const step1Complete = Boolean(pan);
  const step2Complete = hasForm16;
  const currentCtaHref = !step1Complete
    ? '/verify-pan'
    : !step2Complete
    ? '/upload'
    : '/review';

  const ctaButtonText = !step1Complete
    ? 'Start Filing'
    : !step2Complete
    ? 'Upload Form 16 / Data'
    : 'Review & Complete Filing';

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* ============================================================ */}
      {/* 1. MAIN HERO FILING CARD + RIGHT ACTION CARDS                */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left 8 Columns: Main Filing Status Card */}
        <div className="lg:col-span-8 flex flex-col justify-between bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 relative overflow-hidden">
          {/* Subtle decorative background watermark */}
          <div className="absolute -right-12 -bottom-16 w-64 h-64 bg-gradient-to-br from-indigo-50/80 via-blue-50/40 to-transparent rounded-full pointer-events-none -z-0 flex items-center justify-center">
            <Percent className="w-40 h-40 text-indigo-100/40 transform -rotate-12" />
          </div>

          <div className="relative z-10 space-y-6">
            {/* Filing Status Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Filing Status: Assessment Year 2025 - 2026 (current)</span>
            </div>

            {/* Greeting & Headline */}
            <div>
              <p className="text-slate-500 text-sm font-medium">Hello {userName},</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                You can finish filing in just 10 mins!
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Don't wait until the rush! Auto-fetch your Form 16, AIS, and 26AS seamlessly.
              </p>
            </div>

            {/* 3-Step Process Timeline */}
            <div className="pt-2">
              <div className="grid grid-cols-3 gap-2 relative">
                {/* Connecting background line */}
                <div className="absolute top-4 left-[16%] right-[16%] h-0.5 bg-slate-200 -z-0" />

                {/* Step 1 */}
                <div className="flex flex-col items-center text-center relative z-10">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                      step1Complete
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-50'
                        : 'bg-white border-2 border-indigo-600 text-indigo-600'
                    }`}
                  >
                    {step1Complete ? <Check className="w-4 h-4" /> : '1'}
                  </div>
                  <span className="text-xs font-semibold text-slate-800 mt-2">
                    Link PAN & Pre-fill
                  </span>
                  <span className="text-[11px] text-slate-400 hidden sm:block">
                    {step1Complete ? 'Verified' : 'Auto-fetch AIS'}
                  </span>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col items-center text-center relative z-10">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                      step2Complete
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-50'
                        : step1Complete
                        ? 'bg-white border-2 border-indigo-600 text-indigo-600'
                        : 'bg-white border-2 border-slate-300 text-slate-400'
                    }`}
                  >
                    {step2Complete ? <Check className="w-4 h-4" /> : '2'}
                  </div>
                  <span className="text-xs font-semibold text-slate-800 mt-2">
                    Add your Details
                  </span>
                  <span className="text-[11px] text-slate-400 hidden sm:block">
                    Form 16 & Deductions
                  </span>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col items-center text-center relative z-10">
                  <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-300 text-slate-400 flex items-center justify-center text-xs font-bold shadow-xs">
                    3
                  </div>
                  <span className="text-xs font-semibold text-slate-800 mt-2">
                    File ITR & e-Verify
                  </span>
                  <span className="text-[11px] text-slate-400 hidden sm:block">
                    Instant Acknowledgement
                  </span>
                </div>
              </div>

              {/* Know more link */}
              <div className="mt-4 text-center sm:text-left">
                <button
                  onClick={() => setStepsModalOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Know more about steps <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Primary CTA Button */}
          <div className="relative z-10 pt-6 mt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link
              href={currentCtaHref}
              className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-600/20 hover:shadow-lg transition-all text-center flex items-center justify-center gap-2 group"
            >
              <span>{ctaButtonText}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <span className="text-xs text-slate-400">
              Tax regime compared automatically (Old vs New)
            </span>
          </div>
        </div>

        {/* Right 4 Columns: Side Cards (Expert Assist & Guide) */}
        <div className="lg:col-span-4 flex flex-col gap-6 justify-between">
          {/* Card 1: Expert CA Assistance */}
          <div className="bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/40 rounded-3xl border border-indigo-100 p-6 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/25 shrink-0">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-100/70 px-2 py-0.5 rounded-full">
                    CA Assisted
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">Need an expert to file?</h3>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Let a dedicated Chartered Accountant review capital gains, foreign assets, and deductions — you relax.
              </p>
            </div>

            <div className="pt-4 mt-2">
              <button
                onClick={() => setExpertModalOpen(true)}
                className="w-full py-2.5 px-4 bg-white hover:bg-indigo-50/80 text-indigo-600 border border-indigo-200 rounded-xl font-bold text-xs transition-colors shadow-2xs text-center"
              >
                Book CA Expert
              </button>
            </div>
          </div>

          {/* Card 2: Interactive Video / Step Guide */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 flex flex-col justify-between shadow-xs">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0">
                <Play className="w-5 h-5 fill-white ml-0.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Step by step guide for ITR filing
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Watch our 2-min interactive walkthrough for beginners.
                </p>
              </div>
            </div>

            <div className="pt-4 mt-1 border-t border-slate-100">
              <button
                onClick={() => setGuideModalOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                View Guide <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. TRUST & COMPLIANCE STRIP (Below Hero)                     */}
      {/* ============================================================ */}
      <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <Lock className="w-4 h-4 text-slate-500" />
            <span>SSL 256-Bit Encrypted</span>
          </div>
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <Award className="w-4 h-4 text-slate-500" />
            <span>ISO 27001 Data Security</span>
          </div>
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Govt. Authorized ERI Partner</span>
          </div>
        </div>

        <div className="text-slate-500 text-[11px]">
          Your tax data is strictly confidential and protected with bank-grade encryption.
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. BOTTOM CARDS (My Returns, My Profile, Free Plan Promo)    */}
      {/* ============================================================ */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card: My Tax Returns */}
          <Link
            href="/export"
            className="group block bg-white rounded-3xl border border-slate-200/90 p-6 hover:border-indigo-300 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    My Tax Returns
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    A comprehensive record of your past ITR filings, acknowledgements, and e-verification receipts.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
            </div>
          </Link>

          {/* Card: My Profile */}
          <Link
            href="/verify-pan"
            className="group block bg-white rounded-3xl border border-slate-200/90 p-6 hover:border-indigo-300 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    My Profile
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    Personal contact details, verified PAN ({pan || 'Not Linked'}), bank account for tax refund, and settings.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
            </div>
          </Link>
        </div>

        {/* Wide Card: Start for free, pay only when you file */}
        <div className="bg-gradient-to-r from-indigo-50/90 via-white to-blue-50/70 rounded-3xl border border-indigo-100 p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Start for free, pay only when you file
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                Automated plan selection, AI tax regime optimizer (Old vs New), post-filing ITD notice assistance, and maximum refund guarantee!
              </p>
            </div>
          </div>

          <Link
            href="/select-plan"
            className="shrink-0 px-6 py-2.5 bg-white hover:bg-slate-50 text-indigo-600 border border-indigo-200 rounded-xl font-bold text-xs transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <span>View Plans</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. LEGAL DISCLAIMER & FOOTER CREDITS                         */}
      {/* ============================================================ */}
      <div className="pt-8 border-t border-slate-200 text-[11px] text-slate-400 leading-relaxed space-y-3">
        <p>
          NexTax (OFS Taxation) is an authorized electronic tax preparation platform integrated with official Government e-Return Intermediary (ERI) infrastructure. E-filing services and data synchronization with the Income Tax Department are executed via certified Sandbox.co.in protocols adhering to the Electronic Furnishing of Returns Scheme.
        </p>
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-4 text-slate-500">
            <Link href="/trust" className="hover:text-slate-800 transition-colors">Terms of Use</Link>
            <span>•</span>
            <Link href="/trust" className="hover:text-slate-800 transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link href="/trust" className="hover:text-slate-800 transition-colors">Security Standards</Link>
          </div>
          <div className="text-slate-400">
            ISO 27001 Certified • SSL 256-bit Encryption
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. INTERACTIVE MODALS                                        */}
      {/* ============================================================ */}

      {/* Modal A: Know More About Steps */}
      <AnimatePresence>
        {stepsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative"
            >
              <button
                onClick={() => setStepsModalOpen(false)}
                className="absolute right-5 top-5 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold text-slate-900 mb-2">How ITR Filing Works in 3 Steps</h3>
              <p className="text-xs text-slate-500 mb-6">
                Our automated platform takes care of the math, compliance, and government e-filing for you.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Link PAN & Pre-fill</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Enter your PAN to instantly link your tax account and download your pre-filled salary & TDS data from the ITD.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Add Details & Optimize</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Upload your Form 16 PDF in 1 click. Our engine calculates your 80C deductions, HRA, and recommends the best tax regime (Old vs New).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">File ITR & e-Verify</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Review your calculation summary, submit directly to the Income Tax Department, and receive your official ITR-V acknowledgement.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                <Link
                  href={currentCtaHref}
                  onClick={() => setStepsModalOpen(false)}
                  className="px-6 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  Start Filing Now
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal B: Step-by-Step Guide */}
      <AnimatePresence>
        {guideModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative"
            >
              <button
                onClick={() => setGuideModalOpen(false)}
                className="absolute right-5 top-5 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center">
                  <Play className="w-5 h-5 fill-white ml-0.5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">ITR Filing Quick Guide</h3>
                  <p className="text-xs text-slate-500">2-minute interactive overview</p>
                </div>
              </div>

              <div className="space-y-3 my-6">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="font-bold text-slate-800">📄 What documents do I need?</span>
                  <p className="text-slate-600 mt-1">
                    Only your PAN card and Form 16 PDF from your employer. If you had bank interest or capital gains, our system fetches them automatically.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="font-bold text-slate-800">⚖️ Old vs New Tax Regime?</span>
                  <p className="text-slate-600 mt-1">
                    You don't need to choose manually. NexTax runs your numbers simultaneously on both regimes and recommends the one that gives you maximum savings or higher refund.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="font-bold text-slate-800">🔒 Is my data safe?</span>
                  <p className="text-slate-600 mt-1">
                    Yes, all files are encrypted with 256-bit SSL and processed in compliance with ISO 27001 data center privacy standards.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setGuideModalOpen(false);
                  router.push(currentCtaHref);
                }}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-colors"
              >
                Got it, take me to filing!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal C: Book CA Expert */}
      <AnimatePresence>
        {expertModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative"
            >
              <button
                onClick={() => {
                  setExpertModalOpen(false);
                  setExpertBooked(false);
                }}
                className="absolute right-5 top-5 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {!expertBooked ? (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Book Dedicated CA Consultation</h3>
                      <p className="text-xs text-slate-500">Chartered Accountant Tax Review</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                    A certified tax professional will review your documents, calculate capital gains, and maximize your tax deductions.
                  </p>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setExpertBooked(true);
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                        Your Mobile Number
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={expertForm.phone}
                          onChange={(e) => setExpertForm({ ...expertForm, phone: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-600 outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                        Preferred Call Slot
                      </label>
                      <select
                        value={expertForm.slot}
                        onChange={(e) => setExpertForm({ ...expertForm, slot: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-600 outline-none bg-white"
                      >
                        <option>Morning (10:00 AM - 1:00 PM)</option>
                        <option>Afternoon (1:00 PM - 5:00 PM)</option>
                        <option>Evening (5:00 PM - 8:00 PM)</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-colors mt-2"
                    >
                      Confirm CA Callback Request
                    </button>
                  </form>
                </div>
              ) : (
                <div className="text-center py-4 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">CA Consultation Requested!</h3>
                  <p className="text-xs text-slate-600">
                    Our tax expert will connect with you during your chosen slot (<strong>{expertForm.slot}</strong>) at <strong>{expertForm.phone || 'your registered number'}</strong>.
                  </p>
                  <button
                    onClick={() => {
                      setExpertModalOpen(false);
                      setExpertBooked(false);
                    }}
                    className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
