'use client';

import React, { useState, useEffect } from 'react';
import { UploadCloud, File, CheckCircle2, ShieldCheck, ArrowRight, Loader2, KeyRound } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'parsing' | 'success' | 'error'>('idle');
  
  // OTP Fetch State
  const [otpMode, setOtpMode] = useState<'idle' | 'requesting' | 'enter_otp' | 'verifying' | 'success'>('idle');
  const [otp, setOtp] = useState('');
  const [pan, setPan] = useState('');
  
  const router = useRouter();

  useEffect(() => {
    const verifiedPan = localStorage.getItem('verified_pan');
    if (verifiedPan) setPan(verifiedPan);
  }, []);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };

  // --- 1. AADHAAR OTP FETCH LOGIC ---
  const requestAadhaarOTP = async () => {
    setOtpMode('requesting');
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/itr/generate-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ pan_number: pan || 'ABCDE1234F', otp: '' })
      });
      if (!res.ok) throw new Error("Failed to send OTP");
      setOtpMode('enter_otp');
    } catch (err) {
      alert("Error sending OTP. Please upload documents manually.");
      setOtpMode('idle');
    }
  };

  const verifyAadhaarOTP = async () => {
    setOtpMode('verifying');
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/itr/prefill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ pan_number: pan || 'ABCDE1234F', otp })
      });
      if (!res.ok) throw new Error("Failed to verify OTP");
      
      const data = await res.json();
      // Simulating merging government data into our tax profile
      localStorage.setItem('parsedTaxData', JSON.stringify({
         gross_salary: data.salary_income || 1200000,
         tds_deducted: data.tds_deducted || 50000,
         pan: pan || data.pan
      }));
      setOtpMode('success');
      setTimeout(() => router.push('/review'), 2000);
    } catch (err) {
      alert("Invalid OTP.");
      setOtpMode('enter_otp');
    }
  };

  // --- 2. FILE UPLOAD LOGIC ---
  const uploadAndParseFile = async (uploadedFile: File) => {
    setStatus('uploading');
    setProgress(50);
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const response = await fetch(`${API_URL}/api/upload/form16`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      setStatus('parsing');
      setProgress(80);
      const data = await response.json();
      
      localStorage.setItem('parsedTaxData', JSON.stringify(data.parsed_data));
      setProgress(100);
      setStatus('success');
      
      setTimeout(() => { router.push('/review'); }, 1500);
    } catch (error) {
      setStatus('error');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      uploadAndParseFile(e.dataTransfer.files[0]);
    }
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      uploadAndParseFile(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <PageHeader
        title="Import Tax Data"
        subtitle="Fetch your data directly from the government, or upload your Form 16."
      />

      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Government Auto-Fetch Box */}
        <div className="bg-gradient-to-b from-indigo-50 to-white rounded-3xl border-2 border-indigo-100 p-8 flex flex-col justify-between shadow-sm">
           <div>
             <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
               <ShieldCheck className="w-6 h-6 text-indigo-600" />
             </div>
             <h3 className="text-xl font-bold text-slate-800 mb-2">Auto-Fetch (Recommended)</h3>
             <p className="text-slate-600 mb-6 text-sm leading-relaxed">Connect to the Income Tax Department via Aadhaar OTP to automatically download your Form 26AS, AIS, and TIS.</p>
           </div>

           <AnimatePresence mode="wait">
             {otpMode === 'idle' && (
                <motion.button key="btn1" onClick={requestAadhaarOTP} className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20">
                  Send Aadhaar OTP
                </motion.button>
             )}
             {otpMode === 'requesting' && (
                <motion.button key="btn2" disabled className="w-full py-3.5 bg-indigo-400 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin w-5 h-5" /> Connecting to ITD...
                </motion.button>
             )}
             {otpMode === 'enter_otp' && (
                <motion.div key="btn3" className="space-y-3">
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
                    <input type="text" maxLength={6} placeholder="Enter 6-digit OTP" className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-indigo-200 focus:ring-2 focus:ring-indigo-600 outline-none text-center font-bold tracking-widest text-lg" value={otp} onChange={e => setOtp(e.target.value)} />
                  </div>
                  <button onClick={verifyAadhaarOTP} className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors">Verify & Fetch Data</button>
                </motion.div>
             )}
             {otpMode === 'verifying' && (
                <motion.div key="btn4" className="w-full py-3.5 bg-indigo-100 text-indigo-700 rounded-xl font-bold flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin w-5 h-5" /> Downloading AIS...
                </motion.div>
             )}
             {otpMode === 'success' && (
                <motion.div key="btn5" className="w-full py-3.5 bg-emerald-100 text-emerald-700 rounded-xl font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> Data Fetched Successfully!
                </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* Manual Upload Box */}
        <div className={`bg-white rounded-3xl border-2 p-8 transition-all flex flex-col justify-center text-center ${isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-dashed border-slate-300'}`}
             onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
          
          {status === 'idle' || status === 'error' ? (
            <>
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <UploadCloud className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Manual Upload</h3>
              <p className="text-slate-500 text-sm mb-8">Upload your Form 16, Capital Gains CSV, or rent receipts. Our AI will extract the data instantly.</p>
              
              <label className="cursor-pointer bg-slate-900 text-white font-bold py-3.5 px-8 rounded-xl hover:bg-slate-800 transition-colors">
                Browse Files
                <input type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
              </label>
              {status === 'error' && <p className="text-rose-500 text-sm mt-4 font-medium">Upload failed. Please try again.</p>}
            </>
          ) : (
            <div className="py-8 flex flex-col items-center justify-center space-y-6">
              {status === 'success' ? (
                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-emerald-900">Extraction Complete</h3>
                  <p className="text-emerald-700 mt-2">AI has successfully read your document.</p>
                </motion.div>
              ) : (
                <div className="w-full max-w-xs space-y-4">
                  <div className="flex justify-between text-sm font-semibold text-slate-700">
                    <span>{status === 'uploading' ? 'Uploading...' : 'AI is reading your form...'}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <motion.div className="bg-primary h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
