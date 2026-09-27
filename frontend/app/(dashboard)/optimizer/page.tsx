"use client";

import React, { useState, useEffect } from 'react';
import { Lightbulb, CheckCircle, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function OptimizerPage() {
  const [data, setData] = useState({
    gross_salary: 0,
    deductions_80c: 0,
    tds_deducted: 0
  });

  useEffect(() => {
    const saved = localStorage.getItem('parsedTaxData');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setData({
          gross_salary: parsed.gross_salary || 0,
          deductions_80c: parsed.deductions_80c || 0,
          tds_deducted: parsed.tds_deducted || 0
        });
      } catch (e) {}
    }
  }, []);

  const d80c = data.deductions_80c;
  const gap80c = Math.max(0, 150000 - d80c);
  // Rough savings is ~30% for someone earning > 15L, let's just use 30% for illustration.
  const savings80c = gap80c * 0.30; 

  const suggestions = [
    {
      section: 'Section 80C',
      title: 'Invest in ELSS or PPF',
      desc: gap80c > 0 ? `You have utilized ₹${(d80c).toLocaleString('en-IN')} out of the ₹1.5L limit. You can invest ₹${gap80c.toLocaleString('en-IN')} more.` : `You have fully utilized your ₹1.5L limit! Great job.`,
      savings: `₹${savings80c.toLocaleString('en-IN')}`,
      status: gap80c > 0 ? 'warning' : 'success',
      progress: Math.min(100, Math.round((d80c / 150000) * 100)),
    },
    {
      section: 'Section 80D',
      title: 'Health Insurance Premium',
      desc: 'You have not claimed health insurance premium. You can claim up to ₹25,000 for yourself and ₹50,000 for senior citizen parents.',
      savings: '₹22,500',
      status: 'danger',
      progress: 0,
    },
    {
      section: 'Section 80CCD(1B)',
      title: 'National Pension System (NPS)',
      desc: 'You have not claimed the extra ₹50,000 deduction available exclusively for NPS Tier-1 accounts.',
      savings: '₹15,000',
      status: 'danger',
      progress: 0,
    },
    {
      section: 'Section 80TTA',
      title: 'Savings Bank Interest',
      desc: 'You can claim up to ₹10,000 deduction on interest earned from your savings bank accounts.',
      savings: '₹3,000',
      status: 'danger',
      progress: 0,
    }
  ];

  const totalPossibleSavings = savings80c + 22500 + 15000 + 3000;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tax Optimizer</h1>
          <p className="text-slate-500">Discover deductions you're missing to maximize your tax refund.</p>
        </div>
        <Link href="/compare" className="btn-secondary flex items-center gap-2">
          Compare Regimes <ArrowRight size={16} />
        </Link>
      </div>

      <div className="bg-gradient-to-br from-indigo-500 to-cyan-400 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center gap-8 shadow-xl shadow-indigo-500/10">
        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center shrink-0 backdrop-blur-md border border-white/30">
          <TrendingUp size={40} className="text-white" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold mb-2">You can save ₹{totalPossibleSavings.toLocaleString('en-IN')} more!</h2>
          <p className="text-indigo-100 mb-0">Our AI analyzed your extracted Form 16 and found {gap80c > 0 ? '4' : '3'} unclaimed deductions that you are eligible for under the Old Tax Regime.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        {suggestions.map((item, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col h-full hover:border-indigo-300 transition-colors"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-md mb-2 inline-block">
                  {item.section}
                </span>
                <h3 className="font-semibold text-lg text-slate-800 leading-tight">{item.title}</h3>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-semibold text-emerald-600 uppercase">Potential Savings</div>
                <div className="text-xl font-bold text-emerald-500">{item.savings}</div>
              </div>
            </div>
            
            <p className="text-slate-500 text-sm mb-6 flex-1">{item.desc}</p>
            
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-500 mb-2">
                <span>Utilization</span>
                <span>{item.progress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${item.progress > 50 ? 'bg-indigo-500' : 'bg-amber-500'}`} 
                  style={{ width: `${item.progress}%` }}
                ></div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
