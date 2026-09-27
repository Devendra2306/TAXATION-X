"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calculator, ChevronRight, ShieldCheck, ChevronDown, Star } from 'lucide-react';

export default function AdvanceTaxCalculatorPage() {
  // Basic Details
  const [assesseeType, setAssesseeType] = useState('Individual');
  const [ageGroup, setAgeGroup] = useState('below60');
  const [residentialStatus, setResidentialStatus] = useState('Resident');

  // Income Details
  const [salary, setSalary] = useState<number | ''>('');
  const [businessIncome, setBusinessIncome] = useState<number | ''>('');
  const [capitalGains, setCapitalGains] = useState<number | ''>('');
  const [otherIncome, setOtherIncome] = useState<number | ''>('');

  // Deductions (simplified for Advance Tax estimation)
  const [deductions80c, setDeductions80c] = useState<number | ''>('');
  const [deductionsOther, setDeductionsOther] = useState<number | ''>('');

  // Taxes Paid
  const [tds, setTds] = useState<number | ''>('');
  const [advanceTaxPaid, setAdvanceTaxPaid] = useState<number | ''>('');

  // Results
  const [results, setResults] = useState({
    taxLiability: 0,
    netLiabilityAfterTds: 0,
    junDue: 0,
    sepDue: 0,
    decDue: 0,
    marDue: 0,
    requiresAdvanceTax: false
  });

  const calculateAdvanceTax = () => {
    // Estimations
    const s = Number(salary) || 0;
    const b = Number(businessIncome) || 0;
    const cg = Number(capitalGains) || 0;
    const o = Number(otherIncome) || 0;
    
    const d80c = Math.min(Number(deductions80c) || 0, 150000);
    const dOther = Number(deductionsOther) || 0;

    const currentTds = Number(tds) || 0;
    const currentPaid = Number(advanceTaxPaid) || 0;

    // Gross
    let taxableIncome = (s + b + cg + o) - (d80c + dOther);
    if (taxableIncome < 0) taxableIncome = 0;

    // Simplified Tax Calc (New Regime Default logic for simplicity of estimation)
    let tax = 0;
    if (taxableIncome > 700000) {
      let remaining = taxableIncome;
      if (remaining > 1500000) { tax += (remaining - 1500000) * 0.30; remaining = 1500000; }
      if (remaining > 1200000) { tax += (remaining - 1200000) * 0.20; remaining = 1200000; }
      if (remaining > 900000) { tax += (remaining - 900000) * 0.15; remaining = 900000; }
      if (remaining > 600000) { tax += (remaining - 600000) * 0.10; remaining = 600000; }
      if (remaining > 300000) { tax += (remaining - 300000) * 0.05; }
      tax = tax * 1.04; // Cess
    }

    // Corporate flat tax simplification
    if (assesseeType === 'Company Public' || assesseeType === 'Company Private' || assesseeType === 'Firm' || assesseeType === 'LLP') {
      tax = taxableIncome * 0.312; // Flat 30% + 4% cess roughly
    }

    const netLiabilityAfterTds = tax - currentTds;
    const requiresAdvanceTax = netLiabilityAfterTds >= 10000;

    // Installments
    let junDue = 0, sepDue = 0, decDue = 0, marDue = 0;
    
    if (requiresAdvanceTax) {
      junDue = Math.max(0, (netLiabilityAfterTds * 0.15) - currentPaid);
      sepDue = Math.max(0, (netLiabilityAfterTds * 0.45) - currentPaid);
      decDue = Math.max(0, (netLiabilityAfterTds * 0.75) - currentPaid);
      marDue = Math.max(0, (netLiabilityAfterTds * 1.00) - currentPaid);
    }

    setResults({
      taxLiability: Math.round(tax),
      netLiabilityAfterTds: Math.max(0, Math.round(netLiabilityAfterTds)),
      junDue: Math.round(junDue),
      sepDue: Math.round(sepDue),
      decDue: Math.round(decDue),
      marDue: Math.round(marDue),
      requiresAdvanceTax
    });
  };

  useEffect(() => {
    calculateAdvanceTax();
  }, [assesseeType, ageGroup, residentialStatus, salary, businessIncome, capitalGains, otherIncome, deductions80c, deductionsOther, tds, advanceTaxPaid]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="bg-white border-b border-slate-200">
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Advance Tax Calculator</h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Calculate your estimated advance tax due online. Enter values as estimated for the year ending on 31 Mar 2026.
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 -mt-20 pb-16 relative z-10">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-8 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            
            {/* Config row */}
            <div className="p-6 border-b border-slate-100">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Taxpayer Type</label>
              <select value={assesseeType} onChange={e => setAssesseeType(e.target.value)} className="w-full border border-slate-300 rounded p-3 text-sm focus:border-[#1678fb] outline-none">
                <option value="Individual">Individual</option>
                <option value="HUF">HUF</option>
                <option value="AOP/BOI">AOP/BOI</option>
                <option value="Company Public">Company Public</option>
                <option value="Company Private">Company Private</option>
                <option value="Firm">Firm</option>
                <option value="LLP">LLP</option>
              </select>
            </div>

            <div className="grid md:grid-cols-2 border-b border-slate-100">
              <div className="p-6 border-b md:border-b-0 md:border-r border-slate-100">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Your Age</label>
                <div className="flex gap-2">
                  <button onClick={() => setAgeGroup('below60')} className={`flex-1 py-2 px-3 rounded border text-sm font-semibold transition-colors ${ageGroup === 'below60' ? 'bg-[#1678fb]/10 border-[#1678fb] text-[#1678fb]' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>0-60</button>
                  <button onClick={() => setAgeGroup('senior')} className={`flex-1 py-2 px-3 rounded border text-sm font-semibold transition-colors ${ageGroup === 'senior' ? 'bg-[#1678fb]/10 border-[#1678fb] text-[#1678fb]' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>60-80</button>
                  <button onClick={() => setAgeGroup('super')} className={`flex-1 py-2 px-3 rounded border text-sm font-semibold transition-colors ${ageGroup === 'super' ? 'bg-[#1678fb]/10 border-[#1678fb] text-[#1678fb]' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>80+</button>
                </div>
              </div>
              <div className="p-6">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Residential Status</label>
                <div className="flex gap-2">
                  <button onClick={() => setResidentialStatus('Resident')} className={`flex-1 py-2 px-3 rounded border text-sm font-semibold transition-colors ${residentialStatus === 'Resident' ? 'bg-[#1678fb]/10 border-[#1678fb] text-[#1678fb]' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>Resident</button>
                  <button onClick={() => setResidentialStatus('Non Resident')} className={`flex-1 py-2 px-3 rounded border text-sm font-semibold transition-colors ${residentialStatus === 'Non Resident' ? 'bg-[#1678fb]/10 border-[#1678fb] text-[#1678fb]' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>Non Resident</button>
                </div>
              </div>
            </div>

            {/* Income & Deductions */}
            <div className="p-8 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Estimated Income Details</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Estimated Salary</label>
                  <input type="number" value={salary} onChange={(e) => setSalary(e.target.value === '' ? '' : Number(e.target.value))} className="w-full px-4 py-2.5 rounded border border-slate-300 outline-none text-sm" placeholder="₹" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Business/Profession Income</label>
                  <input type="number" value={businessIncome} onChange={(e) => setBusinessIncome(e.target.value === '' ? '' : Number(e.target.value))} className="w-full px-4 py-2.5 rounded border border-slate-300 outline-none text-sm" placeholder="₹" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Capital Gains</label>
                  <input type="number" value={capitalGains} onChange={(e) => setCapitalGains(e.target.value === '' ? '' : Number(e.target.value))} className="w-full px-4 py-2.5 rounded border border-slate-300 outline-none text-sm" placeholder="₹" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Other Income</label>
                  <input type="number" value={otherIncome} onChange={(e) => setOtherIncome(e.target.value === '' ? '' : Number(e.target.value))} className="w-full px-4 py-2.5 rounded border border-slate-300 outline-none text-sm" placeholder="₹" />
                </div>
              </div>

              <h2 className="text-xl font-bold text-slate-800 mb-6 mt-8">Estimated Deductions</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Section 80C</label>
                  <input type="number" value={deductions80c} onChange={(e) => setDeductions80c(e.target.value === '' ? '' : Number(e.target.value))} className="w-full px-4 py-2.5 rounded border border-slate-300 outline-none text-sm" placeholder="Max ₹1,50,000" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Other Deductions (80D, 80G etc.)</label>
                  <input type="number" value={deductionsOther} onChange={(e) => setDeductionsOther(e.target.value === '' ? '' : Number(e.target.value))} className="w-full px-4 py-2.5 rounded border border-slate-300 outline-none text-sm" placeholder="₹" />
                </div>
              </div>
            </div>

            {/* Taxes Paid */}
            <div className="p-8 bg-slate-50 border-t border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Taxes Already Deducted / Paid</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">TDS / TCS Deducted</label>
                  <input type="number" value={tds} onChange={(e) => setTds(e.target.value === '' ? '' : Number(e.target.value))} className="w-full px-4 py-2.5 rounded border border-slate-300 outline-none text-sm" placeholder="₹" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Advance Tax Paid so far</label>
                  <input type="number" value={advanceTaxPaid} onChange={(e) => setAdvanceTaxPaid(e.target.value === '' ? '' : Number(e.target.value))} className="w-full px-4 py-2.5 rounded border border-slate-300 outline-none text-sm" placeholder="₹" />
                </div>
              </div>
            </div>

          </div>

          {/* Sticky Results */}
          <div className="lg:col-span-4 relative">
            <div className="sticky top-24 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-[#1e2a3b] p-6 text-white text-center border-b-4 border-[#1678fb]">
                <p className="text-sm font-medium text-slate-300 mb-1 uppercase tracking-wider">Estimated Total Tax</p>
                <div className="text-4xl font-bold mb-4">
                  ₹{results.taxLiability.toLocaleString('en-IN')}
                </div>
                {!results.requiresAdvanceTax && results.netLiabilityAfterTds < 10000 && results.taxLiability > 0 && (
                  <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full inline-block">
                    No Advance Tax Required
                  </div>
                )}
                {results.requiresAdvanceTax && (
                  <div className="bg-rose-500/20 border border-rose-500/50 text-rose-400 text-xs font-bold px-3 py-1.5 rounded-full inline-block">
                    Advance Tax is Due!
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-slate-800 mb-2">Installment Schedule</h4>
                  <table className="w-full text-sm text-left">
                    <tbody className="divide-y divide-slate-100">
                      <tr><td className="py-2 text-slate-500">By 15 Jun (15%)</td><td className="py-2 font-semibold text-right">₹{results.junDue.toLocaleString('en-IN')}</td></tr>
                      <tr><td className="py-2 text-slate-500">By 15 Sep (45%)</td><td className="py-2 font-semibold text-right">₹{results.sepDue.toLocaleString('en-IN')}</td></tr>
                      <tr><td className="py-2 text-slate-500">By 15 Dec (75%)</td><td className="py-2 font-semibold text-right text-[#1678fb]">₹{results.decDue.toLocaleString('en-IN')}</td></tr>
                      <tr><td className="py-2 text-slate-500">By 15 Mar (100%)</td><td className="py-2 font-semibold text-right">₹{results.marDue.toLocaleString('en-IN')}</td></tr>
                    </tbody>
                  </table>
                </div>
                
                <Link href="/login" className="w-full flex justify-center items-center gap-2 rounded bg-[#1678fb] px-4 py-3.5 text-sm font-semibold text-white shadow hover:bg-blue-600 transition-colors mt-6">
                  Pay Advance Tax Now <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* RICH CONTENT & SEO SECTION */}
      <section className="bg-white border-t border-slate-200 py-16">
        <div className="max-w-4xl mx-auto px-6 text-slate-700 space-y-12">
          
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">What is Advance Tax?</h2>
            <p className="leading-relaxed">
              Advance tax is a system of income tax payment in which taxpayers pay their estimated tax liability in installments throughout the financial year rather than making a lump-sum payment at the end of the year. It aims to reduce the tax burden on the taxpayers by enabling them to pay as they earn instead of paying a hefty sum at the end, and it also gives the government a steady flow of revenue throughout the year.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">What is Advance Tax Calculator?</h2>
            <p className="leading-relaxed">
              Advance Tax Calculator is a tool that helps taxpayers to calculate your advance tax liability with ease. You just need to input the details like residential status, income details, deductions, taxes deducted and advance taxes already paid and it will auto-calculate the advance tax liability for the quarter. This calculator simplifies the process of planning for advance tax payments, ensuring compliance with tax regulations and helping taxpayers manage their finances more effectively.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">What are the Due Dates for Advance Tax?</h2>
            <p className="mb-4 text-sm text-slate-500">The due dates for the Advance tax payment is as follows:</p>
            <div className="overflow-x-auto border border-slate-200 rounded-lg mb-8">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-4 font-bold text-slate-900">Due Date</th>
                    <th className="p-4 font-bold text-slate-900">Advance Tax Payment Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr><td className="p-4">On or before 15th June</td><td className="p-4">15% of advance tax</td></tr>
                  <tr><td className="p-4">On or before 15th September</td><td className="p-4">45% of advance tax (-) advance tax already paid</td></tr>
                  <tr><td className="p-4 font-semibold text-[#1678fb]">On or before 15th December</td><td className="p-4">75% of advance tax (-) advance tax already paid</td></tr>
                  <tr><td className="p-4">On or before 15th March</td><td className="p-4">100% of advance tax (-) advance tax already paid</td></tr>
                </tbody>
              </table>
            </div>

            <p className="mb-4 text-sm font-semibold text-slate-700">For taxpayers who have opted for Presumptive Taxation Scheme under sections 44AD & 44ADA – Business Income</p>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-4 font-bold text-slate-900">Due Date</th>
                    <th className="p-4 font-bold text-slate-900">Advance Tax Payment Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr><td className="p-4">On or before 15th March</td><td className="p-4">100% of advance tax</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">How to Use the Advance Tax Calculator?</h2>
            <ul className="list-disc pl-5 space-y-3 leading-relaxed text-slate-600">
              <li><strong>Step 1:</strong> Choose the assessee type, age group and residential status applicable to you and click "Go to Next Step".</li>
              <li><strong>Step 2:</strong> Input all your Income details and click on "Go to Next Step".</li>
              <li><strong>Step 3:</strong> Enter your tax-saving investments under Section 80C, 80D, 80E, 80G, 80TTA and other deductions available to you.</li>
              <li><strong>Step 4:</strong> Enter all the details of the taxes deducted during the year and the advance tax already paid in the previous instalments, and click "Calculate."</li>
              <li><strong>Step 5:</strong> The summary of your advance tax liability as per the new and old regimes will be displayed.</li>
            </ul>
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
