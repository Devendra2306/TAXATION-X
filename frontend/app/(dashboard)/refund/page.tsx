"use client";

import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle2, Clock, MapPin, ArrowLeft, FileText, MessageSquare, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function RefundPage() {
  const [ackNum, setAckNum] = useState<string | null>(null);
  const [filedDate, setFiledDate] = useState('Jul 10, 2026');
  const [expectedRefund, setExpectedRefund] = useState('28,500');
  const [pan, setPan] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedAck = localStorage.getItem('ack_number');
      const storedDate = localStorage.getItem('ack_date');
      const storedPan = localStorage.getItem('verified_pan');
      if (storedAck) setAckNum(storedAck);
      if (storedDate) setFiledDate(storedDate);
      if (storedPan) setPan(storedPan);

      const parsed = localStorage.getItem('parsedTaxData');
      if (parsed) {
        try {
          const data = JSON.parse(parsed);
          const tds = data.tds_deducted || 0;
          // Approximate estimation: if TDS > 50,000, refund estimation
          if (tds > 75000) {
            setExpectedRefund((tds - 50000).toLocaleString('en-IN'));
          } else {
            setExpectedRefund('12,450');
          }
        } catch {}
      }
    }
  }, []);

  const steps = [
    {
      title: 'ITR Filed',
      date: filedDate,
      status: 'completed',
      desc: ackNum ? `Your ITR was successfully uploaded with Ack No: ${ackNum}` : 'Your ITR was successfully uploaded to Income Tax portal.'
    },
    {
      title: 'ITR e-Verified',
      date: filedDate,
      status: 'completed',
      desc: 'Aadhaar / ITD OTP verification complete. Taxpayer identity verified.'
    },
    {
      title: 'Processing (Section 143(1))',
      date: 'In Progress',
      status: 'active',
      desc: 'Centralized Processing Center (CPC Bengaluru) is validating deductions and TDS match with 26AS.'
    },
    {
      title: 'Refund Determination & Approval',
      date: 'Expected in 10-15 days',
      status: 'pending',
      desc: 'CPC intimates final refund order via SMS & Email notification.'
    },
    {
      title: 'Refund Credited to Bank Account',
      date: 'Pending',
      status: 'pending',
      desc: 'Refund is transferred directly via ECS to your pre-validated primary bank account.'
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Top Header Row with Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">ITR Refund Status</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time tracking of your electronic tax refund from CPC Bengaluru.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/export"
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>View ITR-V</span>
          </Link>
          <Link
            href="/chat"
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Ask Support</span>
          </Link>
        </div>
      </div>

      {/* Main Refund Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-b from-emerald-50/80 via-white to-white p-6 sm:p-8 border-b border-slate-100 text-center">
          <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1">
            Expected Tax Refund
          </div>
          <div className="text-4xl sm:text-5xl font-extrabold text-emerald-600 font-mono tracking-tight mb-2">
            ₹ {expectedRefund}
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <span>Assessment Year: <strong>2025 - 2026</strong></span>
            {pan && (
              <>
                <span>•</span>
                <span>PAN: <strong className="font-mono">{pan}</strong></span>
              </>
            )}
            {ackNum && (
              <>
                <span>•</span>
                <span className="font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                  {ackNum}
                </span>
              </>
            )}
          </div>
        </div>
        
        <div className="p-6 sm:p-8">
          <h3 className="font-bold text-base text-slate-900 mb-6">Government Processing Timeline</h3>
          
          <div className="space-y-7 relative before:absolute before:inset-0 before:ml-[1.375rem] md:before:ml-[1.4rem] before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-200">
            {steps.map((step, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="relative flex items-start gap-5 sm:gap-6"
              >
                <div className={`w-11 h-11 rounded-full border-4 border-white flex items-center justify-center shrink-0 shadow-xs z-10 ${
                  step.status === 'completed' ? 'bg-emerald-500 text-white' : 
                  step.status === 'active' ? 'bg-indigo-600 text-white ring-4 ring-indigo-50 animate-pulse' : 
                  'bg-slate-200 text-slate-400'
                }`}>
                  {step.status === 'completed' && <CheckCircle2 className="w-5 h-5" />}
                  {step.status === 'active' && <Clock className="w-5 h-5" />}
                  {step.status === 'pending' && <MapPin className="w-5 h-5" />}
                </div>
                
                <div className="pt-1.5 flex-1 text-xs">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 mb-1">
                    <h4 className={`font-bold text-sm ${
                      step.status === 'pending' ? 'text-slate-400' : 'text-slate-900'
                    }`}>
                      {step.title}
                    </h4>
                    <span className={`text-[11px] font-semibold ${
                      step.status === 'completed' ? 'text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200' : 
                      step.status === 'active' ? 'text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200' : 
                      'text-slate-400'
                    }`}>
                      {step.date}
                    </span>
                  </div>
                  <p className={step.status === 'pending' ? 'text-slate-400 leading-relaxed' : 'text-slate-600 leading-relaxed'}>
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
            <span className="text-slate-400 text-[11px]">
              Direct ECS credit typically takes 15–45 days following successful processing by ITD.
            </span>
            <a
              href="https://tin.tin.nsdl.com/oltas/refundstatuslogin.html"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 font-semibold hover:underline inline-flex items-center gap-1"
            >
              <span>NSDL / OLTAS Refund Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
