'use client';

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
