'use client';

import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'parsing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const router = useRouter();

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };

  // --- FILE UPLOAD LOGIC ---
  const uploadAndParseFile = async (uploadedFile: File) => {
    setStatus('uploading');
    setErrorMessage('');
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

      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        throw new Error(errJson?.detail || 'Upload failed. Please check your PDF and try again.');
      }

      setStatus('parsing');
      setProgress(80);
      const data = await response.json();
      
      localStorage.setItem('parsedTaxData', JSON.stringify(data.parsed_data));
      setProgress(100);
      setStatus('success');
      
      setTimeout(() => { router.push('/review'); }, 1500);
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error?.message || 'Upload failed. Please check your PDF and try again.');
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
        
        {/* Government Auto-Fetch Box (routes directly to dedicated single-point OTP verification) */}
        <div className="bg-gradient-to-b from-indigo-50 to-white rounded-3xl border-2 border-indigo-100 p-8 flex flex-col justify-between shadow-sm">
           <div>
             <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
               <ShieldCheck className="w-6 h-6 text-indigo-600" />
             </div>
             <h3 className="text-xl font-bold text-slate-800 mb-2">Government Auto-Fetch</h3>
             <p className="text-slate-600 mb-6 text-sm leading-relaxed">
               Connect to the Income Tax Department via Aadhaar OTP to automatically download your Form 26AS, AIS, and TIS in our secure verification flow.
             </p>
           </div>

           <div>
             <Link
               href="/verify-pan"
               className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
             >
               Start PAN &amp; Aadhaar Flow <ArrowRight className="w-4 h-4" />
             </Link>
             <p className="text-xs text-slate-400 text-center mt-3">
               Uses single-session OTP authentication
             </p>
           </div>
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
              {status === 'error' && (
                <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm max-w-md mx-auto text-left">
                  <p className="font-semibold text-rose-800">Extraction Unsuccessful</p>
                  <p className="mt-1">{errorMessage || 'Upload failed. Please check your PDF and try again.'}</p>
                </div>
              )}
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
