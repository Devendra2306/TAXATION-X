"use client";

import { motion } from 'framer-motion';
import { Search, Bot, PhoneCall, ChevronRight, FileText, Landmark, Building2, Briefcase, Calculator, Users, SearchCheck, MessageSquare, ShieldCheck, Award, Clock, DollarSign, UploadCloud, CheckCircle2, BotMessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const router = useRouter();

  const handleChatSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (chatInput.trim()) {
      router.push('/chat');
    } else {
      router.push('/chat');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans text-slate-800 selection:bg-amber-200">
      
      {/* HEADER */}
      <header className="fixed top-0 w-full z-50 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 xl:px-8 h-[72px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
             <div className="font-serif text-2xl font-bold flex items-center text-[#0b1b3d]">
               <div className="flex flex-col leading-none">
                 <span className="text-[#0b1b3d]">Nex<span className="text-amber-500">Tax</span></span>
                 <span className="text-[9px] font-sans font-normal text-slate-500 mt-0.5 tracking-wide">AI Powered Tax Filing</span>
               </div>
             </div>
          </Link>
          
          <nav className="hidden lg:flex items-center gap-8 text-[13px] font-semibold text-slate-700">
            <Link href="/" className="text-[#0b1b3d] border-b-2 border-amber-500 pb-1">Home</Link>
            <Link href="/upload" className="hover:text-amber-500 transition-colors">Services</Link>
            <Link href="/tax-calculator" className="hover:text-amber-500 transition-colors">Tax Updates</Link>
            <Link href="/tax-calculator" className="hover:text-amber-500 transition-colors">Resources</Link>
            <Link href="/chat" className="hover:text-amber-500 transition-colors">AI Assistant</Link>
            <Link href="/about" className="hover:text-amber-500 transition-colors">About Us</Link>
            <Link href="/contact" className="hover:text-amber-500 transition-colors">Contact Us</Link>
          </nav>

          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-600 hover:text-[#0b1b3d] rounded-full hover:bg-slate-50 transition-colors">
              <Search size={18} />
            </button>
            <Link href="/login" className="hidden sm:flex text-sm font-semibold bg-[#0b1b3d] text-white hover:bg-[#152a55] transition-colors py-2 px-6 rounded-md">
              Login / Sign Up
            </Link>
            <Link href="/contact" className="hidden md:flex text-sm font-semibold bg-[#dca850] text-white hover:bg-[#c9953d] transition-colors py-2 px-6 rounded-md">
              Book Consultation
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-[72px]">
        {/* HERO SECTION (DARK BLUE) */}
        <section className="bg-[#0b1b3d] relative overflow-hidden pb-48 pt-16 lg:pt-24 px-4 xl:px-8">
          {/* Subtle background graphics */}
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[url('https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')] bg-cover bg-center opacity-10 rounded-full mix-blend-overlay blur-sm pointer-events-none translate-x-1/3 -translate-y-1/4"></div>
          
          <div className="max-w-[1400px] mx-auto grid lg:grid-cols-2 gap-12 relative z-10">
            {/* Left Content */}
            <div className="pt-8">
              <motion.h1 
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-[1.1] font-serif"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Your CA. Your Tax Advisor.<br/>
                <span className="text-[#dca850]">Your AI Assistant.</span>
              </motion.h1>
              
              <motion.p 
                className="text-slate-300 text-lg max-w-xl mb-12 font-light leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Smart Solutions for a Tax Compliant &<br/>Stress-Free Financial Life.
              </motion.p>
              
              <motion.div 
                className="flex flex-wrap items-center gap-12 border-t border-slate-700/50 pt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center border border-slate-700">
                    <Users className="text-white w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-xl">5000+</div>
                    <div className="text-slate-400 text-xs tracking-wide">Happy Clients</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center border border-slate-700">
                    <Award className="text-white w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-xl">50+</div>
                    <div className="text-slate-400 text-xs tracking-wide">CA Experts</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center border border-slate-700">
                    <Building2 className="text-white w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-xl">10+</div>
                    <div className="text-slate-400 text-xs tracking-wide">Years of Excellence</div>
                  </div>
                </div>
              </motion.div>
            </div>
            
            {/* Right Content - AI Card */}
            <div className="relative flex justify-center lg:justify-end">
              <motion.div 
                className="bg-[#0f2452] border border-slate-700 shadow-2xl rounded-2xl p-8 w-full max-w-[400px] relative z-20 backdrop-blur-sm"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg shadow-black/20 border-4 border-[#0f2452]">
                  <Bot className="text-[#0b1b3d] w-8 h-8" />
                </div>
                
                <div className="text-center mt-6 mb-8">
                  <h3 className="text-white text-xl font-bold mb-3">Talk to AI Tax Assistant</h3>
                  <p className="text-slate-300 text-sm leading-relaxed px-2">
                    Ask anything about Income Tax, GST, TDS, ITR, Compliance, Notices or any CA related services.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <Link 
                    href="/chat"
                    className="w-full flex items-center justify-center gap-3 bg-[#dca850] text-[#0b1b3d] font-bold py-3.5 rounded-full hover:bg-[#c9953d] transition-all shadow-[0_0_15px_rgba(220,168,80,0.3)]"
                  >
                    Chat with AI Assistant
                    <MessageSquare size={18} />
                  </Link>
                  
                  <div className="flex items-center gap-3 py-2">
                    <div className="flex-1 h-px bg-slate-700"></div>
                    <span className="text-xs text-slate-400 uppercase tracking-widest">or</span>
                    <div className="flex-1 h-px bg-slate-700"></div>
                  </div>
                  
                  <Link href="/contact" className="w-full flex items-center justify-center gap-3 bg-transparent border border-slate-600 text-white font-semibold py-3.5 rounded-full hover:bg-slate-800 transition-colors">
                    <PhoneCall size={18} className="text-[#dca850]" />
                    Talk to Real CA
                    <span className="block text-[10px] font-normal text-slate-400 absolute mt-9">Connect with our expert now</span>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* OVERLAPPING GRID SECTION */}
        <section className="max-w-[1400px] mx-auto px-4 xl:px-8 -mt-32 relative z-30 mb-8">
          <div className="flex flex-col xl:flex-row gap-6">
            
            {/* LATEST TAX UPDATES */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 xl:w-[350px] shrink-0 flex flex-col h-[520px]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-[#0b1b3d] text-lg">Latest Tax Updates</h3>
                <Link href="/tax-calculator" className="text-xs font-semibold text-slate-500 hover:text-[#0b1b3d]">View All</Link>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-5 custom-scrollbar">
                {[
                  { tag: 'INCOME TAX', title: 'CBDT Extends Due Date for Filing ITR for AY 2025-26', date: '22 May 2024', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
                  { tag: 'GST', title: 'GST Council Recommends Changes in Return Filing Rules', date: '21 May 2024', color: 'text-purple-600 bg-purple-50 border-purple-200' },
                  { tag: 'FINANCE', title: 'TDS on Rent: New Rule Clarification by CBDT', date: '20 May 2024', color: 'text-blue-600 bg-blue-50 border-blue-200' },
                  { tag: 'INCOME TAX', title: 'New ITR Forms Notified for FY 2024-25', date: '18 May 2024', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
                ].map((update, i) => (
                  <Link href="/tax-calculator" key={i} className="flex gap-4 group cursor-pointer border-b border-slate-50 pb-5 last:border-0">
                    <div className="w-14 h-14 rounded-lg bg-slate-100 flex-shrink-0 flex items-center justify-center border border-slate-200 group-hover:border-[#0b1b3d] transition-colors overflow-hidden">
                       <FileText className="text-slate-400 w-6 h-6" />
                    </div>
                    <div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${update.color} uppercase tracking-wider`}>{update.tag}</span>
                      <h4 className="text-sm font-semibold text-slate-800 mt-2 mb-1 group-hover:text-[#0b1b3d] leading-snug">{update.title}</h4>
                      <div className="text-[11px] text-slate-400">{update.date}</div>
                    </div>
                  </Link>
                ))}
              </div>
              
              <Link href="/tax-calculator" className="flex items-center gap-2 text-sm font-semibold text-[#0b1b3d] mt-4 pt-4 border-t border-slate-100">
                More Updates <ChevronRight size={16} />
              </Link>
            </div>

            {/* EXPLORE OUR SERVICES */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 flex-1 h-auto xl:h-[520px] flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-[#0b1b3d] text-lg">Explore Our Services</h3>
                <Link href="/upload" className="text-xs font-semibold text-slate-500 hover:text-[#0b1b3d]">View All Services</Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
                {[
                  { icon: <FileText size={24}/>, title: 'Income Tax', desc: 'ITR Filing, Planning & Compliance', href: '/upload' },
                  { icon: <Landmark size={24}/>, title: 'GST Services', desc: 'Registration, Returns & Advisory', href: '/contact' },
                  { icon: <Calculator size={24}/>, title: 'TDS Services', desc: 'TDS Return, Filing & Compliance', href: '/contact' },
                  { icon: <Building2 size={24}/>, title: 'Company Registration', desc: 'Private, LLP, OPC Registration', href: '/contact' },
                  { icon: <Briefcase size={24}/>, title: 'Accounting & Bookkeeping', desc: 'Monthly/Yearly Accounting', href: '/contact' },
                  { icon: <SearchCheck size={24}/>, title: 'Audit & Assurance', desc: 'Statutory Audit, Tax Audit & More', href: '/contact' },
                  { icon: <ShieldCheck size={24}/>, title: 'Tax Notice Handling', desc: 'Assessment, Scrutiny & Appeals', href: '/contact' },
                  { icon: <Users size={24}/>, title: 'Business Consultation', desc: 'Startups, MSME & Advisory', href: '/contact' },
                ].map((service, i) => (
                  <Link href={service.href} key={i} className="group p-5 rounded-xl border border-slate-100 hover:border-[#0b1b3d] hover:shadow-md transition-all flex flex-col">
                    <div className="w-10 h-10 rounded-lg bg-[#0b1b3d] text-white flex items-center justify-center mb-4 group-hover:bg-[#dca850] transition-colors">
                      {service.icon}
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm mb-1">{service.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{service.desc}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* TRUST BAR */}
        <section className="max-w-[1400px] mx-auto px-4 xl:px-8 mb-16">
          <div className="bg-[#0b1b3d] rounded-2xl py-6 px-8 grid grid-cols-2 md:grid-cols-5 gap-6 divide-x divide-slate-700/50">
            <div className="flex items-center gap-3 pl-0 md:pl-4">
              <ShieldCheck className="text-[#dca850] w-8 h-8 shrink-0" />
              <div>
                <div className="text-white text-xs font-bold">100% Secure</div>
                <div className="text-slate-400 text-[10px]">Your data is safe with us</div>
              </div>
            </div>
            <div className="flex items-center gap-3 pl-4 md:pl-8">
              <Users className="text-[#dca850] w-8 h-8 shrink-0" />
              <div>
                <div className="text-white text-xs font-bold">Expert CA Team</div>
                <div className="text-slate-400 text-[10px]">Qualified & experienced</div>
              </div>
            </div>
            <div className="flex items-center gap-3 pl-4 md:pl-8">
              <Bot className="text-[#dca850] w-8 h-8 shrink-0" />
              <div>
                <div className="text-white text-xs font-bold">AI Powered Support</div>
                <div className="text-slate-400 text-[10px]">Get instant answers</div>
              </div>
            </div>
            <div className="flex items-center gap-3 pl-4 md:pl-8">
              <Clock className="text-[#dca850] w-8 h-8 shrink-0" />
              <div>
                <div className="text-white text-xs font-bold">Timely Compliance</div>
                <div className="text-slate-400 text-[10px]">Never miss a due date</div>
              </div>
            </div>
            <div className="flex items-center gap-3 pl-4 md:pl-8">
              <DollarSign className="text-[#dca850] w-8 h-8 shrink-0" />
              <div>
                <div className="text-white text-xs font-bold">Affordable Pricing</div>
                <div className="text-slate-400 text-[10px]">Transparent rates</div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="max-w-[1400px] mx-auto px-4 xl:px-8 mb-24 text-center">
          <h2 className="text-2xl font-bold text-[#0b1b3d] mb-2 font-serif">How It Works</h2>
          <p className="text-sm text-slate-500 mb-12">Simple Steps to Get Your Work Done</p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
             <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 border-dashed border-t-2 border-slate-300 -z-10"></div>
             
             {[
               { num: 1, icon: <MessageSquare size={28}/>, title: 'Consultation', desc: 'Discuss your requirements with our expert team' },
               { num: 2, icon: <UploadCloud size={28}/>, title: 'Submit Documents', desc: 'Upload required documents securely on our portal' },
               { num: 3, icon: <FileText size={28}/>, title: 'Processing', desc: 'Our experts will process your work accurately' },
               { num: 4, icon: <CheckCircle2 size={28}/>, title: 'Work Completed', desc: 'Download your final documents from dashboard' },
             ].map((step, i) => (
               <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 relative">
                 <div className="absolute -top-3 -left-3 w-8 h-8 bg-[#0b1b3d] text-white rounded-full flex items-center justify-center font-bold text-sm border-4 border-[#f8f9fc]">
                   {step.num}
                 </div>
                 <div className="w-16 h-16 bg-[#f8f9fc] rounded-full mx-auto flex items-center justify-center mb-4 text-[#0b1b3d]">
                   {step.icon}
                 </div>
                 <h4 className="font-bold text-slate-800 text-sm mb-2">{step.title}</h4>
                 <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
               </div>
             ))}
          </div>
        </section>
      </main>

      {/* FLOATING CHAT WIDGET (Mockup matching the image) */}
      <div className={`fixed bottom-6 right-6 w-[350px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 transition-all duration-300 origin-bottom-right ${chatOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
         {/* Chat Header */}
         <div className="bg-[#0b1b3d] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <Bot className="text-[#0b1b3d] w-5 h-5" />
              </div>
              <div>
                <div className="text-white text-sm font-bold">AI Tax Assistant</div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <div className="text-emerald-400 text-[10px]">Online</div>
                </div>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} className="text-slate-300 hover:text-white">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 1L1 13M1 1L13 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
         </div>
         
         {/* Chat Body */}
         <div className="p-4 bg-slate-50 h-[380px] flex flex-col">
            <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-tl-none shadow-sm mb-4 inline-block max-w-[85%]">
              <p className="text-sm text-slate-700">Hi! I am your AI Tax Assistant. How can I help you today?</p>
            </div>
            
            <div className="space-y-2 mt-auto">
              {['I want to file my ITR', 'I need GST Registration', 'TDS on Rent Query', 'Notice Received from IT Dept', 'Other Query'].map((q, i) => (
                <button 
                  key={i} 
                  onClick={() => router.push('/chat')}
                  className="w-full flex items-center justify-between bg-white border border-slate-200 p-3 rounded-xl hover:border-[#0b1b3d] hover:shadow-sm transition-all text-left group"
                >
                  <span className="text-sm text-slate-700 font-medium group-hover:text-[#0b1b3d]">{q}</span>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-[#0b1b3d]" />
                </button>
              ))}
            </div>
         </div>
         
         {/* Chat Input */}
         <form onSubmit={handleChatSubmit} className="p-4 bg-white border-t border-slate-100">
           <div className="flex items-center gap-2 bg-[#f8f9fc] border border-slate-200 rounded-full px-4 py-2">
             <input 
               type="text" 
               value={chatInput}
               onChange={(e) => setChatInput(e.target.value)}
               placeholder="Type your message..." 
               className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-slate-400" 
             />
             <BotMessageSquare className="text-slate-400 w-5 h-5 cursor-pointer hover:text-[#0b1b3d]" onClick={handleChatSubmit} />
             <button type="submit" className="w-8 h-8 bg-[#0b1b3d] rounded-full flex items-center justify-center cursor-pointer hover:bg-opacity-90 border-none outline-none">
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
             </button>
           </div>
         </form>
         
         {/* Bottom Nav */}
         <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-slate-100 text-[#0b1b3d]">
           <Link href="/" className="flex flex-col items-center gap-1 cursor-pointer">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
             <span className="text-[10px] font-bold">Home</span>
           </Link>
           <Link href="/upload" className="flex flex-col items-center gap-1 cursor-pointer text-slate-400 hover:text-[#0b1b3d]">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
             <span className="text-[10px] font-medium">Services</span>
           </Link>
           <Link href="/tax-calculator" className="flex flex-col items-center gap-1 cursor-pointer text-slate-400 hover:text-[#0b1b3d]">
             <Calculator size={20} />
             <span className="text-[10px] font-medium">Calculator</span>
           </Link>
           <Link href="/contact" className="flex flex-col items-center gap-1 cursor-pointer text-slate-400 hover:text-[#0b1b3d]">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
             <span className="text-[10px] font-medium">Support</span>
           </Link>
           <Link href="/dashboard" className="flex flex-col items-center gap-1 cursor-pointer text-slate-400 hover:text-[#0b1b3d]">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
             <span className="text-[10px] font-medium">Profile</span>
           </Link>
         </div>
      </div>
      
      {/* Floating Chat Trigger Button (when closed) */}
      {!chatOpen && (
        <button 
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-[#0b1b3d] text-white rounded-full shadow-lg shadow-[#0b1b3d]/30 flex items-center justify-center hover:scale-110 transition-transform z-40"
        >
          <Bot size={28} />
        </button>
      )}

    </div>
  );
}
