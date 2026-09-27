"use client";
import Link from 'next/link';
import { ArrowLeft, Target, Users, Shield, Zap } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-[#1678fb] transition-colors font-semibold text-sm">
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-block bg-blue-100 text-blue-800 font-semibold px-3 py-1 rounded-full text-xs mb-6">OUR STORY</div>
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900 leading-tight">
          Simplifying taxes for the modern Indian workforce.
        </h1>
        <p className="text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
          At NexTax, we believe that filing your taxes shouldn't require a degree in finance. We are a fast-growing financial technology company dedicated to making tax compliance automated, accurate, and stress-free.
        </p>
      </section>

      {/* Main Content */}
      <section className="max-w-5xl mx-auto px-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="p-12 border-b md:border-b-0 md:border-r border-slate-200">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                <Target size={24} />
              </div>
              <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
              <p className="text-slate-600 leading-relaxed">
                We are on a mission to democratize financial compliance. By combining cutting-edge AI with deep tax expertise, we help individuals and small businesses navigate the complex Indian tax landscape, ensuring they claim maximum refunds while staying 100% compliant.
              </p>
            </div>
            <div className="p-12">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-6">
                <Users size={24} />
              </div>
              <h2 className="text-2xl font-bold mb-4">Who We Are</h2>
              <p className="text-slate-600 leading-relaxed">
                Founded in 2021 by a group of passionate Chartered Accountants and Software Engineers, NexTax has quickly grown into a trusted platform for thousands of taxpayers. We are a mid-sized team of 40+ dedicated professionals based in New Delhi, working every day to refine our tax engines.
              </p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 border-t border-slate-200">
            <div className="p-12 border-b md:border-b-0 md:border-r border-slate-200">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-6">
                <Shield size={24} />
              </div>
              <h2 className="text-2xl font-bold mb-4">Authorized & Secure</h2>
              <p className="text-slate-600 leading-relaxed">
                NexTax is an officially registered E-Return Intermediary (ERI) with the Income Tax Department of India. This means we are directly integrated with government servers using robust 256-bit encryption, ensuring your data never falls into the wrong hands.
              </p>
            </div>
            <div className="p-12">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 mb-6">
                <Zap size={24} />
              </div>
              <h2 className="text-2xl font-bold mb-4">The NexTax Advantage</h2>
              <p className="text-slate-600 leading-relaxed">
                Unlike traditional, manual filing processes, our smart platform auto-reads Form 16, connects with your AIS/26AS, and instantly compares regimes. What used to take hours now takes minutes, with zero math required on your end.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 mt-24 text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to experience seamless filing?</h2>
        <Link href="/login" className="inline-block bg-[#1678fb] text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-blue-600 transition-colors">
          Join NexTax Today
        </Link>
      </section>
    </div>
  );
}
