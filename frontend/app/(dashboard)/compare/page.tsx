"use client";

import React, { useState, useEffect } from 'react';
import { Scale, ArrowRight, CheckCircle2, TrendingDown, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { useRouter } from 'next/navigation';

export default function ComparePage() {
  const router = useRouter();
  const [selectedRegime, setSelectedRegime] = useState<'new' | 'old'>('new');
  const [data, setData] = useState({
    gross_salary: 0,
    deductions_80c: 0,
    tds_deducted: 0
  });

  const [isComputing, setIsComputing] = useState(true);
  const [dbResult, setDbResult] = useState<any>(null);

  useEffect(() => {
    const computeTax = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return router.push('/login');
      
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${API_URL}/api/tax/compute`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const result = await res.json();
          setDbResult(result);
          // Set recommendation
          setSelectedRegime(result.recommendation.regime);
          // Just setting basic data for UI rendering if needed
          setData({
             gross_salary: result.old_regime.gross_income,
             deductions_80c: result.old_regime.total_deductions - 50000,
             tds_deducted: result.recommendation.refund > 0 ? (result.recommendation.refund + Math.min(result.old_regime.total_tax, result.new_regime.total_tax)) : 0
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsComputing(false);
      }
    };
    computeTax();
  }, [router]);

  const calculateTax = () => {
    const s = data.gross_salary;
    const d80c = Math.min(data.deductions_80c, 150000);
    const standardDeduction = 50000;
    const grossTotal = s;

    // OLD REGIME
    const totalDeductionsOld = standardDeduction + d80c;
    let taxableOld = grossTotal - totalDeductionsOld;
    if (taxableOld < 0) taxableOld = 0;

    let taxOld = 0;
    if (taxableOld <= 500000) {
      taxOld = 0; // 87A rebate
    } else {
      let remaining = taxableOld;
      if (remaining > 1000000) { taxOld += (remaining - 1000000) * 0.30; remaining = 1000000; }
      if (remaining > 500000) { taxOld += (remaining - 500000) * 0.20; remaining = 500000; }
      if (remaining > 250000) { taxOld += (remaining - 250000) * 0.05; }
      taxOld = taxOld * 1.04; // Cess
    }

    // NEW REGIME
    const totalDeductionsNew = standardDeduction;
    let taxableNew = grossTotal - totalDeductionsNew;
    if (taxableNew < 0) taxableNew = 0;

    let taxNew = 0;
    if (taxableNew <= 700000) {
      taxNew = 0; // 87A rebate
    } else {
      let remaining = taxableNew;
      if (remaining > 1500000) { taxNew += (remaining - 1500000) * 0.30; remaining = 1500000; }
      if (remaining > 1200000) { taxNew += (remaining - 1200000) * 0.20; remaining = 1200000; }
      if (remaining > 900000) { taxNew += (remaining - 900000) * 0.15; remaining = 900000; }
      if (remaining > 600000) { taxNew += (remaining - 600000) * 0.10; remaining = 600000; }
      if (remaining > 300000) { taxNew += (remaining - 300000) * 0.05; remaining = 300000; }
      taxNew = taxNew * 1.04; // Cess
    }

    return {
      grossTotal,
      totalDeductionsOld,
      totalDeductionsNew,
      taxableOld,
      taxableNew,
      taxOld: Math.round(taxOld),
      taxNew: Math.round(taxNew)
    };
  };

  const results = calculateTax();
  const savings = Math.abs(results.taxOld - results.taxNew);
  const betterRegime = results.taxOld < results.taxNew ? 'Old Regime' : 'New Regime';
  const betterRegimeId = results.taxOld < results.taxNew ? 'old' : 'new';
  
  // Format currency
  const fmt = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Regime Comparison</h1>
          <p className="text-slate-500">We computed your tax under both regimes. See which saves you more.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/export" className="btn-primary flex items-center gap-2">
            Continue to E-File <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* AI Recommendation Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`border rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 ${betterRegimeId === 'new' ? 'bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-emerald-200' : 'bg-gradient-to-r from-indigo-50 to-indigo-100/50 border-indigo-200'}`}
      >
        <div className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 ${betterRegimeId === 'new' ? 'bg-emerald-100' : 'bg-indigo-100'}`}>
          <TrendingDown className={`h-8 w-8 ${betterRegimeId === 'new' ? 'text-emerald-600' : 'text-indigo-600'}`} />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className={`text-xl font-bold ${betterRegimeId === 'new' ? 'text-emerald-900' : 'text-indigo-900'}`}>NexTax AI Recommends: {betterRegime}</h2>
          <p className={`${betterRegimeId === 'new' ? 'text-emerald-700' : 'text-indigo-700'} mt-1`}>
            Based on your current deductions, switching to the {betterRegime} will save you <strong className="font-bold">{fmt(savings)}</strong> in taxes this year.
          </p>
        </div>
      </motion.div>

      {/* Comparison Cards */}
      <div className="grid md:grid-cols-2 gap-8">
        
        {/* NEW REGIME CARD */}
        <div 
          onClick={() => setSelectedRegime('new')}
          className={`cursor-pointer transition-all duration-200 rounded-3xl border-2 overflow-hidden ${
            selectedRegime === 'new' 
              ? 'border-emerald-500 shadow-lg shadow-emerald-500/10' 
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className={`p-6 ${selectedRegime === 'new' ? 'bg-emerald-500/5' : 'bg-slate-50'}`}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-slate-800">New Tax Regime</h3>
              {selectedRegime === 'new' && <CheckCircle2 className="text-emerald-500 fill-emerald-100" />}
            </div>
            <p className="text-sm text-slate-500 mb-6">Default regime for FY 2024-25. Lower slab rates, but most deductions (like 80C, HRA) are not allowed.</p>
            
            <div className="bg-white rounded-xl p-4 border border-slate-200 mb-6 text-center">
              <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Tax Payable</div>
              <div className="text-4xl font-bold text-slate-800">{fmt(results.taxNew)}</div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Gross Income</span>
                <span className="font-medium text-slate-800">{fmt(results.grossTotal)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Standard Deduction</span>
                <span className="font-medium text-emerald-600">-{fmt(50000)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Other Deductions Allowed</span>
                <span className="font-medium text-slate-400">₹0</span>
              </div>
              <div className="flex justify-between py-2 font-semibold">
                <span className="text-slate-700">Net Taxable Income</span>
                <span className="text-slate-800">{fmt(results.taxableNew)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* OLD REGIME CARD */}
        <div 
          onClick={() => setSelectedRegime('old')}
          className={`cursor-pointer transition-all duration-200 rounded-3xl border-2 overflow-hidden ${
            selectedRegime === 'old' 
              ? 'border-primary shadow-lg shadow-primary/10' 
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className={`p-6 ${selectedRegime === 'old' ? 'bg-primary/5' : 'bg-slate-50'}`}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-slate-800">Old Tax Regime</h3>
              {selectedRegime === 'old' && <CheckCircle2 className="text-primary fill-indigo-100" />}
            </div>
            <p className="text-sm text-slate-500 mb-6">Traditional regime. Higher slab rates, but allows you to claim all your investments and deductions.</p>
            
            <div className="bg-white rounded-xl p-4 border border-slate-200 mb-6 text-center">
              <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Tax Payable</div>
              <div className="text-4xl font-bold text-slate-800">{fmt(results.taxOld)}</div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Gross Income</span>
                <span className="font-medium text-slate-800">{fmt(results.grossTotal)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Standard Deduction</span>
                <span className="font-medium text-primary">-{fmt(50000)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">80C & Other Deductions</span>
                <span className="font-medium text-primary">-{fmt(results.totalDeductionsOld - 50000)}</span>
              </div>
              <div className="flex justify-between py-2 font-semibold">
                <span className="text-slate-700">Net Taxable Income</span>
                <span className="text-slate-800">{fmt(results.taxableOld)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
