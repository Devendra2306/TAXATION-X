'use client';

import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';

export default function VerifyPanPage() {
  const [pan, setPan] = useState('');
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
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
    if (!name.trim()) {
      setError("Please enter your name as it appears on your PAN card");
      return;
    }
    if (!dob) {
      setError("Please enter your date of birth");
      return;
    }
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      // Convert YYYY-MM-DD (HTML date input) to DD/MM/YYYY (Sandbox API format)
      const [yr, mo, dy] = dob.split('-');
      const dobFormatted = `${dy}/${mo}/${yr}`;

      const res = await fetch(`${API_URL}/api/itr/verify-pan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          pan_number: pan.toUpperCase(),
          name: name.trim(),
          dob: dobFormatted,
          otp: ""
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.detail || "Failed to verify PAN");
      }

      const data = await res.json();
      setSuccessData(data);
      localStorage.setItem('verified_pan', pan.toUpperCase());
      localStorage.setItem('verified_name', data.name || name);

      // Auto redirect after showing success message
      setTimeout(() => {
        router.push('/upload');
      }, 2500);

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
        <p className="text-slate-500">
          Enter your PAN details to verify identity via the Government KYC system and automatically fetch your tax data.
        </p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <form onSubmit={handleVerify} className="space-y-5">
          {/* PAN Number */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">PAN Number</label>
            <input
              type="text"
              maxLength={10}
              placeholder="ABCDE1234F"
              value={pan}
              onChange={(e) => setPan(e.target.value.toUpperCase())}
              className="w-full px-5 py-4 text-lg tracking-widest uppercase rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
              required
            />
          </div>

          {/* Name as on PAN */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Name as per PAN Card</label>
            <input
              type="text"
              placeholder="e.g. DEVENDRA DIWAKAR"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              required
            />
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Date of Birth</label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              required
            />
          </div>

          {/* Consent notice */}
          <p className="text-xs text-slate-400 bg-slate-50 rounded-xl p-4 leading-relaxed">
            By clicking "Verify PAN", you consent to sharing your PAN details with the Income Tax Department via the Sandbox.co.in KYC API for identity verification purposes.
          </p>

          {error && (
            <div className="flex items-start gap-2 text-rose-600 bg-rose-50 p-4 rounded-xl text-sm font-medium">
              <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
            </div>
          )}

          {successData && (
            <div className="flex flex-col items-center justify-center gap-3 text-emerald-700 bg-emerald-50 p-6 rounded-xl border border-emerald-100">
              <CheckCircle2 size={28} className="text-emerald-500" />
              <div className="font-bold text-lg">
                {successData.verified ? 'PAN Verified Successfully!' : 'PAN Check Complete'}
              </div>
              <div className="text-sm text-center">
                Name on record: <span className="font-semibold">{successData.name || name}</span>
              </div>
              {successData.aadhaar_linked && (
                <div className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                  Aadhaar linked
                </div>
              )}
              <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                <Loader2 size={12} className="animate-spin" /> Redirecting to document upload...
              </div>
            </div>
          )}

          {!successData && (
            <button
              type="submit"
              disabled={loading || pan.length < 10 || !name.trim() || !dob}
              className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-all"
            >
              {loading ? <Loader2 className="animate-spin" /> : (
                <>Securely Verify PAN <ArrowRight size={18} /></>
              )}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
