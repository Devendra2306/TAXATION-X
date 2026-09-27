"use client";

import { motion } from 'framer-motion';
import { ChevronRight, Shield, Zap, FileText, CheckCircle, ArrowRight, Star, Briefcase, Home, TrendingUp, DollarSign, Clock, Search, ChevronDown, Book, Calculator, Coins, Circle, LineChart } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-border/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo />
          
          <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-600 h-full">
            {/* Products Mega Menu */}
            <div className="relative group h-full flex items-center">
              <button className="flex items-center gap-1 hover:text-primary transition-colors py-5">
                Products <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" />
              </button>
              
              {/* Dropdown Panel */}
              <div className="absolute top-[100%] left-1/2 -translate-x-1/2 w-[650px] bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-slate-100 rounded-b-2xl p-8 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Products</h3>
                
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 relative before:absolute before:inset-y-0 before:left-1/2 before:w-px before:bg-slate-100">
                  
                  {/* Left Column: ITR Filing Services */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 mb-4 tracking-wide uppercase">ITR Filing Services</h4>
                    <ul className="space-y-1">
                      <li>
                        <Link href="/upload" className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group/item">
                          <CheckCircle size={16} className="text-primary" />
                          <span className="text-slate-700 font-medium group-hover/item:text-primary transition-colors">Self ITR Filing</span>
                        </Link>
                      </li>
                      <li>
                        <Link href="/pricing" className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group/item">
                          <Briefcase size={16} className="text-primary" />
                          <span className="text-slate-700 font-medium group-hover/item:text-primary transition-colors">Hire an Expert for Tax Filing</span>
                        </Link>
                      </li>
                      <li>
                        <Link href="/login" className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group/item">
                          <Star size={16} className="text-primary" />
                          <span className="text-slate-700 font-medium group-hover/item:text-primary transition-colors">Annual Subscription</span>
                        </Link>
                      </li>
                    </ul>
                  </div>

                  {/* Right Column: Other Services */}
                  <div className="pl-4">
                    <h4 className="text-xs font-bold text-slate-400 mb-4 tracking-wide uppercase">Other Services</h4>
                    <ul className="space-y-1">
                      <li>
                        <Link href="/login" className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group/item">
                          <Shield size={16} className="text-primary" />
                          <span className="text-slate-700 font-medium group-hover/item:text-primary transition-colors">Notice Management</span>
                        </Link>
                      </li>
                      <li>
                        <Link href="/login" className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group/item">
                          <Home size={16} className="text-primary" />
                          <span className="text-slate-700 font-medium group-hover/item:text-primary transition-colors">HUF Services</span>
                        </Link>
                      </li>
                      <li>
                        <Link href="/advance-tax-calculator" className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group/item">
                          <TrendingUp size={16} className="text-primary" />
                          <span className="text-slate-700 font-medium group-hover/item:text-primary transition-colors">Advance Tax Filing</span>
                        </Link>
                      </li>
                      <li>
                        <Link href="/tax-calculator" className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group/item">
                          <FileText size={16} className="text-primary" />
                          <span className="text-slate-700 font-medium group-hover/item:text-primary transition-colors">Capital Gains Taxation</span>
                        </Link>
                      </li>
                      <li>
                        <Link href="/login" className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group/item">
                          <LineChart size={16} className="text-primary" />
                          <span className="text-slate-700 font-medium group-hover/item:text-primary transition-colors">F&O Taxation</span>
                        </Link>
                      </li>
                      <li>
                        <Link href="/login" className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group/item">
                          <Circle size={16} className="text-primary" />
                          <span className="text-slate-700 font-medium group-hover/item:text-primary transition-colors">NRI Services</span>
                        </Link>
                      </li>
                      <li>
                        <Link href="/login" className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group/item">
                          <Briefcase size={16} className="text-primary" />
                          <span className="text-slate-700 font-medium group-hover/item:text-primary transition-colors">ESOPs & RSUs</span>
                        </Link>
                      </li>
                    </ul>
                  </div>

                </div>
              </div>
            </div>

            {/* Resources Mega Menu */}
            <div className="relative group h-full flex items-center">
              <button className="flex items-center gap-1 hover:text-primary transition-colors py-5">
                Resources <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" />
              </button>
              
              {/* Dropdown Panel */}
              <div className="absolute top-[100%] left-1/2 -translate-x-1/2 w-[550px] bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-slate-100 rounded-b-2xl p-8 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Resources</h3>
                
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 relative before:absolute before:inset-y-0 before:left-1/2 before:w-px before:bg-slate-100">
                  
                  {/* Left Column */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 mb-4 tracking-wide uppercase">ITR</h4>
                    <ul className="space-y-1">
                      <li>
                        <Link href="/about" className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group/item">
                          <Book size={16} className="text-primary" />
                          <span className="text-slate-700 font-medium group-hover/item:text-primary transition-colors">ITR Guide</span>
                        </Link>
                      </li>
                      <li>
                        <Link href="/tax-calculator" className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group/item">
                          <Calculator size={16} className="text-primary" />
                          <span className="text-slate-700 font-medium group-hover/item:text-primary transition-colors">Income Tax Calculator</span>
                        </Link>
                      </li>
                      <li>
                        <Link href="/advance-tax-calculator" className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group/item">
                          <FileText size={16} className="text-primary" />
                          <span className="text-slate-700 font-medium group-hover/item:text-primary transition-colors">Advance Tax Calculator</span>
                        </Link>
                      </li>
                      <li>
                        <Link href="/tax-calculator" className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group/item">
                          <TrendingUp size={16} className="text-primary" />
                          <span className="text-slate-700 font-medium group-hover/item:text-primary transition-colors">Capital Gains Calculator</span>
                        </Link>
                      </li>
                    </ul>
                  </div>

                  {/* Right Column */}
                  <div className="pl-4">
                    <h4 className="text-xs font-bold text-slate-400 mb-4 tracking-wide uppercase">Personal Finance</h4>
                    <ul className="space-y-1">
                      <li>
                        <Link href="/about" className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group/item">
                          <Book size={16} className="text-primary" />
                          <span className="text-slate-700 font-medium group-hover/item:text-primary transition-colors">Financial Planning Guides</span>
                        </Link>
                      </li>
                      <li>
                        <Link href="/sip-calculator" className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group/item">
                          <Calculator size={16} className="text-primary" />
                          <span className="text-slate-700 font-medium group-hover/item:text-primary transition-colors">Financial Calculators</span>
                        </Link>
                      </li>
                      <li>
                        <Link href="/login" className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group/item">
                          <Coins size={16} className="text-primary" />
                          <span className="text-slate-700 font-medium group-hover/item:text-primary transition-colors">Gold Prices</span>
                        </Link>
                      </li>
                      <li>
                        <Link href="/login" className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group/item">
                          <Circle size={16} className="text-primary" />
                          <span className="text-slate-700 font-medium group-hover/item:text-primary transition-colors">Silver Prices</span>
                        </Link>
                      </li>
                      <li>
                        <Link href="/login" className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group/item">
                          <LineChart size={16} className="text-primary" />
                          <span className="text-slate-700 font-medium group-hover/item:text-primary transition-colors">IPO</span>
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Mega Menu */}
            <div className="relative group h-full flex items-center">
              <button className="flex items-center gap-1 hover:text-primary transition-colors py-5">
                Company <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" />
              </button>
              
              {/* Dropdown Panel */}
              <div className="absolute top-[100%] left-1/2 -translate-x-1/2 w-[300px] bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-slate-100 rounded-b-2xl p-6 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                <ul className="space-y-2">
                  <li>
                    <Link href="/about" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group/item">
                      <div className="bg-blue-50 p-2 rounded-md group-hover/item:bg-blue-100 transition-colors">
                        <Home size={16} className="text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-700 group-hover/item:text-primary transition-colors">About Us</div>
                        <div className="text-xs text-slate-500">Our story and mission</div>
                      </div>
                    </Link>
                  </li>
                  <li>
                    <Link href="/careers" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group/item">
                      <div className="bg-emerald-50 p-2 rounded-md group-hover/item:bg-emerald-100 transition-colors">
                        <Briefcase size={16} className="text-emerald-600" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-700 group-hover/item:text-emerald-600 transition-colors">Careers</div>
                        <div className="text-xs text-slate-500">Join our growing team</div>
                      </div>
                    </Link>
                  </li>
                  <li>
                    <Link href="/trust" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group/item">
                      <div className="bg-indigo-50 p-2 rounded-md group-hover/item:bg-indigo-100 transition-colors">
                        <Shield size={16} className="text-indigo-600" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-700 group-hover/item:text-indigo-600 transition-colors">Trust & Safety</div>
                        <div className="text-xs text-slate-500">Security and compliance</div>
                      </div>
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group/item">
                      <div className="bg-amber-50 p-2 rounded-md group-hover/item:bg-amber-100 transition-colors">
                        <Star size={16} className="text-amber-600" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-700 group-hover/item:text-amber-600 transition-colors">Contact Us</div>
                        <div className="text-xs text-slate-500">Get in touch with support</div>
                      </div>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </nav>
          <div className="flex items-center gap-5">
            {/* Marketing Ad / Promoted Action */}
            <Link href="/login" className="hidden lg:flex items-center gap-2 text-sm font-medium bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-full hover:bg-amber-100 transition-colors shadow-sm">
              <Star size={14} className="fill-amber-400 text-amber-500" />
              <span>Hire an Expert for Tax Filing</span>
            </Link>
            
            <div className="w-px h-5 bg-slate-200 hidden md:block"></div>

            <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors">
              Log in
            </Link>
            <Link href="/signup" className="text-sm font-semibold bg-gradient-to-r from-primary to-[hsl(260,80%,58%)] text-white hover:shadow-lg hover:shadow-primary/25 transition-all py-2 px-5 rounded-xl">
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-16 pb-20">
        {/* HERO SECTION */}
        <section className="max-w-7xl mx-auto px-6 pt-16 pb-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <motion.div 
              className="inline-flex items-center gap-3 bg-white border border-slate-200 rounded-full px-4 py-1.5 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-1 font-semibold text-slate-800 text-sm">
                8 M+ <span className="font-normal text-slate-500 text-xs">Users</span>
              </div>
              <div className="w-px h-3 bg-slate-300"></div>
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-slate-800 text-sm ml-1">4.6</span>
              </div>
            </motion.div>
            
            <motion.h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-slate-800 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              India’s Most Trusted <br/>Tax Filing Platform
            </motion.h1>
            
            <motion.div 
              className="inline-flex items-center bg-emerald-50 text-emerald-700 px-3 py-1 rounded mb-8 font-medium text-sm border border-emerald-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              100% Accuracy and Maximum Tax Refund
            </motion.div>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Link href="/upload" className="btn-primary text-base px-8 py-3 w-full sm:w-auto shadow-md">
                File ITR Now
              </Link>
              <a href="#" className="btn-secondary text-base px-8 py-3 w-full sm:w-auto">
                Hire a Tax Expert
              </a>
            </motion.div>

            <motion.p 
              className="mt-6 text-sm text-slate-500 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              E-file your Income Tax Return for FY 2025-26 (AY 2026-27)
            </motion.p>
          </div>
          
          <motion.div 
            className="hidden md:block relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="aspect-square bg-gradient-to-tr from-primary/10 to-emerald-500/10 rounded-full absolute -inset-4 blur-3xl opacity-50"></div>
            <div className="glass-panel p-8 rounded-2xl relative shadow-xl border-slate-100 bg-white">
              <div className="space-y-6">
                <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">1. Pre-fill your data</div>
                    <div className="text-sm text-slate-500">Auto-fetch from IT Portal, Form 16 & AIS</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Search className="text-emerald-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">2. Review & Optimize</div>
                    <div className="text-sm text-slate-500">We auto-select the best tax regime for you</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <CheckCircle className="text-blue-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">3. File Instantly</div>
                    <div className="text-sm text-slate-500">One-click e-verification via Aadhaar OTP</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* SUPPORTED INCOMES SECTION */}
        <section className="bg-slate-50 py-20 border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-slate-800">We handle all types of incomes</h2>
              <p className="text-lg text-slate-600">Whether you are a salaried employee, freelancer, or crypto trader — we've got you covered.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { icon: <Briefcase className="text-primary w-8 h-8" />, title: "Salary", desc: "Multiple Form 16s" },
                { icon: <TrendingUp className="text-emerald-500 w-8 h-8" />, title: "Capital Gains", desc: "Stocks, MFs, ESPs" },
                { icon: <Home className="text-amber-500 w-8 h-8" />, title: "House Property", desc: "Rent & Home Loan" },
                { icon: <DollarSign className="text-blue-500 w-8 h-8" />, title: "Crypto", desc: "VDAs & NFTs" },
                { icon: <FileText className="text-purple-500 w-8 h-8" />, title: "Freelance", desc: "Business & Profession" },
                { icon: <Clock className="text-rose-500 w-8 h-8" />, title: "Other Income", desc: "FDs, Dividends" },
              ].map((item, idx) => (
                <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 text-center hover:shadow-md transition-shadow">
                  <div className="flex justify-center mb-4">{item.icon}</div>
                  <h3 className="font-semibold text-slate-800 mb-1">{item.title}</h3>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BROKER INTEGRATIONS (ClearTax feature) */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-2xl font-bold mb-8 text-slate-800">Auto-import your capital gains from top brokers</h2>
            <div className="flex flex-wrap justify-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              {['Zerodha', 'Groww', 'Upstox', 'ICICI Direct', 'HDFC Sec', 'Paytm Money'].map((broker) => (
                <div key={broker} className="text-xl font-bold text-slate-400 border-2 border-slate-200 px-6 py-3 rounded-lg bg-slate-50">
                  {broker}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHY CHOOSE US (Features) */}
        <section className="bg-slate-900 text-white py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Why millions choose NexTax for ITR Filing</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: <Shield className="text-emerald-400" size={32} />, title: "100% Data Security", desc: "Authorized E-Return Intermediary (ERI). 256-bit bank grade encryption." },
                { icon: <Zap className="text-amber-400" size={32} />, title: "Super Fast Filing", desc: "No manual data entry. Auto-fetch from Income Tax Department." },
                { icon: <CheckCircle className="text-blue-400" size={32} />, title: "Notice Protection", desc: "Proactive scanning of AIS/TIS to ensure you never miss reporting income." },
                { icon: <DollarSign className="text-emerald-400" size={32} />, title: "Maximum Tax Savings", desc: "Smart AI algorithm checks 100+ tax saving provisions to boost your refund." },
              ].map((feat, idx) => (
                <motion.div 
                  key={idx}
                  className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                >
                  <div className="mb-6">{feat.icon}</div>
                  <h3 className="text-xl font-semibold mb-3 text-white">{feat.title}</h3>
                  <p className="text-slate-400 leading-relaxed text-sm">{feat.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING (Simulating ClearTax DIY vs CA) */}
        <section id="pricing" className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-slate-800">Plans that fit your needs</h2>
            <p className="text-xl text-slate-600">Choose to file yourself or get an expert CA to do it for you.</p>
          </div>
          
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col relative">
              <h3 className="text-2xl font-bold mb-2 text-slate-800">Self ITR Filing</h3>
              <p className="text-slate-500 mb-6 text-sm">Best for salaried individuals with Form 16</p>
              <div className="text-5xl font-bold mb-8 text-slate-800">₹149</div>
              <ul className="space-y-4 mb-8 flex-1 text-slate-700 text-sm font-medium">
                <li className="flex items-center gap-3"><CheckCircle size={18} className="text-emerald-500 shrink-0" /> Form 16 & AIS Auto-parsing</li>
                <li className="flex items-center gap-3"><CheckCircle size={18} className="text-emerald-500 shrink-0" /> Old vs New Regime Comparison</li>
                <li className="flex items-center gap-3"><CheckCircle size={18} className="text-emerald-500 shrink-0" /> Broker statement imports</li>
                <li className="flex items-center gap-3"><CheckCircle size={18} className="text-emerald-500 shrink-0" /> Real-time refund tracking</li>
              </ul>
              <Link href="/upload" className="btn-secondary w-full border-slate-300">File it yourself</Link>
            </div>
            
            <div className="bg-gradient-to-b from-slate-900 to-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl flex flex-col relative overflow-hidden text-white">
              <div className="absolute top-4 right-4 bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-full border border-primary/30">MOST POPULAR</div>
              
              <h3 className="text-2xl font-bold mb-2">CA Assisted Filing</h3>
              <p className="text-slate-400 mb-6 text-sm">Expert CA will prepare and file your returns</p>
              <div className="text-5xl font-bold mb-2 text-white">₹1,499<span className="text-xl text-slate-400 font-normal"> onwards</span></div>
              <p className="text-emerald-400 text-sm font-medium mb-8">Save 30% today</p>
              
              <ul className="space-y-4 mb-8 flex-1 text-slate-300 text-sm font-medium">
                <li className="flex items-center gap-3"><CheckCircle size={18} className="text-primary shrink-0" /> Dedicated CA Manager</li>
                <li className="flex items-center gap-3"><CheckCircle size={18} className="text-primary shrink-0" /> Complex Capital Gains & Crypto</li>
                <li className="flex items-center gap-3"><CheckCircle size={18} className="text-primary shrink-0" /> Foreign Income & Assets</li>
                <li className="flex items-center gap-3"><CheckCircle size={18} className="text-primary shrink-0" /> Post-filing query resolution</li>
              </ul>
              <button className="btn-primary w-full shadow-[0_0_20px_rgba(99,102,241,0.4)]">Hire an Expert</button>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="max-w-4xl mx-auto px-6 py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-slate-800">Frequently Asked Questions</h2>
            <p className="text-lg text-slate-600">Everything you need to know about filing your taxes with NexTax.</p>
          </div>
          <div className="space-y-4">
            {[
              {
                q: "Who should file an ITR?",
                a: "Any individual whose total income for the financial year exceeds the basic exemption limit (₹3,00,000 under the new regime, ₹2,50,000 under the old regime) must file an ITR. It is also mandatory if you hold foreign assets, paid electricity bills over ₹1 Lakh, or traveled abroad spending over ₹2 Lakhs."
              },
              {
                q: "How can I claim deductions for tax saving?",
                a: "You can claim deductions by opting for the Old Tax Regime. Investments in PPF, ELSS, Life Insurance (80C), Health Insurance (80D), and NPS (80CCD) can be claimed. Our AI will automatically optimize these to maximize your refund."
              },
              {
                q: "I receive my salary income after deduction of TDS. Am I required to file an income tax return?",
                a: "Yes. Even if your employer has deducted TDS, filing an ITR is mandatory if your gross total income exceeds the basic exemption limit. Filing helps you claim refunds on excess TDS deducted and acts as proof of income for loans and visas."
              },
              {
                q: "How do I check TDS details from my form 26AS?",
                a: "You can view your Form 26AS by logging into the Income Tax e-Filing portal. With NexTax, you simply upload your Form 16, and our system will automatically fetch and reconcile your 26AS and AIS data for you."
              },
              {
                q: "How can I claim an income tax refund?",
                a: "A refund is generated when the taxes paid (TDS/Advance Tax) exceed your actual tax liability. To claim it, simply file your ITR through NexTax, ensure your bank account is pre-validated, and the IT Department will credit the refund directly to your account."
              },
              {
                q: "Is my data filed with NexTax secure?",
                a: "Absolutely. We use 256-bit bank-grade encryption to protect your data. NexTax is an authorized E-Return Intermediary (ERI) compliant with all government security standards. We never sell your personal information."
              },
              {
                q: "What are the GST services offered by NexTax?",
                a: "NexTax offers end-to-end GST solutions including GST Registration, Monthly/Quarterly Return Filing (GSTR-1, GSTR-3B), Annual Returns (GSTR-9), and GST Reconciliation tools for businesses of all sizes."
              },
              {
                q: "How to e-verify my ITR?",
                a: "Once you file your ITR via NexTax, you will be prompted to e-verify. The simplest method is using Aadhaar OTP. Other methods include Net Banking, EVC via Bank ATM, or sending a signed physical ITR-V to the CPC in Bangalore."
              },
              {
                q: "How to choose a suitable mutual fund for SIP?",
                a: "Choosing a mutual fund depends on your risk appetite and goals. For tax saving, Equity Linked Savings Schemes (ELSS) are ideal as they offer 80C deductions with a short 3-year lock-in period. You can use our SIP Calculator to plan your investments."
              },
              {
                q: "How does NexTax Invoicing software help small businesses?",
                a: "NexTax Invoicing allows small businesses to generate GST-compliant electronic invoices instantly, track payments, manage inventory, and seamlessly auto-populate GSTR-1 returns, saving hours of manual accounting work."
              }
            ].map((faq, idx) => (
              <details key={idx} className="group bg-white border border-slate-200 rounded-xl [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between p-6 text-slate-800 font-semibold">
                  <span>{faq.q}</span>
                  <span className="transition group-open:rotate-180">
                    <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <div className="px-6 pb-6 text-slate-600 leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-slate-50 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12 text-sm">
            <div>
              <h4 className="font-bold text-slate-800 mb-4 uppercase text-xs tracking-wider">ITR Filing</h4>
              <ul className="space-y-3 text-slate-600">
                <li><Link href="/login" className="hover:text-primary">Income Tax Return</Link></li>
                <li><Link href="/login" className="hover:text-primary">Form 16 Filing</Link></li>
                <li><Link href="/login" className="hover:text-primary">Capital Gains Tax</Link></li>
                <li><Link href="/login" className="hover:text-primary">Freelancer ITR</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-800 mb-4 uppercase text-xs tracking-wider">Calculators</h4>
              <ul className="space-y-3 text-slate-600">
                <li><Link href="/tax-calculator" className="hover:text-primary">Income Tax Calculator</Link></li>
                <li><Link href="/sip-calculator" className="hover:text-primary">SIP Calculator</Link></li>
                <li><Link href="/hra-calculator" className="hover:text-primary">HRA Calculator</Link></li>
                <li><Link href="/nps-calculator" className="hover:text-primary">NPS Calculator</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-800 mb-4 uppercase text-xs tracking-wider">Company</h4>
              <ul className="space-y-3 text-slate-600">
                <li><Link href="/about" className="hover:text-primary">About Us</Link></li>
                <li><Link href="/careers" className="hover:text-primary">Careers</Link></li>
                <li><Link href="/trust" className="hover:text-primary">Trust & Safety</Link></li>
                <li><Link href="/contact" className="hover:text-primary">Contact</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row items-center justify-between">
            <Logo className="mb-4 md:mb-0" />
            <p className="text-slate-500 text-sm">&copy; {new Date().getFullYear()} NexTax Software Pvt. Ltd. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
