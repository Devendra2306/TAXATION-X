"use client";
import Link from 'next/link';
import { ArrowLeft, Briefcase, MapPin, Clock } from 'lucide-react';

export default function CareersPage() {
  const jobs = [
    { title: "Senior Frontend Engineer (React/Next.js)", dept: "Engineering", type: "Full-Time", loc: "New Delhi / Remote" },
    { title: "Tax Consultant & Analyst", dept: "Operations", type: "Full-Time", loc: "New Delhi" },
    { title: "Product Designer", dept: "Design", type: "Full-Time", loc: "Remote" },
    { title: "Customer Success Manager", dept: "Support", type: "Full-Time", loc: "New Delhi" }
  ];

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
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900 leading-tight">
          Build the future of <span className="text-[#1678fb]">finance</span> with us.
        </h1>
        <p className="text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
          We are a tight-knit team of builders, designers, and tax experts. If you are passionate about solving complex problems at scale, you belong here.
        </p>
      </section>

      {/* Job Board */}
      <section className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Briefcase className="text-[#1678fb]" />
              Open Positions
            </h2>
            <p className="text-slate-500 mt-2">Join our growing team of 40+ professionals.</p>
          </div>
          
          <div className="divide-y divide-slate-100">
            {jobs.map((job, idx) => (
              <div key={idx} className="p-8 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group cursor-pointer">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-[#1678fb] transition-colors mb-2">{job.title}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                    <span className="font-semibold text-slate-700">{job.dept}</span>
                    <span className="flex items-center gap-1"><Clock size={14} /> {job.type}</span>
                    <span className="flex items-center gap-1"><MapPin size={14} /> {job.loc}</span>
                  </div>
                </div>
                <button className="px-5 py-2 rounded-lg border border-slate-200 font-semibold text-sm hover:border-[#1678fb] hover:text-[#1678fb] transition-colors">
                  Apply Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Perks */}
      <section className="max-w-4xl mx-auto px-6 mt-20 text-center">
        <h3 className="text-xl font-bold mb-8 text-slate-400 uppercase tracking-widest">Why join NexTax?</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-blue-50 border border-blue-100">
            <h4 className="font-bold text-blue-900 mb-2">Health First</h4>
            <p className="text-sm text-blue-700">Comprehensive medical insurance for you and your dependents.</p>
          </div>
          <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-100">
            <h4 className="font-bold text-emerald-900 mb-2">Work Flexibly</h4>
            <p className="text-sm text-emerald-700">Hybrid and remote-first roles to ensure a healthy work-life balance.</p>
          </div>
          <div className="p-6 rounded-xl bg-purple-50 border border-purple-100">
            <h4 className="font-bold text-purple-900 mb-2">Grow With Us</h4>
            <p className="text-sm text-purple-700">Annual learning stipend and direct mentorship from industry experts.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
