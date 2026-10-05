"use client";

import { motion } from 'framer-motion';
import { Search, Bot, PhoneCall, ChevronRight, FileText, Landmark, Building2, Briefcase, Calculator, Users, SearchCheck, MessageSquare, ShieldCheck, Award, Clock, DollarSign, UploadCloud, CheckCircle2, BotMessageSquare, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';

export default function LandingPage() {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const router = useRouter();

  const handleChatSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    router.push('/chat');
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* HEADER */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Logo />
          </Link>
          
          <nav className="hidden lg:flex items-center gap-8 text-[14px] font-medium text-slate-600">
            <Link href="/" className="text-indigo-600 font-semibold">Home</Link>
            <Link href="/upload" className="hover:text-indigo-600 transition-colors">Services</Link>
            <Link href="/tax-calculator" className="hover:text-indigo-600 transition-colors">Calculators</Link>
            <Link href="/tax-calculator" className="hover:text-indigo-600 transition-colors">Resources</Link>
            <Link href="/chat" className="hover:text-indigo-600 transition-colors flex items-center gap-1.5">
               <Sparkles size={14} className="text-amber-500" />
               AI Assistant
            </Link>
            <Link href="/about" className="hover:text-indigo-600 transition-colors">Company</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden sm:flex text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors py-2 px-2">
              Log in
            </Link>
            <Link href="/login" className="hidden md:flex items-center gap-2 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-all py-2.5 px-5 rounded-lg shadow-md shadow-slate-900/10">
              Get Started <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-[72px]">
        {/* HERO SECTION - Deep Slate */}
        <section className="bg-[#0A0F1C] relative overflow-hidden pb-56 pt-20 lg:pt-28 px-6">
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgNDBoNDBWMEgwem0zOS0xVjFoLTM4djM4eiIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIwLjAyNSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-50"></div>
          
          {/* Radial Gradient Glow */}
          <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none"></div>

          <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 relative z-10">
            {/* Left Content */}
            <div className="lg:col-span-7 pt-4 xl:pt-12">
              <motion.div 
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-xs font-semibold mb-6 tracking-wide uppercase"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Sparkles size={14} />
                Next Generation Tax Platform
              </motion.div>
              
              <motion.h1 
                className="text-5xl md:text-6xl lg:text-[64px] font-extrabold mb-6 text-white leading-[1.05] tracking-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                Your CA.<br/>
                Your Tax Advisor.<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Your AI Assistant.</span>
              </motion.h1>
              
              <motion.p 
                className="text-slate-400 text-lg md:text-xl max-w-lg mb-10 font-normal leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Smart, automated solutions for a completely tax-compliant and stress-free financial life. Built for modern businesses and individuals.
              </motion.p>
              
              <motion.div 
                className="flex flex-wrap items-center gap-8 border-t border-white/10 pt-8 mt-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div>
                  <div className="text-white font-bold text-2xl tracking-tight">AI-Powered</div>
                  <div className="text-slate-400 text-sm font-medium mt-0.5">Tax Engine</div>
                </div>
                <div className="w-px h-10 bg-white/10"></div>
                <div>
                  <div className="text-white font-bold text-2xl tracking-tight">100%</div>
                  <div className="text-slate-400 text-sm font-medium mt-0.5">CA Experts</div>
                </div>
                <div className="w-px h-10 bg-white/10"></div>
                <div>
                  <div className="text-white font-bold text-2xl tracking-tight">Minutes</div>
                  <div className="text-slate-400 text-sm font-medium mt-0.5">To File Returnsrience</div>
                </div>
              </motion.div>
            </div>
            
            {/* Right Content - Modern Glassmorphism AI Card */}
            <div className="lg:col-span-5 relative flex justify-center lg:justify-end items-center">
              <motion.div 
                className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] rounded-3xl p-8 w-full max-w-[420px] relative z-20"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
              >
                <div className="absolute -top-6 left-8 w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30 rotate-3">
                  <Bot className="text-white w-7 h-7 -rotate-3" />
                </div>
                
                <div className="mt-8 mb-8">
                  <h3 className="text-white text-2xl font-bold mb-3 tracking-tight">Meet your AI Tax Expert</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Instantly resolve queries about Income Tax, GST, TDS, ITR, Compliance, Notices, and more. Available 24/7.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <Link 
                    href="/chat"
                    className="w-full flex items-center justify-center gap-2 bg-white text-slate-900 font-semibold py-3.5 rounded-xl hover:bg-slate-100 transition-all shadow-md active:scale-[0.98]"
                  >
                    Start AI Chat
                    <MessageSquare size={18} className="text-slate-700" />
                  </Link>
                  
                  <div className="flex items-center gap-4 py-1">
                    <div className="flex-1 h-px bg-white/10"></div>
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">or</span>
                    <div className="flex-1 h-px bg-white/10"></div>
                  </div>
                  
                  <Link href="/contact" className="w-full flex items-center justify-center gap-2 bg-transparent border border-white/20 text-white font-semibold py-3.5 rounded-xl hover:bg-white/5 transition-all active:scale-[0.98]">
                    <PhoneCall size={18} className="text-indigo-400" />
                    Talk to a Real CA
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* MAIN OVERLAPPING GRID */}
        <section className="max-w-7xl mx-auto px-6 -mt-40 relative z-30 mb-16">
          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* LATEST TAX UPDATES - Clean List */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-200/60 p-7 lg:w-[380px] shrink-0 flex flex-col h-[560px]">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-bold text-slate-900 text-xl tracking-tight">Tax Updates</h3>
                <Link href="/tax-calculator" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">View All</Link>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                {[
                  { tag: 'Income Tax', title: 'CBDT Extends Due Date for Filing ITR for AY 2025-26', date: 'May 22, 2024', color: 'text-blue-600 bg-blue-50 ring-blue-500/20' },
                  { tag: 'GST', title: 'GST Council Recommends Changes in Return Filing Rules', date: 'May 21, 2024', color: 'text-purple-600 bg-purple-50 ring-purple-500/20' },
                  { tag: 'Finance', title: 'TDS on Rent: New Rule Clarification by CBDT', date: 'May 20, 2024', color: 'text-emerald-600 bg-emerald-50 ring-emerald-500/20' },
                  { tag: 'Income Tax', title: 'New ITR Forms Notified for FY 2024-25', date: 'May 18, 2024', color: 'text-blue-600 bg-blue-50 ring-blue-500/20' },
                ].map((update, i) => (
                  <Link href="/tax-calculator" key={i} className="flex gap-4 group cursor-pointer border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex-shrink-0 flex items-center justify-center border border-slate-100 group-hover:border-indigo-200 group-hover:bg-indigo-50 transition-colors">
                       <FileText className="text-slate-400 group-hover:text-indigo-600 w-5 h-5 transition-colors" />
                    </div>
                    <div>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ring-1 ring-inset ${update.color}`}>{update.tag}</span>
                      <h4 className="text-[15px] font-semibold text-slate-800 mt-2.5 mb-1.5 group-hover:text-indigo-600 leading-snug transition-colors">{update.title}</h4>
                      <div className="text-xs text-slate-500 font-medium">{update.date}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* EXPLORE OUR SERVICES - Bento Grid */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-200/60 p-7 flex-1 lg:h-[560px] flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-bold text-slate-900 text-xl tracking-tight">Explore Services</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 flex-1">
                {[
                  { icon: <FileText size={22}/>, title: 'Income Tax', desc: 'ITR Filing & Planning', href: '/upload', color: 'text-blue-600', bg: 'bg-blue-50' },
                  { icon: <Landmark size={22}/>, title: 'GST Services', desc: 'Registration & Returns', href: '/contact', color: 'text-purple-600', bg: 'bg-purple-50' },
                  { icon: <Calculator size={22}/>, title: 'TDS Services', desc: 'TDS Filing & Compliance', href: '/contact', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { icon: <Building2 size={22}/>, title: 'Company Setup', desc: 'Private, LLP, OPC', href: '/contact', color: 'text-amber-600', bg: 'bg-amber-50' },
                  { icon: <Briefcase size={22}/>, title: 'Accounting', desc: 'Monthly Bookkeeping', href: '/contact', color: 'text-rose-600', bg: 'bg-rose-50' },
                  { icon: <SearchCheck size={22}/>, title: 'Audit', desc: 'Statutory & Tax Audit', href: '/contact', color: 'text-cyan-600', bg: 'bg-cyan-50' },
                  { icon: <ShieldCheck size={22}/>, title: 'Notice Handling', desc: 'Scrutiny & Appeals', href: '/contact', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { icon: <Users size={22}/>, title: 'Consultation', desc: 'Startups & MSME', href: '/contact', color: 'text-slate-700', bg: 'bg-slate-100' },
                ].map((service, i) => (
                  <Link href={service.href} key={i} className="group p-5 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-900/5 transition-all flex flex-col bg-slate-50/50 hover:bg-white">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${service.bg} ${service.color} transition-transform group-hover:scale-110`}>
                      {service.icon}
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1.5">{service.title}</h4>
                    <p className="text-[13px] text-slate-500 font-medium leading-relaxed">{service.desc}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* TRUST BANNER - Modern minimal */}
        <section className="max-w-7xl mx-auto px-6 mb-24">
          <div className="bg-white border border-slate-200/60 shadow-sm rounded-2xl py-8 px-8 grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-4 divide-x divide-slate-100">
            {[
              { icon: <ShieldCheck className="text-indigo-600 w-6 h-6" />, title: '100% Secure', desc: 'Bank-grade encryption' },
              { icon: <Users className="text-indigo-600 w-6 h-6" />, title: 'Expert Team', desc: 'Qualified CA partners' },
              { icon: <Sparkles className="text-indigo-600 w-6 h-6" />, title: 'AI Powered', desc: 'Smart tax optimization' },
              { icon: <Clock className="text-indigo-600 w-6 h-6" />, title: 'On-Time', desc: 'Zero deadline misses' },
              { icon: <DollarSign className="text-indigo-600 w-6 h-6" />, title: 'Transparent', desc: 'No hidden pricing' },
            ].map((feature, i) => (
              <div key={i} className={`flex flex-col items-center text-center ${i !== 0 ? 'pl-4' : ''}`}>
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-3">
                  {feature.icon}
                </div>
                <div className="text-slate-900 text-sm font-bold mb-1">{feature.title}</div>
                <div className="text-slate-500 text-xs font-medium">{feature.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS - Clean corporate layout */}
        <section className="max-w-7xl mx-auto px-6 mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">How it works</h2>
            <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">Get your taxes filed in four simple steps without ever leaving your home.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
             {/* Connection Line */}
             <div className="hidden md:block absolute top-8 left-[10%] w-[80%] h-px bg-slate-200 -z-10"></div>
             
             {[
               { num: '01', icon: <MessageSquare size={24}/>, title: 'Consultation', desc: 'Discuss requirements with our expert team securely.' },
               { num: '02', icon: <UploadCloud size={24}/>, title: 'Upload Data', desc: 'Upload your documents to our encrypted portal.' },
               { num: '03', icon: <Bot size={24}/>, title: 'AI + CA Review', desc: 'Our AI and CAs work together to optimize your return.' },
               { num: '04', icon: <CheckCircle2 size={24}/>, title: 'Filing Done', desc: 'Download your acknowledgement instantly.' },
             ].map((step, i) => (
               <div key={i} className="relative flex flex-col items-center text-center group">
                 <div className="w-16 h-16 bg-white border-2 border-slate-100 shadow-sm rounded-full flex items-center justify-center mb-6 text-indigo-600 group-hover:border-indigo-600 group-hover:text-white group-hover:bg-indigo-600 transition-all duration-300">
                   {step.icon}
                 </div>
                 <div className="text-xs font-bold text-indigo-600 mb-2 tracking-widest">{step.num}</div>
                 <h4 className="font-bold text-slate-900 text-lg mb-2">{step.title}</h4>
                 <p className="text-sm text-slate-500 font-medium leading-relaxed px-4">{step.desc}</p>
               </div>
             ))}
          </div>
        </section>
      </main>

      {/* FLOATING CHAT WIDGET - Intercom Style */}
      <div className={`fixed bottom-24 right-6 w-[360px] bg-white rounded-2xl shadow-[0_12px_40px_-12px_rgba(0,0,0,0.2)] border border-slate-200 overflow-hidden z-50 transition-all duration-300 origin-bottom-right flex flex-col ${chatOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}`}>
         {/* Chat Header */}
         <div className="bg-slate-900 p-5 pb-8 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Logo size="sm" className="[&_span]:text-white" />
              </div>
              <button onClick={() => setChatOpen(false)} className="text-white/70 hover:text-white transition-colors bg-white/10 rounded-full p-1.5">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 1L1 13M1 1L13 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
            <h3 className="text-white text-xl font-bold tracking-tight">Hi there 👋</h3>
            <p className="text-white/80 text-sm font-medium mt-1">How can our AI help you today?</p>
         </div>
         
         {/* Chat Body overlapping header slightly */}
         <div className="px-5 pb-5 -mt-4 flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
               <div className="p-4 border-b border-slate-50">
                 <div className="flex gap-3 mb-2">
                   <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                     <Bot size={16} className="text-indigo-600" />
                   </div>
                   <div className="bg-slate-50 rounded-2xl rounded-tl-none p-3 text-sm text-slate-700 font-medium">
                     I'm your virtual tax assistant. Choose an option below or type a message.
                   </div>
                 </div>
               </div>
               
               <div className="p-2 space-y-1 bg-slate-50/50">
                 {['File my Income Tax Return', 'Help with GST Registration', 'I received an IT Notice', 'Talk to a human CA'].map((q, i) => (
                   <button 
                     key={i} 
                     onClick={() => router.push('/chat')}
                     className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-100 text-sm font-medium text-slate-700 flex items-center justify-between group transition-colors"
                   >
                     {q}
                     <ChevronRight size={14} className="text-slate-400 group-hover:text-slate-700 transition-colors" />
                   </button>
                 ))}
               </div>
            </div>
         </div>
         
         {/* Chat Input */}
         <form onSubmit={handleChatSubmit} className="px-5 pb-5 pt-2 bg-white">
           <div className="flex items-center gap-2 border border-slate-200 rounded-full px-4 py-2 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all shadow-sm">
             <input 
               type="text" 
               value={chatInput}
               onChange={(e) => setChatInput(e.target.value)}
               placeholder="Ask a question..." 
               className="flex-1 bg-transparent border-none outline-none text-sm text-slate-900 placeholder:text-slate-400 font-medium h-8" 
             />
             <button type="submit" className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-indigo-700 transition-colors shrink-0">
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
             </button>
           </div>
         </form>
      </div>
      
      {/* Floating Trigger Button */}
      <button 
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-slate-900 text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-center hover:scale-105 hover:bg-slate-800 transition-all z-40 active:scale-95"
      >
        {chatOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        ) : (
          <MessageSquare size={26} />
        )}
      </button>

    </div>
  );
}
