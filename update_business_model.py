import os

# 1. Update select-plan to make ITR-1 Free
plan_path = r"frontend\app\(dashboard)\select-plan\page.tsx"
with open(plan_path, 'r', encoding='utf-8') as f:
    plan_code = f.read()

plan_code = plan_code.replace("price: '₹499'", "price: 'FREE'")
with open(plan_path, 'w', encoding='utf-8') as f:
    f.write(plan_code)


# 2. Update review page to add the CA Upsell banner and Upgrade Trap
review_path = r"frontend\app\(dashboard)\review\page.tsx"
with open(review_path, 'r', encoding='utf-8') as f:
    review_code = f.read()

# We need to inject an upgrade modal and CA banner.
# I'll just rewrite the whole review page to be safe and clean.
new_review_code = """'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, Edit2, AlertTriangle, ArrowRight, Save, 
  User, Briefcase, Calculator, Building, Receipt, FileText, Download, ChevronRight, Lock, HeadphonesIcon
} from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function ReviewPage() {
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showCAUpsell, setShowCAUpsell] = useState(false);
  const router = useRouter();

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
        const data = JSON.parse(dataStr);
        setParsedData(data);
        
        // THE TRAP: If they have capital gains but selected the FREE plan (itr1), force upgrade.
        const selectedPlan = localStorage.getItem('selectedPlan');
        if (selectedPlan === 'itr1' && data.capital_gains > 0) {
           setShowUpgrade(true);
        }
      } catch (e) {}
    }
  }, []);

  const handleChange = (field: string, value: string) => {
    setParsedData({ ...parsedData, [field]: value });
  };

  const handleSave = async () => {
    setIsLoading(true);
    setTimeout(() => {
      localStorage.setItem('parsedTaxData', JSON.stringify(parsedData));
      setIsEditing(false);
      setIsLoading(false);
    }, 800);
  };

  const handleProceed = () => {
      const selectedPlan = localStorage.getItem('selectedPlan');
      if (selectedPlan === 'itr1' && parsedData.capital_gains > 0) {
          setShowUpgrade(true);
      } else {
          router.push('/compare');
      }
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'income', label: 'Income Sources', icon: Briefcase },
    { id: 'deductions', label: 'Deductions', icon: Receipt },
    { id: 'taxes', label: 'Taxes Paid', icon: FileText },
  ];

  const fmt = (val: number) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 relative">
      
      {/* CA Upsell Sticky Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 text-white flex flex-col sm:flex-row items-center justify-between shadow-lg shadow-orange-500/20">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl">
             <HeadphonesIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight">Afraid of making a mistake?</h3>
            <p className="text-white/90 text-sm">Hire a NexTax Expert CA to review and file your return for you.</p>
          </div>
        </div>
        <button onClick={() => setShowCAUpsell(true)} className="mt-4 sm:mt-0 bg-white text-orange-600 font-bold px-6 py-2.5 rounded-xl hover:shadow-lg transition-all shrink-0">
          Book CA - ₹2,999
        </button>
      </div>

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
          <button onClick={handleProceed} className="btn-primary flex items-center gap-2">
            Compute Tax <ArrowRight size={16} />
          </button>
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
                      <label className="text-sm font-semibold text-slate-700">PAN Number</label>
                      <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 font-medium text-slate-800 uppercase">{parsedData.pan || 'Not Provided'}</div>
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
                  </div>
                  
                  <div className="space-y-6">
                    <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50">
                      <h3 className="font-semibold text-slate-800 mb-4">Salary Income (Form 16)</h3>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">Gross Salary</label>
                        {isEditing ? (
                          <input type="number" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500" value={parsedData.gross_salary} onChange={(e) => handleChange('gross_salary', e.target.value)} />
                        ) : (
                          <div className="px-4 py-3 bg-white rounded-xl border border-slate-200 font-bold text-slate-800">{fmt(parsedData.gross_salary)}</div>
                        )}
                      </div>
                    </div>

                    <div className="p-5 rounded-xl border border-rose-100 bg-rose-50/30">
                      <h3 className="font-semibold text-rose-900 mb-4 flex items-center gap-2">
                        Capital Gains (Stocks/MF) 
                        {Number(parsedData.capital_gains) > 0 && <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">Pro Plan Required</span>}
                      </h3>
                      <div className="space-y-1.5">
                        {isEditing ? (
                           <input type="number" className="w-full px-4 py-2.5 rounded-xl border border-rose-200 focus:ring-2 focus:ring-rose-500" value={parsedData.capital_gains} onChange={(e) => handleChange('capital_gains', e.target.value)} />
                        ) : (
                          <div className="px-4 py-3 bg-white rounded-xl border border-rose-200 font-bold text-rose-700">{fmt(parsedData.capital_gains)}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'deductions' && (
                <motion.div key="deductions" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
                   <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                     <Receipt className="text-amber-500" /> Tax Deductions
                   </h2>
                   <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 font-bold text-slate-800">80C: {fmt(parsedData.deductions_80c)}</div>
                </motion.div>
              )}
              {activeTab === 'taxes' && (
                <motion.div key="taxes" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
                   <h2 className="text-xl font-bold text-slate-800 mb-6">Taxes Already Paid (TDS)</h2>
                   <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 font-bold text-slate-800">{fmt(parsedData.tds_deducted)}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* MODALS */}

      {/* Upgrade Trap Modal */}
      {showUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} className="bg-white rounded-3xl max-w-md w-full p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-rose-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Upgrade to Pro</h2>
            <p className="text-slate-600 mb-6">We detected <strong className="text-slate-800">Capital Gains</strong> from your uploads. The FREE plan only supports basic Salary income. Please upgrade to ITR-2 to file these taxes legally.</p>
            <div className="space-y-3">
              <button onClick={() => { localStorage.setItem('selectedPlan', 'itr2'); setShowUpgrade(false); }} className="w-full bg-rose-600 text-white font-bold py-3 rounded-xl hover:bg-rose-700">
                Upgrade to ITR-2 (₹999)
              </button>
              <button onClick={() => setShowUpgrade(false)} className="w-full text-slate-500 font-medium py-3 hover:text-slate-800">
                Cancel & Remove Capital Gains
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* CA Upsell Modal */}
      {showCAUpsell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} className="bg-white rounded-3xl max-w-md w-full p-8 text-center shadow-2xl border-4 border-orange-500">
             <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HeadphonesIcon className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Expert CA Assisted Filing</h2>
            <p className="text-slate-600 mb-6">A verified Chartered Accountant will be assigned to review your documents, maximize your tax savings, and file on your behalf.</p>
            <div className="space-y-3">
              <button onClick={() => { alert("Redirect to Stripe/Razorpay Checkout for ₹2999!"); setShowCAUpsell(false); }} className="w-full bg-orange-600 text-white font-bold py-3 rounded-xl hover:bg-orange-700">
                Pay ₹2,999 & Assign CA
              </button>
              <button onClick={() => setShowCAUpsell(false)} className="w-full text-slate-500 font-medium py-3 hover:text-slate-800">
                No thanks, I'll file myself
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
"""
with open(review_path, 'w', encoding='utf-8') as f:
    f.write(new_review_code)

print("Business model updated.")
