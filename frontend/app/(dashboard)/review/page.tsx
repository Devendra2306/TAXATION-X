'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, Edit2, AlertTriangle, ArrowRight, Save, 
  User, Briefcase, Calculator, Building, Receipt, FileText, Download, ChevronRight 
} from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReviewPage() {
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState<any>({
    gross_salary: 0,
    deductions_80c: 0,
    tds_deducted: 0,
    home_loan_interest: 0,
    capital_gains: 0,
    other_income: 0,
    employer_name: '',
    pan: ''
  });

  useEffect(() => {
    const dataStr = localStorage.getItem('parsedTaxData');
    if (dataStr) {
      try {
        setParsedData(JSON.parse(dataStr));
      } catch (e) {}
    }
  }, []);

  const handleChange = (field: string, value: string) => {
    setParsedData({ ...parsedData, [field]: value });
  };

  const handleSave = async () => {
    setIsLoading(true);
    // Simulate save
    setTimeout(() => {
      localStorage.setItem('parsedTaxData', JSON.stringify(parsedData));
      setIsEditing(false);
      setIsLoading(false);
    }, 800);
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'income', label: 'Income Sources', icon: Briefcase },
    { id: 'deductions', label: 'Deductions', icon: Receipt },
    { id: 'taxes', label: 'Taxes Paid', icon: FileText },
  ];

  const fmt = (val: number) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Review Tax Data"
          subtitle="Verify the data extracted by our AI before computing your final taxes."
        />
        <div className="flex items-center gap-3">
          {isEditing ? (
            <button onClick={handleSave} className="btn-primary flex items-center gap-2">
              {isLoading ? 'Saving...' : <><Save size={16} /> Save Changes</>}
            </button>
          ) : (
            <button onClick={() => setIsEditing(true)} className="px-5 py-2.5 rounded-xl border-2 border-indigo-100 text-indigo-700 font-semibold hover:bg-indigo-50 flex items-center gap-2 transition-colors">
              <Edit2 size={16} /> Edit Data
            </button>
          )}
          <Link href="/compare" className="btn-primary flex items-center gap-2">
            Compute Tax <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Sidebar - Tabs */}
        <div className="lg:w-64 shrink-0 space-y-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600 shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-50 border-l-4 border-transparent'
                }`}
              >
                <tab.icon size={18} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                {tab.label}
                {isActive && <ChevronRight size={16} className="ml-auto opacity-50" />}
              </button>
            )
          })}
        </div>

        {/* Right Content Area */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
          <div className="p-6 md:p-8">
            <AnimatePresence mode="wait">
              
              {activeTab === 'personal' && (
                <motion.div key="personal" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
                  <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <User className="text-indigo-500" /> Personal & Employer Details
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700">Permanent Account Number (PAN)</label>
                      {isEditing ? (
                        <input type="text" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none uppercase" value={parsedData.pan} onChange={(e) => handleChange('pan', e.target.value)} />
                      ) : (
                        <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 font-medium text-slate-800 uppercase">{parsedData.pan || 'Not Provided'}</div>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700">Employer Name</label>
                      {isEditing ? (
                        <input type="text" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={parsedData.employer_name} onChange={(e) => handleChange('employer_name', e.target.value)} />
                      ) : (
                        <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 font-medium text-slate-800">{parsedData.employer_name || 'Not Provided'}</div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'income' && (
                <motion.div key="income" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <Briefcase className="text-emerald-500" /> Income Sources
                    </h2>
                    <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold border border-emerald-100">
                      Total: {fmt(Number(parsedData.gross_salary) + Number(parsedData.capital_gains) + Number(parsedData.other_income))}
                    </span>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50">
                      <h3 className="font-semibold text-slate-800 mb-4">Salary Income (Form 16)</h3>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">Gross Salary</label>
                        {isEditing ? (
                          <div className="relative">
                            <span className="absolute left-4 top-2.5 text-slate-400 font-medium">₹</span>
                            <input type="number" className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={parsedData.gross_salary} onChange={(e) => handleChange('gross_salary', e.target.value)} />
                          </div>
                        ) : (
                          <div className="px-4 py-3 bg-white rounded-xl border border-slate-200 font-bold text-slate-800">{fmt(parsedData.gross_salary)}</div>
                        )}
                      </div>
                    </div>

                    <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50">
                      <h3 className="font-semibold text-slate-800 mb-4">Other Income</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-slate-700">Capital Gains (Stocks/MF)</label>
                          {isEditing ? (
                            <div className="relative">
                              <span className="absolute left-4 top-2.5 text-slate-400 font-medium">₹</span>
                              <input type="number" className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={parsedData.capital_gains} onChange={(e) => handleChange('capital_gains', e.target.value)} />
                            </div>
                          ) : (
                            <div className="px-4 py-3 bg-white rounded-xl border border-slate-200 font-bold text-slate-800">{fmt(parsedData.capital_gains)}</div>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-slate-700">Interest Income</label>
                          {isEditing ? (
                            <div className="relative">
                              <span className="absolute left-4 top-2.5 text-slate-400 font-medium">₹</span>
                              <input type="number" className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={parsedData.other_income} onChange={(e) => handleChange('other_income', e.target.value)} />
                            </div>
                          ) : (
                            <div className="px-4 py-3 bg-white rounded-xl border border-slate-200 font-bold text-slate-800">{fmt(parsedData.other_income)}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'deductions' && (
                <motion.div key="deductions" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
                   <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <Receipt className="text-amber-500" /> Tax Deductions
                    </h2>
                  </div>
                  
                  <div className="grid gap-6">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 flex justify-between">
                        <span>Section 80C (LIC, ELSS, PPF)</span>
                        <span className="text-indigo-600 font-medium">Max Limit: ₹1,50,000</span>
                      </label>
                      {isEditing ? (
                        <div className="relative">
                          <span className="absolute left-4 top-2.5 text-slate-400 font-medium">₹</span>
                          <input type="number" className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={parsedData.deductions_80c} onChange={(e) => handleChange('deductions_80c', e.target.value)} />
                        </div>
                      ) : (
                        <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 font-bold text-slate-800">{fmt(parsedData.deductions_80c)}</div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 flex justify-between">
                        <span>Home Loan Interest (Section 24)</span>
                        <span className="text-indigo-600 font-medium">Max Limit: ₹2,00,000</span>
                      </label>
                      {isEditing ? (
                        <div className="relative">
                          <span className="absolute left-4 top-2.5 text-slate-400 font-medium">₹</span>
                          <input type="number" className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={parsedData.home_loan_interest} onChange={(e) => handleChange('home_loan_interest', e.target.value)} />
                        </div>
                      ) : (
                        <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 font-bold text-slate-800">{fmt(parsedData.home_loan_interest)}</div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'taxes' && (
                <motion.div key="taxes" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
                   <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <FileText className="text-rose-500" /> Taxes Already Paid (TDS)
                  </h2>
                  <div className="p-6 bg-rose-50/50 border border-rose-100 rounded-2xl">
                    <p className="text-sm text-slate-600 mb-4">This is the total tax already deducted by your employer or banks before paying you.</p>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700">Total TDS Deducted</label>
                      {isEditing ? (
                        <div className="relative">
                          <span className="absolute left-4 top-2.5 text-slate-400 font-medium">₹</span>
                          <input type="number" className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-rose-200 focus:ring-2 focus:ring-rose-500 outline-none" value={parsedData.tds_deducted} onChange={(e) => handleChange('tds_deducted', e.target.value)} />
                        </div>
                      ) : (
                        <div className="px-4 py-3 bg-white rounded-xl border border-rose-200 font-bold text-rose-700 text-lg">{fmt(parsedData.tds_deducted)}</div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
