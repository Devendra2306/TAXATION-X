"use client";
import React, { useState } from 'react';
import Link from 'next/link';

export default function HRACalculator() {
  const [basic, setBasic] = useState<number | ''>('');
  const [hraReceived, setHraReceived] = useState<number | ''>('');
  const [rentPaid, setRentPaid] = useState<number | ''>('');
  const [isMetro, setIsMetro] = useState(true);

  const yearlyBasic = (Number(basic) || 0) * 12;
  const yearlyHra = (Number(hraReceived) || 0) * 12;
  const yearlyRent = (Number(rentPaid) || 0) * 12;

  const rule1 = yearlyHra;
  const rule2 = Math.max(0, yearlyRent - (0.10 * yearlyBasic));
  const rule3 = isMetro ? (0.50 * yearlyBasic) : (0.40 * yearlyBasic);

  const exemptHra = Math.min(rule1, rule2, rule3);
  const taxableHra = yearlyHra - exemptHra;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-primary hover:underline mb-8 inline-block">&larr; Back to Home</Link>
        <h1 className="text-3xl font-bold text-slate-800 mb-8">HRA Exemption Calculator</h1>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Basic Salary (Monthly ₹)</label>
              <input type="number" value={basic} onChange={e => setBasic(e.target.value === '' ? '' : Number(e.target.value))} className="w-full border p-3 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">HRA Received (Monthly ₹)</label>
              <input type="number" value={hraReceived} onChange={e => setHraReceived(e.target.value === '' ? '' : Number(e.target.value))} className="w-full border p-3 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Rent Paid (Monthly ₹)</label>
              <input type="number" value={rentPaid} onChange={e => setRentPaid(e.target.value === '' ? '' : Number(e.target.value))} className="w-full border p-3 rounded-lg" />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <input type="checkbox" checked={isMetro} onChange={e => setIsMetro(e.target.checked)} id="metro" className="w-4 h-4" />
              <label htmlFor="metro" className="text-sm font-semibold text-slate-700">Do you live in a Metro city? (50% basic limit)</label>
            </div>
          </div>
          <div className="bg-slate-900 p-8 rounded-2xl text-white shadow-xl flex flex-col justify-center space-y-6">
             <h2 className="text-xl font-bold text-emerald-400">Yearly HRA Summary</h2>
            <div>
              <p className="text-slate-400 text-sm">Total HRA Received</p>
              <p className="text-2xl font-bold">?{Math.round(yearlyHra).toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Exempted HRA (Tax Free)</p>
              <p className="text-2xl font-bold text-emerald-400">?{Math.round(exemptHra).toLocaleString('en-IN')}</p>
            </div>
            <div className="pt-4 border-t border-slate-700">
              <p className="text-slate-400 text-sm">Taxable HRA</p>
              <p className="text-3xl font-bold text-rose-400">?{Math.round(taxableHra).toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
