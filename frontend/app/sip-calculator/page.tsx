"use client";
import React, { useState } from 'react';
import Link from 'next/link';

export default function SIPCalculator() {
  const [investment, setInvestment] = useState<number | ''>('');
  const [rate, setRate] = useState<number | ''>('');
  const [years, setYears] = useState<number | ''>('');

  const currentInvestment = Number(investment) || 0;
  const currentRate = Number(rate) || 0;
  const currentYears = Number(years) || 0;

  const months = currentYears * 12;
  const i = currentRate / 100 / 12;
  const futureValue = currentInvestment * ((Math.pow(1 + i, months) - 1) / (i || 1)) * (1 + i);
  const investedAmount = currentInvestment * months;
  const estReturns = futureValue - investedAmount;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-primary hover:underline mb-8 inline-block">&larr; Back to Home</Link>
        <h1 className="text-3xl font-bold text-slate-800 mb-8">SIP Calculator</h1>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Monthly Investment (₹)</label>
              <input type="number" value={investment} onChange={e => setInvestment(e.target.value === '' ? '' : Number(e.target.value))} className="w-full border p-3 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Expected Return Rate (p.a %)</label>
              <input type="number" value={rate} onChange={e => setRate(e.target.value === '' ? '' : Number(e.target.value))} className="w-full border p-3 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Time Period (Years)</label>
              <input type="number" value={years} onChange={e => setYears(e.target.value === '' ? '' : Number(e.target.value))} className="w-full border p-3 rounded-lg" />
            </div>
          </div>
          <div className="bg-slate-900 p-8 rounded-2xl text-white shadow-xl flex flex-col justify-center space-y-6">
            <div>
              <p className="text-slate-400 text-sm">Invested Amount</p>
              <p className="text-2xl font-bold">₹{Math.round(investedAmount).toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Est. Returns</p>
              <p className="text-2xl font-bold text-emerald-400">?{Math.round(estReturns).toLocaleString('en-IN')}</p>
            </div>
            <div className="pt-4 border-t border-slate-700">
              <p className="text-slate-400 text-sm">Total Value</p>
              <p className="text-4xl font-bold">?{Math.round(futureValue).toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
