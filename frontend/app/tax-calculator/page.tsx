"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calculator, ArrowRight, Info, ShieldCheck, ChevronDown, CheckCircle2, ChevronRight, Star } from 'lucide-react';

export default function TaxCalculatorPage() {
  // Assessment Year & Age Group
  const [financialYear, setFinancialYear] = useState('2024-2025');
  const [ageGroup, setAgeGroup] = useState('below60');

  // INCOME
  const [salary, setSalary] = useState<number | ''>('');
  const [exemptions, setExemptions] = useState<number | ''>(''); // HRA, LTA
  const [interestIncome, setInterestIncome] = useState<number | ''>('');
  const [otherIncome, setOtherIncome] = useState<number | ''>('');
  const [homeLoanInterest, setHomeLoanInterest] = useState<number | ''>(''); // Loss from house property

  // DEDUCTIONS
  const [deductions80c, setDeductions80c] = useState<number | ''>(''); // max 1.5L
  const [deductions80ccd1b, setDeductions80ccd1b] = useState<number | ''>(''); // max 50k
  const [deductions80d, setDeductions80d] = useState<number | ''>('');
  const [deductions80tta, setDeductions80tta] = useState<number | ''>('');
  const [deductions80g, setDeductions80g] = useState<number | ''>('');

  // RESULTS
  const [results, setResults] = useState({
    grossIncome: 0,
    totalDeductionsOld: 0,
    totalDeductionsNew: 0,
    taxableOld: 0,
    taxableNew: 0,
    taxOld: 0,
    taxNew: 0,
  });

  const calculateTax = () => {
    // Values
    const s = Number(salary) || 0;
    const ex = Number(exemptions) || 0;
    const i = Number(interestIncome) || 0;
    const o = Number(otherIncome) || 0;
    const hl = Math.min(Number(homeLoanInterest) || 0, 200000); // Max 2L loss
    
    const d80c = Math.min(Number(deductions80c) || 0, 150000);
    const d80ccd1b = Math.min(Number(deductions80ccd1b) || 0, 50000);
    const d80d = Number(deductions80d) || 0;
    const d80tta = Math.min(Number(deductions80tta) || 0, ageGroup === 'senior' ? 50000 : 10000);
    const d80g = Number(deductions80g) || 0;

    const standardDeduction = 50000;

    // GROSS
    const grossTotal = s + i + o;

    // OLD REGIME
    const totalDeductionsOld = standardDeduction + ex + hl + d80c + d80ccd1b + d80d + d80tta + d80g;
    let taxableOld = grossTotal - totalDeductionsOld;
    if (taxableOld < 0) taxableOld = 0;

    // OLD TAX CALCULATION (simplified for below 60 FY 24-25)
    let taxOld = 0;
    if (taxableOld <= 500000) {
      taxOld = 0; // 87A rebate
    } else {
      let remaining = taxableOld;
      if (remaining > 1000000) {
        taxOld += (remaining - 1000000) * 0.30;
        remaining = 1000000;
      }
      if (remaining > 500000) {
        taxOld += (remaining - 500000) * 0.20;
        remaining = 500000;
      }
      if (remaining > 250000) {
        taxOld += (remaining - 250000) * 0.05;
      }
      taxOld = taxOld * 1.04; // Cess
    }

    // NEW REGIME
    // For salaried, standard deduction of 50k is allowed in new regime. No other deductions.
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

    setResults({
      grossIncome: grossTotal,
      totalDeductionsOld,
      totalDeductionsNew,
      taxableOld,
      taxableNew,
      taxOld: Math.round(taxOld),
      taxNew: Math.round(taxNew),
    });
  };

  useEffect(() => {
    calculateTax();
  }, [salary, exemptions, interestIncome, otherIncome, homeLoanInterest, deductions80c, deductions80ccd1b, deductions80d, deductions80tta, deductions80g, financialYear, ageGroup]);

  const betterRegime = results.taxOld <= results.taxNew ? 'Old Regime' : 'New Regime';
  const savings = Math.abs(results.taxOld - results.taxNew);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="bg-white border-b border-black/5 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <div className="w-6 h-6 bg-amber-400 rounded-md"></div>
            NexTax
          </Link>
          <div className="flex items-center gap-5">
            {/* Marketing Ad / Promoted Action */}
            <Link href="/pricing" className="hidden lg:flex items-center gap-2 text-sm font-medium bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-full hover:bg-amber-100 transition-colors shadow-sm">
              <Star size={14} className="fill-amber-400 text-amber-500" />
              <span>Hire an Expert</span>
            </Link>
            
            <div className="w-px h-5 bg-slate-200 hidden md:block"></div>

            <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors">
              Log in
            </Link>
            <Link href="/signup" className="text-sm font-semibold bg-[#1678fb] text-white hover:bg-blue-600 transition-colors py-2 px-5 rounded shadow-sm">
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="bg-[#1e2a3b] text-white pt-16 pb-32 relative">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Income Tax Calculator</h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Calculate your Income Tax for FY 2024-25 (AY 2025-26). Instantly compare the Old and New tax regimes to find your maximum savings.
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 -mt-20 pb-24 relative z-10">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* MAIN FORM - Detailed ClearTax Style */}
          <div className="lg:col-span-8 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 overflow-hidden">
            
            {/* Top Config Row */}
            <div className="grid md:grid-cols-2 border-b border-slate-100">
              <div className="p-6 border-b md:border-b-0 md:border-r border-slate-100">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Which Financial Year?</label>
                <div className="flex gap-2">
                  <button onClick={() => setFinancialYear('2024-2025')} className={`flex-1 py-2 px-4 rounded border text-sm font-semibold transition-colors ${financialYear === '2024-2025' ? 'bg-[#1678fb]/10 border-[#1678fb] text-[#1678fb]' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>FY 2024-25</button>
                  <button onClick={() => setFinancialYear('2023-2024')} className={`flex-1 py-2 px-4 rounded border text-sm font-semibold transition-colors ${financialYear === '2023-2024' ? 'bg-[#1678fb]/10 border-[#1678fb] text-[#1678fb]' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>FY 2023-24</button>
                </div>
              </div>
              <div className="p-6">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Your Age</label>
                <div className="flex gap-2">
                  <button onClick={() => setAgeGroup('below60')} className={`flex-1 py-2 px-3 rounded border text-sm font-semibold transition-colors ${ageGroup === 'below60' ? 'bg-[#1678fb]/10 border-[#1678fb] text-[#1678fb]' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>Below 60</button>
                  <button onClick={() => setAgeGroup('senior')} className={`flex-1 py-2 px-3 rounded border text-sm font-semibold transition-colors ${ageGroup === 'senior' ? 'bg-[#1678fb]/10 border-[#1678fb] text-[#1678fb]' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>60 - 80</button>
                  <button onClick={() => setAgeGroup('super')} className={`flex-1 py-2 px-3 rounded border text-sm font-semibold transition-colors ${ageGroup === 'super' ? 'bg-[#1678fb]/10 border-[#1678fb] text-[#1678fb]' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>80+</button>
                </div>
              </div>
            </div>

            {/* Income Section */}
            <div className="p-8 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">Income Details</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Income from Salary</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                    <input type="number" value={salary} onChange={(e) => setSalary(e.target.value === '' ? '' : Number(e.target.value))} className="w-full pl-8 pr-4 py-2.5 rounded border border-slate-300 focus:border-[#1678fb] focus:ring-1 focus:ring-[#1678fb] outline-none text-sm transition-all shadow-sm" placeholder="e.g. 1200000" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Exemptions (HRA, LTA, etc.)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                    <input type="number" value={exemptions} onChange={(e) => setExemptions(e.target.value === '' ? '' : Number(e.target.value))} className="w-full pl-8 pr-4 py-2.5 rounded border border-slate-300 focus:border-[#1678fb] focus:ring-1 focus:ring-[#1678fb] outline-none text-sm transition-all shadow-sm" placeholder="e.g. 50000" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Income from Interest (Bank, FD)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                    <input type="number" value={interestIncome} onChange={(e) => setInterestIncome(e.target.value === '' ? '' : Number(e.target.value))} className="w-full pl-8 pr-4 py-2.5 rounded border border-slate-300 focus:border-[#1678fb] focus:ring-1 focus:ring-[#1678fb] outline-none text-sm transition-all shadow-sm" placeholder="e.g. 15000" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Other Income</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                    <input type="number" value={otherIncome} onChange={(e) => setOtherIncome(e.target.value === '' ? '' : Number(e.target.value))} className="w-full pl-8 pr-4 py-2.5 rounded border border-slate-300 focus:border-[#1678fb] focus:ring-1 focus:ring-[#1678fb] outline-none text-sm transition-all shadow-sm" placeholder="e.g. 10000" />
                  </div>
                </div>
              </div>
            </div>

            {/* Deductions Section */}
            <div className="p-8">
              <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">Deductions</h2>
              <p className="text-xs text-slate-500 mb-6">Note: Deductions are only applicable under the Old Tax Regime. Standard Deduction of ₹50,000 is automatically applied to both.</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Basic Deductions - 80C (EPF, LIC, PPF, ELSS)</label>
                  <div className="relative md:w-1/2">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                    <input type="number" value={deductions80c} onChange={(e) => setDeductions80c(e.target.value === '' ? '' : Number(e.target.value))} className="w-full pl-8 pr-4 py-2.5 rounded border border-slate-300 focus:border-[#1678fb] focus:ring-1 focus:ring-[#1678fb] outline-none text-sm transition-all shadow-sm" placeholder="Max ₹1,50,000" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">NPS Contribution - 80CCD(1B)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                      <input type="number" value={deductions80ccd1b} onChange={(e) => setDeductions80ccd1b(e.target.value === '' ? '' : Number(e.target.value))} className="w-full pl-8 pr-4 py-2.5 rounded border border-slate-300 focus:border-[#1678fb] focus:ring-1 focus:ring-[#1678fb] outline-none text-sm transition-all shadow-sm" placeholder="Max ₹50,000" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Medical Insurance - 80D</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                      <input type="number" value={deductions80d} onChange={(e) => setDeductions80d(e.target.value === '' ? '' : Number(e.target.value))} className="w-full pl-8 pr-4 py-2.5 rounded border border-slate-300 focus:border-[#1678fb] focus:ring-1 focus:ring-[#1678fb] outline-none text-sm transition-all shadow-sm" placeholder="e.g. 25000" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Interest on Home Loan - 24(b)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                      <input type="number" value={homeLoanInterest} onChange={(e) => setHomeLoanInterest(e.target.value === '' ? '' : Number(e.target.value))} className="w-full pl-8 pr-4 py-2.5 rounded border border-slate-300 focus:border-[#1678fb] focus:ring-1 focus:ring-[#1678fb] outline-none text-sm transition-all shadow-sm" placeholder="Max ₹2,00,000" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Savings Interest - 80TTA/TTB</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                      <input type="number" value={deductions80tta} onChange={(e) => setDeductions80tta(e.target.value === '' ? '' : Number(e.target.value))} className="w-full pl-8 pr-4 py-2.5 rounded border border-slate-300 focus:border-[#1678fb] focus:ring-1 focus:ring-[#1678fb] outline-none text-sm transition-all shadow-sm" placeholder="Max ₹10,000" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Detailed Table (Visible on large screens) */}
            <div className="bg-slate-50 p-8 border-t border-slate-200">
              <h3 className="font-bold text-slate-800 mb-4">Detailed Tax Computation</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#1e2a3b] text-white">
                    <tr>
                      <th className="px-4 py-3 rounded-tl">Particulars</th>
                      <th className="px-4 py-3 text-right">Old Regime</th>
                      <th className="px-4 py-3 text-right rounded-tr">New Regime</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr className="bg-white">
                      <td className="px-4 py-3 font-medium">Gross Total Income</td>
                      <td className="px-4 py-3 text-right">₹{results.grossIncome.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-right">₹{results.grossIncome.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr className="bg-white text-slate-600">
                      <td className="px-4 py-3">Total Deductions</td>
                      <td className="px-4 py-3 text-right text-rose-500">-₹{results.totalDeductionsOld.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-right text-rose-500">-₹{results.totalDeductionsNew.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr className="bg-slate-100 font-semibold text-slate-800">
                      <td className="px-4 py-3">Total Taxable Income</td>
                      <td className="px-4 py-3 text-right">₹{results.taxableOld.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-right">₹{results.taxableNew.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="px-4 py-3 font-bold text-slate-900">Total Tax (Inc. Cess)</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">₹{results.taxOld.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">₹{results.taxNew.toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* SIDE WIDGET (STICKY) */}
          <div className="lg:col-span-4 relative">
            <div className="sticky top-24 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-200 overflow-hidden">
              
              <div className="bg-[#1e2a3b] p-6 text-white text-center border-b-4 border-[#1678fb]">
                <p className="text-sm font-medium text-slate-300 mb-1 uppercase tracking-wider">Tax to be paid</p>
                <div className="text-4xl font-bold mb-4">
                  ₹{Math.min(results.taxOld, results.taxNew).toLocaleString('en-IN')}
                </div>
                <div className="bg-[#1678fb]/20 border border-[#1678fb]/50 text-[#60a5fa] text-xs font-bold px-3 py-1.5 rounded-full inline-block">
                  Via {betterRegime}
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className={`p-4 rounded-lg border flex justify-between items-center transition-all ${betterRegime === 'Old Regime' ? 'bg-[#f4f9ff] border-[#1678fb]' : 'border-slate-200 opacity-70'}`}>
                  <div>
                    <p className={`text-sm font-bold ${betterRegime === 'Old Regime' ? 'text-[#1678fb]' : 'text-slate-600'}`}>Old Regime</p>
                    {betterRegime === 'Old Regime' && <p className="text-xs text-emerald-600 font-semibold mt-1">Saves ₹{savings.toLocaleString('en-IN')}</p>}
                  </div>
                  <div className="text-lg font-bold text-slate-800">₹{results.taxOld.toLocaleString('en-IN')}</div>
                </div>

                <div className={`p-4 rounded-lg border flex justify-between items-center transition-all ${betterRegime === 'New Regime' ? 'bg-[#f4f9ff] border-[#1678fb]' : 'border-slate-200 opacity-70'}`}>
                  <div>
                    <p className={`text-sm font-bold ${betterRegime === 'New Regime' ? 'text-[#1678fb]' : 'text-slate-600'}`}>New Regime</p>
                    {betterRegime === 'New Regime' && <p className="text-xs text-emerald-600 font-semibold mt-1">Saves ₹{savings.toLocaleString('en-IN')}</p>}
                  </div>
                  <div className="text-lg font-bold text-slate-800">₹{results.taxNew.toLocaleString('en-IN')}</div>
                </div>
                
                <hr className="border-slate-100 my-4" />
                
                <Link href="/upload" className="w-full flex justify-center items-center gap-2 rounded bg-[#1678fb] px-4 py-3.5 text-sm font-semibold text-white shadow hover:bg-blue-600 transition-colors">
                  File ITR Now <ChevronRight size={16} />
                </Link>
              </div>

              <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-start gap-3">
                <ShieldCheck className="text-emerald-500 shrink-0 mt-0.5" size={20} />
                <p className="text-xs text-slate-500 leading-relaxed">
                  Your calculations are completely secure. We use 256-bit encryption and are an authorized E-Return Intermediary.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* RICH CONTENT & SEO SECTION */}
      <section className="bg-white border-t border-slate-200 py-16">
        <div className="max-w-4xl mx-auto px-6 text-slate-700 space-y-12">
          
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">What are Income Tax Slabs?</h2>
            <p className="leading-relaxed mb-4">
              Income Tax Slabs are income ranges determined by the government, taxed at different rates. While the new tax regime has more beneficial slab rates with significant deductions, the old tax regime offers a plethora of deductions, with comparatively less beneficial slab rates.
            </p>
            <p className="leading-relaxed">
              The new tax regime is the default regime, which can be opted out by the taxpayer if it is more beneficial to them, on satisfaction of certain conditions. The final tax liability depends on many factors like choice of regime, applicability of surcharge, rebates, and income chargeable at special rates.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">What is the New Tax Regime?</h2>
            <p className="leading-relaxed">
              The provisions related to the new tax regime are dealt under section 115BAC of the Income Tax Act, 1961. Though it offers limited deductions and exemptions, this regime is more beneficial for middle-class assessees, who do not have elaborate tax planning strategies and tax-saving deductions.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">New Tax Regime Slab Rates for FY 2025-26 & 2026-27</h2>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-4 font-bold text-slate-900">Income Tax Slabs (₹)</th>
                    <th className="p-4 font-bold text-slate-900">Income Tax Rates</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr><td className="p-4">Up to 4 lakh</td><td className="p-4">Nil</td></tr>
                  <tr><td className="p-4">4 lakh to 8 lakh</td><td className="p-4">5%</td></tr>
                  <tr><td className="p-4">8 lakh to 12 lakh</td><td className="p-4">10%</td></tr>
                  <tr><td className="p-4">12 lakh to 16 lakh</td><td className="p-4">15%</td></tr>
                  <tr><td className="p-4">16 lakh to 20 lakh</td><td className="p-4">20%</td></tr>
                  <tr><td className="p-4">20 lakh to 24 lakh</td><td className="p-4">25%</td></tr>
                  <tr><td className="p-4 font-semibold">Above 24 lakh</td><td className="p-4 font-semibold">30%</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Old Tax Regime Slab Rates</h2>
            <p className="mb-4 text-sm text-slate-500">There have been no changes in the tax slabs under the old regime over the past few years (For individuals below 60 years).</p>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-4 font-bold text-slate-900">Income Tax Slabs (₹)</th>
                    <th className="p-4 font-bold text-slate-900">Income Tax Rates</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr><td className="p-4">Up to 2.5 lakh</td><td className="p-4">Nil</td></tr>
                  <tr><td className="p-4">2.5 lakh to 5 lakh</td><td className="p-4">5%</td></tr>
                  <tr><td className="p-4">5 lakh to 10 lakh</td><td className="p-4">20%</td></tr>
                  <tr><td className="p-4 font-semibold">Above 10 lakh</td><td className="p-4 font-semibold">30%</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Deductions available under the Old v/s New Regime</h2>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-4 font-bold text-slate-900">Tax Benefit</th>
                    <th className="p-4 font-bold text-slate-900">Old Regime</th>
                    <th className="p-4 font-bold text-slate-900">New Regime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr><td className="p-4 font-medium">Rebate u/s 87A</td><td className="p-4">₹12,500 (income up to ₹5 lakh)</td><td className="p-4 text-emerald-600 font-semibold">₹60,000 (income up to ₹12 lakh)</td></tr>
                  <tr><td className="p-4 font-medium">Standard Deduction</td><td className="p-4">₹50,000</td><td className="p-4 text-emerald-600 font-semibold">₹75,000</td></tr>
                  <tr><td className="p-4 font-medium">Section 80C Deductions</td><td className="p-4 text-emerald-600 font-semibold">Allowed</td><td className="p-4 text-rose-500">Not Allowed</td></tr>
                  <tr><td className="p-4 font-medium">HRA Exemption</td><td className="p-4 text-emerald-600 font-semibold">Allowed</td><td className="p-4 text-rose-500">Not Allowed</td></tr>
                  <tr><td className="p-4 font-medium">Home loan interest (Self)</td><td className="p-4 text-emerald-600 font-semibold">Allowed</td><td className="p-4 text-rose-500">Not Allowed</td></tr>
                  <tr><td className="p-4 font-medium">Section 80D Deduction</td><td className="p-4 text-emerald-600 font-semibold">Allowed</td><td className="p-4 text-rose-500">Not Allowed</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Zero Tax on Income Up to ₹12 Lakh - How it works?</h2>
            <p className="leading-relaxed">
              For an income up to ₹12 lakhs, the effective tax liability can be reduced to zero under the new regime, using a concept called rebate dealt under section 87A of the Income Tax Act, 1961. However, it is to be noted that the rebate is available only for income charged under the normal slab rates. Special rate income like capital gains and online gaming income are not eligible for this rebate.
            </p>
          </div>

          {/* FAQs */}
          <div className="pt-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-8">Frequently Asked Questions</h2>
            <div className="space-y-4">
              
              <details className="group bg-slate-50 border border-slate-200 rounded-lg open:bg-white open:ring-1 open:ring-[#1678fb]/20 open:shadow-sm transition-all duration-200">
                <summary className="flex cursor-pointer items-center justify-between p-6 font-semibold text-slate-800 marker:content-none">
                  Is the new tax regime better than the old tax regime?
                  <ChevronDown className="transition-transform group-open:rotate-180 text-slate-400" size={20} />
                </summary>
                <div className="px-6 pb-6 text-slate-600 leading-relaxed">
                  For middle-class taxpayers with simple income structures and limited tax-saving investments or deductions, the new regime is generally more beneficial due to lower slab rates and the massive ₹12 Lakh rebate.
                </div>
              </details>

              <details className="group bg-slate-50 border border-slate-200 rounded-lg open:bg-white open:ring-1 open:ring-[#1678fb]/20 open:shadow-sm transition-all duration-200">
                <summary className="flex cursor-pointer items-center justify-between p-6 font-semibold text-slate-800 marker:content-none">
                  Can I switch from the old to the new tax regime?
                  <ChevronDown className="transition-transform group-open:rotate-180 text-slate-400" size={20} />
                </summary>
                <div className="px-6 pb-6 text-slate-600 leading-relaxed">
                  Yes. Salaried individuals can switch every year. However, for business income taxpayers, Form 10-IEA is required to switch between the old and new tax regime, and switching back and forth has limitations.
                </div>
              </details>

              <details className="group bg-slate-50 border border-slate-200 rounded-lg open:bg-white open:ring-1 open:ring-[#1678fb]/20 open:shadow-sm transition-all duration-200">
                <summary className="flex cursor-pointer items-center justify-between p-6 font-semibold text-slate-800 marker:content-none">
                  Does the income tax calculator calculate for TDS?
                  <ChevronDown className="transition-transform group-open:rotate-180 text-slate-400" size={20} />
                </summary>
                <div className="px-6 pb-6 text-slate-600 leading-relaxed">
                  No, the income tax calculator does not compute the Tax Deducted at Source (TDS). However, it calculates your total tax liability for the assessment year. To see if you owe tax or get a refund, subtract your already-deducted TDS from the final tax liability shown here.
                </div>
              </details>

            </div>
          </div>

          {/* Popular Calculators */}
          <div className="pt-8 border-t border-slate-200 mt-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Popular Calculators</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
              <Link href="/tax-calculator" className="text-sm text-[#1678fb] hover:underline font-medium">Income Tax Calculator</Link>
              <Link href="/advance-tax-calculator" className="text-sm text-[#1678fb] hover:underline font-medium">Advance Tax Calculator</Link>
              <Link href="/sip-calculator" className="text-sm text-[#1678fb] hover:underline font-medium">SIP Calculator</Link>
              <Link href="/hra-calculator" className="text-sm text-[#1678fb] hover:underline font-medium">HRA Calculator</Link>
              <Link href="/nps-calculator" className="text-sm text-[#1678fb] hover:underline font-medium">NPS Calculator</Link>
              <Link href="/login" className="text-sm text-[#1678fb] hover:underline font-medium">Interest Calculator</Link>
              <Link href="/login" className="text-sm text-[#1678fb] hover:underline font-medium">Gratuity Calculator</Link>
              <Link href="/login" className="text-sm text-[#1678fb] hover:underline font-medium">PF Calculator</Link>
              <Link href="/login" className="text-sm text-[#1678fb] hover:underline font-medium">Salary Calculator</Link>
              <Link href="/login" className="text-sm text-[#1678fb] hover:underline font-medium">PPF Calculator</Link>
              <Link href="/login" className="text-sm text-[#1678fb] hover:underline font-medium">RD Calculator</Link>
              <Link href="/login" className="text-sm text-[#1678fb] hover:underline font-medium">SWP Calculator</Link>
              <Link href="/login" className="text-sm text-[#1678fb] hover:underline font-medium">Compound Interest Calculator</Link>
              <Link href="/login" className="text-sm text-[#1678fb] hover:underline font-medium">Mutual Fund Calculator</Link>
              <Link href="/login" className="text-sm text-[#1678fb] hover:underline font-medium">ROI Calculator</Link>
              <Link href="/login" className="text-sm text-[#1678fb] hover:underline font-medium">Discount Calculator</Link>
              <Link href="/login" className="text-sm text-[#1678fb] hover:underline font-medium">FD Calculator</Link>
              <Link href="/login" className="text-sm text-[#1678fb] hover:underline font-medium">Lumpsum Calculator</Link>
              <Link href="/login" className="text-sm text-[#1678fb] hover:underline font-medium">Down Payment Calculator</Link>
              <Link href="/login" className="text-sm text-[#1678fb] hover:underline font-medium">Retirement Planning Calculator</Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
