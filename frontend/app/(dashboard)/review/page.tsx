'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Edit2,
  ArrowRight,
  User,
  Briefcase,
  Receipt,
  FileText,
  Lock,
  Award,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Info,
  X,
  ChevronDown,
  ChevronRight,
  Building,
  Check,
  HelpCircle,
  MessageSquare,
  Headphones,
  Video,
  DollarSign,
  Download,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TaxSummaryReviewPage() {
  const router = useRouter();

  // User & Tax Profile State
  const [userName, setUserName] = useState('Taxpayer');
  const [profileData, setProfileData] = useState({
    gross_salary: 1250000,
    deductions_80c: 150000,
    tds_deducted: 95000,
    home_loan_interest: 0,
    capital_gains: 0,
    other_income: 448,
    employer_name: 'Employer Ltd.',
    pan: ''
  });

  const [selectedRegime, setSelectedRegime] = useState<'new' | 'old'>('new');
  const [itrType, setItrType] = useState('ITR 1');

  // Accordion toggle states
  const [accordionOpen, setAccordionOpen] = useState({
    personal: false,
    income: true,
    taxes: false
  });

  // Modals state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ ...profileData });
  const [isSaving, setIsSaving] = useState(false);
  const [expertModalOpen, setExpertModalOpen] = useState(false);
  const [liveCallModalOpen, setLiveCallModalOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [detailedModalOpen, setDetailedModalOpen] = useState(false);

  // Load profile from API and localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedPan = localStorage.getItem('verified_pan');
      const storedName = localStorage.getItem('verified_name');
      const parsedTaxStr = localStorage.getItem('parsedTaxData');

      if (storedName) setUserName(storedName);

      let initialData = { ...profileData };
      if (storedPan) initialData.pan = storedPan;

      if (parsedTaxStr) {
        try {
          const parsed = JSON.parse(parsedTaxStr);
          initialData = {
            ...initialData,
            gross_salary: Number(parsed.gross_salary || initialData.gross_salary),
            deductions_80c: Number(parsed.deductions_80c ?? initialData.deductions_80c),
            tds_deducted: Number(parsed.tds_deducted ?? initialData.tds_deducted),
            employer_name: parsed.employer_name || initialData.employer_name,
            pan: parsed.pan || initialData.pan
          };
        } catch {}
      }

      // Fetch from API
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (token) {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        fetch(`${API_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data) {
              const merged = {
                ...initialData,
                gross_salary: Number(data.gross_salary || initialData.gross_salary),
                deductions_80c: Number(data.deductions_80c ?? initialData.deductions_80c),
                tds_deducted: Number(data.tds_deducted ?? initialData.tds_deducted),
                home_loan_interest: Number(data.home_loan_interest || 0),
                capital_gains: Number(data.capital_gains || 0),
                other_income: Number(data.other_income || 448),
                employer_name: data.employer_name || initialData.employer_name,
                pan: data.pan || initialData.pan
              };
              setProfileData(merged);
              setEditForm(merged);

              // If capital gains exist, user needs ITR 2
              if (merged.capital_gains > 0) {
                setItrType('ITR 2');
              }
            }
          })
          .catch(() => {});
      } else {
        setProfileData(initialData);
        setEditForm(initialData);
      }
    }
  }, []);

  // Compute Taxes
  const gross = Number(profileData.gross_salary || 0) + Number(profileData.other_income || 0);
  const d80c = Math.min(Number(profileData.deductions_80c || 0), 150000);
  const homeLoan = Math.min(Number(profileData.home_loan_interest || 0), 200000);
  const tds = Number(profileData.tds_deducted || 0);

  // Old Regime Tax
  const stdDedOld = 50000;
  const totalDedOld = stdDedOld + d80c + homeLoan;
  const taxableOld = Math.max(0, gross - totalDedOld);
  let taxOld = 0;
  if (taxableOld <= 500000) {
    taxOld = 0;
  } else {
    let rem = taxableOld;
    if (rem > 1000000) {
      taxOld += (rem - 1000000) * 0.3;
      rem = 1000000;
    }
    if (rem > 500000) {
      taxOld += (rem - 500000) * 0.2;
      rem = 500000;
    }
    if (rem > 250000) {
      taxOld += (rem - 250000) * 0.05;
    }
    taxOld = taxOld * 1.04;
  }

  // New Regime Tax (AY 2025-26)
  const stdDedNew = 75000;
  const taxableNew = Math.max(0, gross - stdDedNew);
  let taxNew = 0;
  if (taxableNew <= 700000) {
    taxNew = 0;
  } else {
    let rem = taxableNew;
    if (rem > 1500000) {
      taxNew += (rem - 1500000) * 0.3;
      rem = 1500000;
    }
    if (rem > 1200000) {
      taxNew += (rem - 1200000) * 0.2;
      rem = 1200000;
    }
    if (rem > 1000000) {
      taxNew += (rem - 1000000) * 0.15;
      rem = 1000000;
    }
    if (rem > 700000) {
      taxNew += (rem - 700000) * 0.1;
      rem = 700000;
    }
    if (rem > 300000) {
      taxNew += (rem - 300000) * 0.05;
    }
    taxNew = taxNew * 1.04;
  }

  const activeTax = Math.round(selectedRegime === 'new' ? taxNew : taxOld);
  const activeTaxable = Math.round(selectedRegime === 'new' ? taxableNew : taxableOld);
  const activeSavings = Math.round(Math.abs(taxOld - taxNew));
  const refund = Math.round(tds - activeTax);

  const fmt = (num: number) => `₹ ${Number(num || 0).toLocaleString('en-IN')}`;

  // Save changes from Edit Modal
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const updated = {
      ...profileData,
      gross_salary: Number(editForm.gross_salary || 0),
      deductions_80c: Number(editForm.deductions_80c || 0),
      tds_deducted: Number(editForm.tds_deducted || 0),
      home_loan_interest: Number(editForm.home_loan_interest || 0),
      other_income: Number(editForm.other_income || 0),
      employer_name: editForm.employer_name || profileData.employer_name
    };

    setProfileData(updated);
    localStorage.setItem('parsedTaxData', JSON.stringify(updated));

    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    if (token) {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      await fetch(`${API_URL}/api/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updated)
      }).catch(() => {});
    }

    setIsSaving(false);
    setEditModalOpen(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 pt-2">
      {/* ============================================================ */}
      {/* 1. CELEBRATION HEADER & TOP SIDEBAR CARDS                    */}
      {/* ============================================================ */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        {/* Celebration Title */}
        <div className="flex items-start gap-3.5">
          <div className="text-3xl mt-0.5">🎉</div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Your ITR filing is almost done!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              We have auto-filled all your details and saved you time. Review the below summary and finish filing.
            </p>
          </div>
        </div>

        {/* Top-Right Support Box */}
        <div
          onClick={() => setSupportModalOpen(true)}
          className="self-start lg:self-auto bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl px-4 py-2.5 shadow-2xs flex items-center gap-3 cursor-pointer transition-all"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
              <span>Customer Support</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-[11px] text-slate-400">AI and Human Assistance</div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. "NEED TO ADD MORE DETAILS?" BLUE PROMPT BANNER            */}
      {/* ============================================================ */}
      <div className="bg-sky-50/80 border border-sky-100 rounded-2xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-slate-700">
          <div className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
            ?
          </div>
          <div>
            <span className="font-bold text-slate-800">Need to add more details? </span>
            <span className="text-slate-600">
              If you have capital gains, crypto or any other income not listed below, please click here to add.
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            setEditForm({ ...profileData });
            setEditModalOpen(true);
          }}
          className="self-start sm:self-auto font-bold text-sky-700 hover:text-sky-800 hover:underline shrink-0 text-xs"
        >
          Add Details &gt;
        </button>
      </div>

      {/* ============================================================ */}
      {/* 3. MAIN SUMMARY HERO BOX + RIGHT EXPERT CARDS                */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: Awesome Your Tax Summary is Prepared */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col justify-between">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-purple-50 via-indigo-50/50 to-blue-50/40 px-6 py-5 border-b border-indigo-100/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-indigo-950">
                Awesome, Your tax summary is prepared
              </h2>
              <div className="flex items-center gap-3 text-xs font-semibold text-indigo-700 mt-1">
                <span className="cursor-pointer hover:underline">Your ITR Type: {itrType} &gt;</span>
                <span>•</span>
                <span
                  onClick={() => setSelectedRegime(selectedRegime === 'new' ? 'old' : 'new')}
                  className="cursor-pointer hover:underline flex items-center gap-1"
                >
                  Your Tax Regime: {selectedRegime === 'new' ? 'New Regime' : 'Old Regime'} &gt;
                </span>
              </div>
            </div>

            <Link
              href="/export"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/20 transition-all text-center shrink-0"
            >
              Complete Filing Now
            </Link>
          </div>

          {/* Metric Rows */}
          <div className="p-6 sm:p-8 space-y-4">
            {/* Gross Income */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs sm:text-sm font-semibold text-slate-700">
                <span>Gross Income:</span>
                <span className="font-mono font-bold text-slate-900">{fmt(gross)}</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full" style={{ width: '85%' }} />
              </div>
            </div>

            {/* Tax Savings */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs sm:text-sm font-semibold text-slate-700">
                <span>Your Tax Savings:</span>
                <span className="font-mono font-bold text-emerald-600">{fmt(activeSavings)}</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '45%' }} />
              </div>
            </div>

            {/* Taxable Income */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs sm:text-sm font-semibold text-slate-700">
                <span>Taxable Income:</span>
                <span className="font-mono font-bold text-slate-900">{fmt(activeTaxable)}</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: '65%' }} />
              </div>
            </div>

            {/* Total Tax */}
            <div className="flex justify-between text-xs sm:text-sm font-semibold text-slate-700 pt-1">
              <span>Total Tax:</span>
              <span className="font-mono font-bold text-slate-900">{fmt(activeTax)}</span>
            </div>

            {/* Tax Already Paid */}
            <div className="flex justify-between text-xs sm:text-sm font-semibold text-slate-700">
              <span>Tax Already Paid:</span>
              <span className="font-mono font-bold text-slate-900">{fmt(tds)}</span>
            </div>

            {/* Tax Refund */}
            <div className="flex justify-between text-sm sm:text-base font-extrabold text-slate-900 pt-2 border-t border-slate-100">
              <span className={refund >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                {refund >= 0 ? 'Tax Refund:' : 'Tax Payable:'}
              </span>
              <span className={`font-mono text-lg ${refund >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {fmt(Math.abs(refund))}
              </span>
            </div>

            {/* View Detailed Calculation link */}
            <div className="pt-2 text-center">
              <button
                onClick={() => setDetailedModalOpen(true)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline inline-flex items-center gap-1"
              >
                View Detailed Calculation &gt;
              </button>
            </div>
          </div>

          {/* Bottom Query Strip */}
          <div className="bg-slate-50 border-t border-slate-100 px-6 py-3.5 flex items-center justify-between text-xs">
            <span className="text-slate-600 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              Have any doubts regarding tax calculation?
            </span>
            <Link href="/chat" className="font-bold text-indigo-600 hover:underline">
              Ask here &gt;
            </Link>
          </div>
        </div>

        {/* Right 4 Cols: Expert Filing & Live Guidance Cards */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card 1: Expert Filing */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600">
              <Award className="w-4 h-4" />
              <span>Expert Filing</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Need an expert to file?</h3>
              <p className="text-xs text-slate-500 mt-0.5">Let an expert handle it — you relax.</p>
            </div>
            <button
              onClick={() => setExpertModalOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl border border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-700 text-xs font-bold transition-colors shadow-2xs"
            >
              Hire an Expert
            </button>
          </div>

          {/* Card 2: Live Guidance */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-600">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>Live Filing</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Stuck? Get Live Guidance</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                File your own taxes with a Filing Specialist guiding you end-to-end.
              </p>
            </div>
            <button
              onClick={() => setLiveCallModalOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-colors shadow-2xs"
            >
              Book your live filing call
            </button>
          </div>

          {/* Big CTA on right column */}
          <Link
            href="/export"
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 text-center"
          >
            <span>Complete Filing Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. TWO PILL CARDS: ITR TYPE & TAX REGIME                     */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* ITR Type Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 flex items-start gap-4 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Your ITR Type:</span>
              <span className="text-xs font-bold bg-blue-600 text-white px-2 py-0.5 rounded-md">
                {itrType}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" /> Income from Salary or Interest
            </p>
            <button
              onClick={() => setDetailedModalOpen(true)}
              className="text-xs font-semibold text-blue-600 hover:underline mt-2 inline-block"
            >
              View More Details &gt;
            </button>
          </div>
        </div>

        {/* Tax Regime Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 flex items-start gap-4 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Your Tax Regime:</span>
              <span className="text-xs font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-md">
                {selectedRegime === 'new' ? 'New Regime' : 'Old Regime'}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              You have selected {selectedRegime === 'new' ? 'New Regime (Lower Slabs)' : 'Old Regime (With 80C Deductions)'}
            </p>
            <button
              onClick={() => setSelectedRegime(selectedRegime === 'new' ? 'old' : 'new')}
              className="text-xs font-semibold text-emerald-700 hover:underline mt-2 inline-block"
            >
              Compare Regime &gt;
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. "YOUR TAX CALCULATION DETAILS" ACCORDION SECTION          */}
      {/* ============================================================ */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Your Tax Calculation Details</h2>
            <p className="text-xs text-slate-500 mt-0.5">Please review carefully, update them if needed.</p>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-indigo-600">
            <button
              onClick={() => {
                setEditForm({ ...profileData });
                setEditModalOpen(true);
              }}
              className="hover:underline"
            >
              Add/Edit Details
            </button>
            <span>•</span>
            <button onClick={() => setDetailedModalOpen(true)} className="hover:underline">
              View Detailed Report
            </button>
          </div>
        </div>

        {/* Collapsible Accordion 1: Personal Details */}
        <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
          <div
            onClick={() => setAccordionOpen({ ...accordionOpen, personal: !accordionOpen.personal })}
            className="p-4 bg-slate-50/70 hover:bg-slate-100/70 transition-colors flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                <User className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-slate-900">Personal Details</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditForm({ ...profileData });
                  setEditModalOpen(true);
                }}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                Add/Edit Details
              </button>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${
                  accordionOpen.personal ? 'rotate-180' : ''
                }`}
              />
            </div>
          </div>

          <AnimatePresence>
            {accordionOpen.personal && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="p-4 border-t border-slate-100 bg-white space-y-3 text-xs"
              >
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Taxpayer Name</span>
                  <span className="font-bold text-slate-800">{userName}</span>
                </div>
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Permanent Account Number (PAN)</span>
                  <span className="font-mono font-bold text-slate-800">
                    {profileData.pan || 'Not Linked'}
                  </span>
                </div>
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Primary Bank Account (For Refund)</span>
                  <span className="font-mono text-emerald-700 font-semibold">
                    •••• 4821 (Verified via Penny Drop)
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Collapsible Accordion 2: Income Details */}
        <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
          <div
            onClick={() => setAccordionOpen({ ...accordionOpen, income: !accordionOpen.income })}
            className="p-4 bg-slate-50/70 hover:bg-slate-100/70 transition-colors flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Briefcase className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-slate-900">Income Details</span>
            </div>

            <div className="flex items-center gap-4">
              <span className="font-mono font-bold text-slate-800 text-xs sm:text-sm">
                {fmt(gross)}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditForm({ ...profileData });
                  setEditModalOpen(true);
                }}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                Add/Edit Details
              </button>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${
                  accordionOpen.income ? 'rotate-180' : ''
                }`}
              />
            </div>
          </div>

          <AnimatePresence>
            {accordionOpen.income && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="p-4 border-t border-slate-100 bg-white space-y-3 text-xs"
              >
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Salary Income ({profileData.employer_name})</span>
                  <span className="font-mono font-bold text-slate-800">
                    {fmt(profileData.gross_salary)}
                  </span>
                </div>
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Interest Income (Savings / Fixed Deposits)</span>
                  <span className="font-mono font-medium text-slate-800">
                    {fmt(profileData.other_income)}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Collapsible Accordion 3: Taxes Paid & Tax Savings */}
        <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
          <div
            onClick={() => setAccordionOpen({ ...accordionOpen, taxes: !accordionOpen.taxes })}
            className="p-4 bg-slate-50/70 hover:bg-slate-100/70 transition-colors flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Receipt className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-slate-900">Taxes Paid & Tax Savings</span>
            </div>

            <div className="flex items-center gap-4">
              <span className="font-mono font-bold text-slate-800 text-xs sm:text-sm">
                {fmt(tds)}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditForm({ ...profileData });
                  setEditModalOpen(true);
                }}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                Add/Edit Details
              </button>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${
                  accordionOpen.taxes ? 'rotate-180' : ''
                }`}
              />
            </div>
          </div>

          <AnimatePresence>
            {accordionOpen.taxes && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="p-4 border-t border-slate-100 bg-white space-y-3 text-xs"
              >
                <div className="flex justify-between py-1 text-slate-600">
                  <span>TDS Deducted as per Form 16 / 26AS</span>
                  <span className="font-mono font-bold text-slate-800">{fmt(tds)}</span>
                </div>
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Section 80C Deductions Claimed</span>
                  <span className="font-mono font-medium text-slate-800">
                    {fmt(profileData.deductions_80c)}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Report Links */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-indigo-600">
          <button onClick={() => setDetailedModalOpen(true)} className="hover:underline">
            View Tax Computation Details
          </button>
          <button onClick={() => setDetailedModalOpen(true)} className="hover:underline">
            View Detailed Calculation
          </button>
          <button onClick={() => window.print()} className="hover:underline flex items-center gap-1">
            <Download className="w-3.5 h-3.5" /> View/Download Report
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 6. FOOTER COMPLIANCE & LEGAL DISCLAIMER                      */}
      {/* ============================================================ */}
      <div className="pt-6 border-t border-slate-200 text-[11px] text-slate-400 leading-relaxed space-y-3">
        <p>
          NexTax (OFS Taxation) is an authorized electronic tax preparation platform integrated with official Government e-Return Intermediary (ERI) infrastructure. E-filing services and data synchronization with the Income Tax Department are executed via certified Sandbox.co.in protocols adhering to the Electronic Furnishing of Returns Scheme.
        </p>
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-4 text-slate-500">
            <Link href="/trust" className="hover:text-slate-800 transition-colors">Terms of Use</Link>
            <span>•</span>
            <Link href="/trust" className="hover:text-slate-800 transition-colors">Privacy Policy</Link>
          </div>
          <div className="text-slate-400">
            ISO 27001 Certified • SSL Certified Site 256-bit encryption
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 7. MODALS (Edit, Expert, Live Call, Detailed Report)          */}
      {/* ============================================================ */}

      {/* Edit Details Modal */}
      <AnimatePresence>
        {editModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setEditModalOpen(false)}
                className="absolute right-5 top-5 p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold text-slate-900 mb-1">Add / Edit Tax Details</h3>
              <p className="text-xs text-slate-500 mb-6">
                Update your numbers manually if your pre-fill missed any components.
              </p>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Employer Name
                  </label>
                  <input
                    type="text"
                    value={editForm.employer_name}
                    onChange={(e) => setEditForm({ ...editForm, employer_name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Gross Annual Salary (₹)
                  </label>
                  <input
                    type="number"
                    value={editForm.gross_salary}
                    onChange={(e) => setEditForm({ ...editForm, gross_salary: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Interest Income (₹)
                  </label>
                  <input
                    type="number"
                    value={editForm.other_income}
                    onChange={(e) => setEditForm({ ...editForm, other_income: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Section 80C Deductions (Max ₹1,50,000)
                  </label>
                  <input
                    type="number"
                    max={150000}
                    value={editForm.deductions_80c}
                    onChange={(e) => setEditForm({ ...editForm, deductions_80c: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Total TDS Deducted (₹)
                  </label>
                  <input
                    type="number"
                    value={editForm.tds_deducted}
                    onChange={(e) => setEditForm({ ...editForm, tds_deducted: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/20 transition-all text-center"
                  >
                    {isSaving ? 'Recalculating...' : 'Save & Update Summary'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detailed Calculation Modal */}
      <AnimatePresence>
        {detailedModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[85vh] overflow-y-auto"
            >
              <button
                onClick={() => setDetailedModalOpen(false)}
                className="absolute right-5 top-5 p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold text-slate-900 mb-1">Detailed Tax Calculation</h3>
              <p className="text-xs text-slate-500 mb-6">AY 2025-26 Computation Statement</p>

              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>1. Gross Total Income</span>
                    <span className="font-mono">{fmt(gross)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>- Salary Income</span>
                    <span className="font-mono">{fmt(profileData.gross_salary)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>- Interest Income</span>
                    <span className="font-mono">{fmt(profileData.other_income)}</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>2. Deductions Claimed</span>
                    <span className="font-mono text-emerald-600">
                      - {fmt(selectedRegime === 'new' ? stdDedNew : totalDedOld)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>- Standard Deduction</span>
                    <span className="font-mono">
                      {fmt(selectedRegime === 'new' ? stdDedNew : stdDedOld)}
                    </span>
                  </div>
                  {selectedRegime === 'old' && (
                    <div className="flex justify-between text-slate-500">
                      <span>- Section 80C Deductions</span>
                      <span className="font-mono">{fmt(d80c)}</span>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-indigo-50/80 rounded-2xl border border-indigo-100 space-y-2">
                  <div className="flex justify-between font-bold text-indigo-950">
                    <span>3. Net Tax Liability (incl. 4% Cess)</span>
                    <span className="font-mono">{fmt(activeTax)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Less: TDS Deposited</span>
                    <span className="font-mono text-emerald-600">- {fmt(tds)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-indigo-200 font-extrabold text-sm text-indigo-900">
                    <span>Net Refund Claimable</span>
                    <span className="font-mono text-emerald-600">{fmt(Math.max(0, refund))}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setDetailedModalOpen(false)}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Expert Booking Slide-over Drawer (ClearTax Style) */}
      <AnimatePresence>
        {expertModalOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
              onClick={() => setExpertModalOpen(false)}
            />
            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-screen max-w-md sm:max-w-lg bg-white shadow-2xl flex flex-col justify-between overflow-y-auto"
              >
                {/* Drawer Header */}
                <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-xl font-extrabold text-slate-900">
                    Book your Expert Tax Filing
                  </h2>
                  <button
                    onClick={() => setExpertModalOpen(false)}
                    className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Drawer Body - 3 Accordion Sections */}
                <div className="p-6 sm:p-8 space-y-4 flex-1">
                  {/* Accordion 1: Plan Details */}
                  <div className="border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between text-xs font-bold text-slate-800 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <span>Plan Details</span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </div>

                  {/* Accordion 2: Personal Details */}
                  <div className="border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between text-xs font-bold text-slate-800 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <span>Personal Details (used for invoicing)</span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </div>

                  {/* Accordion 3: Payment Summary (Expanded) */}
                  <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-2xs">
                    <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <Receipt className="w-4 h-4" />
                        </div>
                        <span>Payment Summary</span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-400 rotate-180" />
                    </div>

                    <div className="p-5 space-y-4">
                      {/* Coupon Savings Banner */}
                      <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl text-xs font-bold text-purple-900 flex items-center gap-2">
                        <span>🎉</span>
                        <span>Awesome! You have saved ₹ 5,998 ! 🎊</span>
                      </div>

                      <div className="space-y-3 text-xs text-slate-600">
                        <div className="flex justify-between">
                          <span>Plan Amount</span>
                          <span className="font-mono font-bold text-slate-900">₹ 9,997</span>
                        </div>

                        <div className="flex justify-between items-center text-emerald-600 font-medium">
                          <div className="flex items-center gap-1.5">
                            <span>Coupon</span>
                            <span className="font-mono font-bold bg-emerald-100/70 text-emerald-800 px-1.5 py-0.5 rounded text-[10px]">
                              OFFERITR
                            </span>
                            <span className="text-[10px] text-slate-400 underline cursor-pointer ml-1">
                              View/Edit
                            </span>
                          </div>
                          <span className="font-mono font-bold">- ₹ 5,998</span>
                        </div>

                        <div className="flex justify-between items-center text-slate-500">
                          <div className="flex items-center gap-1">
                            <span>GST @18%</span>
                            <span className="text-[10px] text-indigo-600 underline cursor-pointer">
                              Learn More
                            </span>
                          </div>
                          <span className="font-mono font-bold text-slate-800">₹ 719</span>
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-sm font-extrabold text-slate-900">
                          <span>Amount to Pay</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-normal text-slate-400 line-through">
                              ₹ 10,716
                            </span>
                            <span className="text-base text-indigo-600 font-mono">₹ 4,718</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sticky Bottom Confirm Button */}
                <div className="p-6 border-t border-slate-100 bg-white">
                  <button
                    onClick={() => {
                      setExpertModalOpen(false);
                      router.push('/select-plan');
                    }}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/25 transition-all text-center"
                  >
                    Confirm &amp; Pay ₹ 4,718
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Live Filing Call Slide-over Drawer (ClearTax Style) */}
      <AnimatePresence>
        {liveCallModalOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
              onClick={() => setLiveCallModalOpen(false)}
            />
            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-screen max-w-md sm:max-w-lg bg-white shadow-2xl flex flex-col justify-between overflow-y-auto"
              >
                {/* Drawer Header */}
                <div className="p-6 sm:p-8 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                      Live Filing
                    </span>
                    <button
                      onClick={() => setLiveCallModalOpen(false)}
                      className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900">
                        File stress-free within 30 minutes
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        File end to end in 30 minutes with NexTax Filing Specialist.
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs text-slate-400 line-through">₹ 499</div>
                      <div className="text-lg font-bold text-slate-900 font-mono">₹ 199</div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                        60% OFF
                      </span>
                    </div>
                  </div>
                </div>

                {/* Drawer Body - What's Covered */}
                <div className="p-6 sm:p-8 space-y-6 flex-1 text-xs">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      WHAT'S COVERED
                    </h3>
                    <ul className="space-y-3 text-slate-700">
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Video className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <strong className="text-slate-900 block">
                            30 min live call with a filing specialist
                          </strong>
                          <span>Real-time filing guidance over screenshare</span>
                        </div>
                      </li>

                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <strong className="text-slate-900 block">
                            Step by step filing guidance
                          </strong>
                          <span>From starting your ITR to final government submission</span>
                        </div>
                      </li>

                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Headphones className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <strong className="text-slate-900 block">24x7 support</strong>
                          <span>Whenever you have doubts or queries</span>
                        </div>
                      </li>
                    </ul>
                  </div>

                  {/* Informational Cards */}
                  <div className="p-4 bg-sky-50/70 border border-sky-100 rounded-2xl space-y-1">
                    <span className="font-bold text-sky-900 block">How payment works</span>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      This payment (₹ 236) covers your live filing guidance session only. The cost of your self-filing plan will be payable separately before submission.
                    </p>
                  </div>
                </div>

                {/* Sticky Bottom Payment Bar */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[11px] text-slate-400">Amount to Pay</div>
                    <div className="text-base font-extrabold text-slate-900 font-mono">
                      ₹ 236 <span className="text-[10px] font-normal text-slate-500">(incl. GST)</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setLiveCallModalOpen(false);
                      alert('Live Filing Session Booked! A specialist will initiate your call.');
                    }}
                    className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/20 transition-all shrink-0"
                  >
                    Pay 236 &amp; Book Live Filing
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Support Drawer */}
      <AnimatePresence>
        {supportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">Customer Support</h3>
                </div>
                <button onClick={() => setSupportModalOpen(false)} className="text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="py-4 text-xs text-slate-600 space-y-2">
                <p>Have doubts about your tax refund or regime recommendation?</p>
                <p className="font-semibold text-slate-800">
                  Our AI Tax Expert is available 24/7 to answer section-wise tax questions.
                </p>
              </div>
              <Link
                href="/chat"
                onClick={() => setSupportModalOpen(false)}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs text-center block"
              >
                Chat with AI Tax Expert
              </Link>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
