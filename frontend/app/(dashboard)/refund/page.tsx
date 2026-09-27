"use client";

import React from 'react';
import { Activity, CheckCircle2, Clock, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RefundPage() {
  const steps = [
    { title: 'ITR Filed', date: 'Jul 10, 2026', status: 'completed', desc: 'Your ITR was successfully uploaded.' },
    { title: 'ITR e-Verified', date: 'Jul 10, 2026', status: 'completed', desc: 'Aadhaar OTP verification complete.' },
    { title: 'Processing (Section 143(1))', date: 'In Progress', status: 'active', desc: 'IT Department is checking your return.' },
    { title: 'Refund Approved', date: 'Pending', status: 'pending', desc: 'Intimation order will be sent.' },
    { title: 'Refund Credited', date: 'Pending', status: 'pending', desc: 'Money sent to your pre-validated bank.' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Refund Status</h1>
        <p className="text-slate-500">Track the status of your income tax refund in real-time.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-emerald-50/50 p-8 border-b border-slate-200 text-center">
          <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Expected Refund</div>
          <div className="text-5xl font-bold text-emerald-600 mb-2">₹28,500</div>
          <p className="text-slate-600 font-medium">AY 2026-27 (FY 2025-26)</p>
        </div>
        
        <div className="p-8">
          <h3 className="font-bold text-lg text-slate-800 mb-8">Tracking Timeline</h3>
          
          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-[1.375rem] md:before:ml-[1.4rem] before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-200">
            {steps.map((step, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="relative flex items-start gap-6"
              >
                <div className={`w-11 h-11 rounded-full border-4 border-white flex items-center justify-center shrink-0 shadow-sm z-10 ${
                  step.status === 'completed' ? 'bg-emerald-500 text-white' : 
                  step.status === 'active' ? 'bg-primary text-white animate-pulse' : 
                  'bg-slate-200 text-slate-400'
                }`}>
                  {step.status === 'completed' && <CheckCircle2 size={20} />}
                  {step.status === 'active' && <Clock size={20} />}
                  {step.status === 'pending' && <MapPin size={20} />}
                </div>
                
                <div className="pt-2 flex-1">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-1">
                    <h4 className={`font-bold text-lg ${
                      step.status === 'pending' ? 'text-slate-400' : 'text-slate-800'
                    }`}>{step.title}</h4>
                    <span className={`text-sm font-medium ${
                      step.status === 'completed' ? 'text-slate-500' : 
                      step.status === 'active' ? 'text-primary' : 
                      'text-slate-400'
                    }`}>{step.date}</span>
                  </div>
                  <p className={step.status === 'pending' ? 'text-slate-400 text-sm' : 'text-slate-600 text-sm'}>
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
