"use client";
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock, FileCode, CheckCircle2 } from 'lucide-react';

export default function TrustPage() {
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
        <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 font-semibold px-4 py-1.5 rounded-full text-sm mb-6">
          <ShieldCheck size={18} /> Bank-Grade Security
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900 leading-tight">
          Your data is safe with NexTax.
        </h1>
        <p className="text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
          As a registered E-Return Intermediary (ERI) authorized by the Income Tax Department of India, security and privacy are at the core of everything we build.
        </p>
      </section>

      {/* Grid Features */}
      <section className="max-w-5xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-8">
          
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex gap-6">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Lock size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">256-Bit Encryption</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                All data transmitted between your browser and our servers is secured using robust 256-bit TLS encryption. Your financial data is encrypted at rest using industry-standard AES-256 algorithms.
              </p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex gap-6">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <FileCode size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Strict Access Control</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                We employ strict role-based access control (RBAC) across our infrastructure. Your sensitive tax data is never accessible to human operators unless you explicitly request support assistance.
              </p>
            </div>
          </div>
          
        </div>
      </section>

      {/* ISO / Audits */}
      <section className="max-w-4xl mx-auto px-6 mt-16 bg-[#1e2a3b] rounded-3xl p-12 text-center text-white shadow-xl">
        <h2 className="text-2xl font-bold mb-8">Audited & Compliant</h2>
        <div className="flex flex-col md:flex-row justify-center items-center gap-12">
          <div className="flex items-center gap-3 text-slate-300">
            <CheckCircle2 className="text-emerald-400" size={24} />
            <span className="font-semibold text-lg">ISO 27001 Certified</span>
          </div>
          <div className="flex items-center gap-3 text-slate-300">
            <CheckCircle2 className="text-emerald-400" size={24} />
            <span className="font-semibold text-lg">SOC 2 Type II Audited</span>
          </div>
          <div className="flex items-center gap-3 text-slate-300">
            <CheckCircle2 className="text-emerald-400" size={24} />
            <span className="font-semibold text-lg">GDPR Compliant</span>
          </div>
        </div>
        <p className="mt-8 text-sm text-slate-400 max-w-2xl mx-auto">
          We conduct regular third-party penetration testing and vulnerability assessments to ensure our systems are immune to modern cyber threats. We pledge never to sell your PII (Personally Identifiable Information) to any third party.
        </p>
      </section>
    </div>
  );
}
