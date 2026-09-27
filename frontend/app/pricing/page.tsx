"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Shield, Clock, Zap, Star } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';

const plans = [
  {
    name: "Basic",
    target: "Salaried Professionals",
    price: "₹1,499",
    tagline: "File in 24 hrs",
    badge: null,
    covers: [
      { text: "Salary <50L, Rental & Interest", included: true },
      { text: "CG : MFs, Stocks, Crypto", included: false },
      { text: "FnO & Intraday", included: false },
      { text: "Business Income", included: false },
      { text: "ESOPs & RSUs", included: false },
      { text: "US Stocks & Foreign Income", included: false },
      { text: "Fast DS Declaration", included: false },
    ],
    benefits: [
      { text: "Late Filing Handled end-to-end" },
      { text: "Instant Filing 24hrs Guaranteed" },
      { text: "Maximum Tax Savings Avg. ₹26,686" },
      { text: "Real-time Tax Consultation 30mins" },
    ]
  },
  {
    name: "Premium",
    target: "TRADERS AND FREELANCERS",
    price: "₹2,999",
    tagline: "Most Popular",
    badge: "Popular",
    popular: true,
    covers: [
      { text: "Salary, Rental & Interest", included: true },
      { text: "CG : MFs, Stocks, Crypto", included: true },
      { text: "FnO & Intraday", included: true },
      { text: "Freelance income", included: true },
      { text: "ESOPs & RSUs", included: false },
      { text: "US Stocks & Foreign Income", included: false },
      { text: "Fast DS Declaration", included: false },
    ],
    benefits: [
      { text: "Everything in Basic", highlight: true },
      { text: "Live Tax Filing 45 mins" },
      { text: "Instant Filing 24hrs Guaranteed" },
      { text: "Accuracy Check (AI + Expert) 100%" },
      { text: "Maximum Tax Refunds Avg. ₹30,990" },
    ]
  },
  {
    name: "Elite",
    target: "GLOBAL WEALTH BUILDERS",
    price: "₹4,999",
    tagline: "Investors Favourite",
    badge: "Investors Favourite",
    covers: [
      { text: "Salary, Rental & Interest", included: true },
      { text: "CG : MFs, Stocks, Crypto", included: true },
      { text: "FnO & Intraday", included: true },
      { text: "Business Income > 50 L", included: true },
      { text: "ESOPs & RSUs", included: true },
      { text: "US Stocks & Foreign Income", included: true },
      { text: "Fast DS Declaration", included: false },
    ],
    benefits: [
      { text: "Everything in Premium", highlight: true },
      { text: "Priority Filing 72hrs Guaranteed" },
      { text: "Live Tax Savings Advisory 120mins" },
      { text: "Protect ESOP/RSU Gains No Penalty" },
      { text: "Accurate Schedule FA Filing 100%" },
      { text: "Maximum Tax Refunds Avg. ₹46,882" },
    ]
  },
  {
    name: "Luxe",
    target: "MAXIMISE WEALTH",
    price: "₹9,999",
    tagline: "Year-Round Peace of mind",
    badge: "VIP",
    covers: [
      { text: "Salary, Rental & Interest", included: true },
      { text: "CG : MFs, Stocks, Crypto", included: true },
      { text: "FnO & Intraday", included: true },
      { text: "Business Income (Any range)", included: true },
      { text: "ESOPs & RSUs", included: true },
      { text: "US Stocks & Foreign Income", included: true },
      { text: "Fast DS Declaration", included: true },
    ],
    benefits: [
      { text: "Everything in Elite", highlight: true },
      { text: "Past Tax Saving Unlocked ~₹1L/Y" },
      { text: "Wealth Tax Advisory Year Round" },
      { text: "Protect Investments No Extra Tax" },
      { text: "Advance Tax filing Zero Penalty" },
      { text: "HUF Evaluation Save ~₹1.2L/Y" },
    ]
  }
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-border/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex gap-4">
            <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 px-4 py-2">Log in</Link>
            <Link href="/signup" className="text-sm font-semibold bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-lg transition-colors shadow-sm">Sign up</Link>
          </div>
        </div>
      </header>
      
      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-6"
            >
              Expert-Assisted Tax Filing
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-slate-600"
            >
              Sit back and relax. Let our top-tier CAs handle your complex taxes, guarantee maximum refunds, and protect you from notices.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-white rounded-3xl p-6 xl:p-8 flex flex-col border ${
                  plan.popular 
                    ? 'border-emerald-500 shadow-2xl shadow-emerald-500/10 scale-[1.02] z-10' 
                    : 'border-slate-200 shadow-xl shadow-slate-200/40 hover:border-emerald-200 transition-colors'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 shadow-sm
                      ${plan.popular ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' : 'bg-slate-800 text-white'}`}>
                      {plan.name === 'Luxe' ? <Star size={14} className="fill-amber-400 text-amber-400" /> : <Zap size={14} className="fill-white" />}
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-6 mt-2">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">{plan.target}</h3>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-3xl font-extrabold text-slate-900">{plan.name}</span>
                  </div>
                  <p className="text-sm text-emerald-600 font-semibold">{plan.tagline}</p>
                </div>

                <div className="mb-8">
                  <span className="text-4xl font-black text-slate-900 tracking-tight">{plan.price}</span>
                  <span className="text-slate-500 text-sm ml-1">/ year</span>
                </div>

                <button className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm transition-all mb-8 shadow-sm ${
                  plan.popular 
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md' 
                    : 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-md'
                }`}>
                  Buy now
                </button>

                <div className="flex-1 space-y-8">
                  {/* Covers section */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Covers Income From</h4>
                    <ul className="space-y-3">
                      {plan.covers.map((item, i) => (
                        <li key={i} className={`flex items-start gap-3 text-sm ${item.included ? 'text-slate-700' : 'text-slate-400'}`}>
                          {item.included ? (
                            <Check size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                          ) : (
                            <X size={18} className="text-slate-300 shrink-0 mt-0.5" />
                          )}
                          <span className={item.included ? 'font-medium' : ''}>{item.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Benefits section */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">NexTax Benefits</h4>
                    <ul className="space-y-3">
                      {plan.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <Shield size={18} className={benefit.highlight ? 'text-amber-500 shrink-0 mt-0.5' : 'text-slate-400 shrink-0 mt-0.5'} />
                          <span className={`${benefit.highlight ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>
                            {benefit.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100">
                  <button className="text-emerald-600 text-sm font-semibold hover:text-emerald-700 w-full text-center flex justify-center items-center gap-1 transition-colors">
                    View full details
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
          
        </div>
      </main>

    </div>
  );
}
