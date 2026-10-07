import os

# 1. Update login redirect to go to /select-plan instead of /upload
login_path = r"frontend\app\(auth)\login\page.tsx"
with open(login_path, 'r', encoding='utf-8') as f:
    login_code = f.read()
login_code = login_code.replace("router.push('/upload')", "router.push('/select-plan')")
with open(login_path, 'w', encoding='utf-8') as f:
    f.write(login_code)

# 2. Update register redirect
register_path = r"frontend\app\(auth)\signup\page.tsx"
if os.path.exists(register_path):
    with open(register_path, 'r', encoding='utf-8') as f:
        register_code = f.read()
    register_code = register_code.replace("router.push('/upload')", "router.push('/select-plan')")
    register_code = register_code.replace("router.push('/login')", "router.push('/select-plan')")
    with open(register_path, 'w', encoding='utf-8') as f:
        f.write(register_code)

# 3. Create select-plan page
os.makedirs(r"frontend\app\(dashboard)\select-plan", exist_ok=True)
select_plan_code = """'use client';

import React, { useState } from 'react';
import { CheckCircle2, HelpCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const plans = [
  { id: 'itr1', title: 'Salaried (ITR-1)', price: '₹499', forms: 'Form 16, Salary, 1 House', popular: true },
  { id: 'itr2', title: 'Capital Gains (ITR-2)', price: '₹999', forms: 'Stocks, MF, Crypto, Salary', popular: false },
  { id: 'itr4', title: 'Business/Pro (ITR-4)', price: '₹1,499', forms: 'Freelance, Business, Presumptive', popular: false },
];

export default function SelectPlanPage() {
  const router = useRouter();
  const [showSurvey, setShowSurvey] = useState(false);
  const [surveyStep, setSurveyStep] = useState(0);
  const [recommended, setRecommended] = useState<string | null>(null);

  const handleSelect = (planId: string) => {
    localStorage.setItem('selectedPlan', planId);
    router.push('/verify-pan');
  };

  const answer = (isBusiness: boolean, isCrypto: boolean) => {
    if (isBusiness) setRecommended('itr4');
    else if (isCrypto) setRecommended('itr2');
    else setRecommended('itr1');
    setSurveyStep(1);
  };

  return (
    <div className="max-w-5xl mx-auto py-12 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Choose your filing plan</h1>
        <p className="text-slate-600 max-w-xl mx-auto">Select the type of income you have. Don't worry, if our AI finds out you selected the wrong one later, we'll automatically adjust it for you.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className={`relative bg-white rounded-3xl border-2 p-6 flex flex-col transition-all hover:-translate-y-1 hover:shadow-xl ${plan.popular ? 'border-indigo-600 shadow-lg shadow-indigo-100' : 'border-slate-200 hover:border-indigo-300'}`}>
            {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">Most Popular</div>}
            
            <h3 className="text-xl font-bold text-slate-800 mb-2">{plan.title}</h3>
            <p className="text-sm text-slate-500 mb-6 h-10">{plan.forms}</p>
            
            <div className="text-3xl font-extrabold text-slate-800 mb-6">{plan.price}</div>
            
            <button onClick={() => handleSelect(plan.id)} className={`mt-auto w-full py-3 rounded-xl font-semibold transition-colors ${plan.popular ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
              Select Plan
            </button>
          </div>
        ))}
      </div>

      {/* Survey Toggle */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 md:p-8 text-center max-w-2xl mx-auto">
        {!showSurvey ? (
          <>
            <HelpCircle className="w-10 h-10 text-indigo-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-indigo-900 mb-2">Not sure which one to pick?</h3>
            <button onClick={() => setShowSurvey(true)} className="text-indigo-600 font-semibold hover:underline">Answer 2 quick questions to find out &rarr;</button>
          </>
        ) : (
          <AnimatePresence mode="wait">
            {surveyStep === 0 ? (
              <motion.div key="q1" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-4">
                <h3 className="text-lg font-bold text-indigo-900 mb-4">What's your primary income source?</h3>
                <div className="flex flex-col gap-3">
                  <button onClick={() => answer(false, false)} className="p-3 bg-white border border-indigo-200 rounded-xl hover:border-indigo-500 font-medium">Just Salary / Pension</button>
                  <button onClick={() => answer(false, true)} className="p-3 bg-white border border-indigo-200 rounded-xl hover:border-indigo-500 font-medium">Salary + Stocks/Crypto Trading</button>
                  <button onClick={() => answer(true, false)} className="p-3 bg-white border border-indigo-200 rounded-xl hover:border-indigo-500 font-medium">Freelancing or Business</button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="result" initial={{opacity:0}} animate={{opacity:1}} className="space-y-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h3 className="text-xl font-bold text-slate-800">You need {plans.find(p => p.id === recommended)?.title}</h3>
                <button onClick={() => handleSelect(recommended!)} className="mt-4 bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold">Proceed with this plan</button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
"""
with open(r"frontend\app\(dashboard)\select-plan\page.tsx", 'w', encoding='utf-8') as f:
    f.write(select_plan_code)

# 4. Create verify-pan page
os.makedirs(r"frontend\app\(dashboard)\verify-pan", exist_ok=True)
verify_pan_code = """'use client';

import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';

export default function VerifyPanPage() {
  const [pan, setPan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState<any>(null);
  const router = useRouter();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pan.length !== 10) {
      setError("PAN must be exactly 10 characters");
      return;
    }
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      const res = await fetch(`${API_URL}/api/itr/verify-pan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ pan_number: pan.toUpperCase(), otp: "" })
      });

      if (!res.ok) throw new Error("Failed to verify PAN");
      
      const data = await res.json();
      setSuccessData(data);
      localStorage.setItem('verified_pan', pan.toUpperCase());
      
      // Auto redirect after showing success message briefly
      setTimeout(() => {
        router.push('/upload');
      }, 2000);

    } catch (err: any) {
      setError(err.message || "An error occurred during verification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pt-12">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800">Verify your Identity</h1>
        <p className="text-slate-500">To ensure maximum security and automatically fetch your data from the Income Tax Department, please link your PAN.</p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Permanent Account Number (PAN)</label>
            <input 
              type="text" 
              maxLength={10}
              placeholder="ABCDE1234F"
              value={pan}
              onChange={(e) => setPan(e.target.value.toUpperCase())}
              className="w-full px-5 py-4 text-lg tracking-widest uppercase rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              required
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-rose-600 bg-rose-50 p-4 rounded-xl text-sm font-medium">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {successData && (
            <div className="flex flex-col items-center justify-center gap-2 text-emerald-700 bg-emerald-50 p-6 rounded-xl border border-emerald-100">
              <ShieldCheck size={24} className="text-emerald-500" />
              <div className="font-bold text-lg">PAN Verified Successfully!</div>
              <div className="text-sm">Name on Record: {successData.name || "Fetching..."}</div>
              <div className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                <Loader2 size={12} className="animate-spin" /> Redirecting to data upload...
              </div>
            </div>
          )}

          {!successData && (
            <button 
              type="submit" 
              disabled={loading || pan.length < 10}
              className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-all"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Securely Verify PAN'}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
"""
with open(r"frontend\app\(dashboard)\verify-pan\page.tsx", 'w', encoding='utf-8') as f:
    f.write(verify_pan_code)

print("Flow updated.")
