'use client';

import React, { useState, useEffect } from 'react';
import {
  Download,
  FileJson,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Zap,
  Send,
  Loader2,
  Lock,
  Award,
  Check,
  FileText,
  Printer,
  ChevronRight,
  ExternalLink,
  Activity,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function ExportPage() {
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'done'>('idle');
  const [efileStatus, setEfileStatus] = useState<'idle' | 'submitting' | 'everify_pending' | 'verified'>('idle');
  const [everifyOtp, setEverifyOtp] = useState('');
  const [isEverifying, setIsEverifying] = useState(false);
  const [everifyDeadline, setEverifyDeadline] = useState('');
  const [ackDetails, setAckDetails] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSimulated, setIsSimulated] = useState(false);

  // Taxpayer details from local storage
  const [pan, setPan] = useState('');
  const [name, setName] = useState('Taxpayer');
  const [paymentSuccessTxnid, setPaymentSuccessTxnid] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedPan = localStorage.getItem('verified_pan');
      const storedName = localStorage.getItem('verified_name');
      if (storedPan) setPan(storedPan);
      if (storedName) setName(storedName);

      // Check payment params
      const urlParams = new URLSearchParams(window.location.search);
      const isSuccess = urlParams.get('payment') === 'success';
      const txnid = urlParams.get('txnid') || localStorage.getItem('last_payment_txnid');
      if (isSuccess || urlParams.get('payment') === 'simulated' || txnid) {
        setPaymentSuccessTxnid(txnid || 'TEST_PAYU_SUCCESS');
      }

      // Check if already filed in this session
      const alreadyFiled = localStorage.getItem('itr_filed') === 'true';
      const storedAck = localStorage.getItem('ack_number');
      const sim = localStorage.getItem('is_simulated_filing') === 'true';
      setIsSimulated(sim);

      const isAlreadyVerified = localStorage.getItem('itr_verified') === 'true';
      if (alreadyFiled && storedAck) {
        setAckDetails({
          ack_number: storedAck,
          date: localStorage.getItem('ack_date') || 'Today',
          form: 'ITR-1 (Sahaj)',
          status: isAlreadyVerified ? 'Filed & e-Verified' : 'e-Verification Pending'
        });
        setEfileStatus(isAlreadyVerified ? 'verified' : 'everify_pending');
      }

      // Sync from backend filing status endpoint
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      if (token) {
        fetch(`${API_URL}/api/itr/status`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((statusData) => {
            if (
              statusData &&
              ['submitted', 'everify_pending', 'verified'].includes(statusData.status)
            ) {
              const ack = statusData.acknowledgement_number || localStorage.getItem('ack_number');
              if (statusData.verification_deadline) {
                setEverifyDeadline(statusData.verification_deadline);
              }
              if (ack) {
                setAckDetails({
                  ack_number: ack,
                  date: statusData.date_of_filing || localStorage.getItem('ack_date') || 'Recent',
                  form: 'ITR-1 (Sahaj)',
                  status: statusData.status === 'verified' ? 'Filed & e-Verified' : 'e-Verification Pending'
                });
                localStorage.setItem('itr_filed', 'true');
                localStorage.setItem('ack_number', ack);
                if (statusData.status === 'verified') {
                  localStorage.setItem('itr_verified', 'true');
                  setEfileStatus('verified');
                } else {
                  setEfileStatus('everify_pending');
                }
              }
            }
          })
          .catch(() => {});
      }
    }
  }, []);

  // 1. Direct 1-Click E-Filing via Sandbox API
  const handleDirectEfile = async () => {
    setEfileStatus('submitting');
    setErrorMessage('');

    const currentDate = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const res = await fetch(`${API_URL}/api/itr/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          assessment_year: '2025-26',
          tax_computation_id: 1,
          bank_account_id: 'PRIMARY_REFUND_ACC'
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMessage(data.detail || 'ITR submission failed. Please check your return and retry.');
        setEfileStatus('idle');
        return;
      }

      const ackNum = data.ack_number;
      if (!ackNum) {
        setErrorMessage('Filing submission did not return an acknowledgement number.');
        setEfileStatus('idle');
        return;
      }

      if (data.simulated) {
        localStorage.setItem('is_simulated_filing', 'true');
        setIsSimulated(true);
      } else {
        localStorage.removeItem('is_simulated_filing');
        setIsSimulated(false);
      }

      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + 30);
      const deadlineStr = deadlineDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      setEverifyDeadline(deadlineStr);

      const ackInfo = {
        ack_number: ackNum,
        date: currentDate,
        form: 'ITR-1 (Sahaj)',
        status: 'e-Verification Pending'
      };

      localStorage.setItem('itr_filed', 'true');
      localStorage.setItem('ack_number', ackNum);
      localStorage.setItem('ack_date', currentDate);

      setAckDetails(ackInfo);
      // Gated by Phase 4: Must e-verify before seeing "Filing Complete"
      setEfileStatus('everify_pending');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Network error during filing submission. Please retry.');
      setEfileStatus('idle');
    }
  };

  // 2. Submit Aadhaar OTP for e-Verification (Phase 4)
  const handleEverifySubmit = async () => {
    if (!everifyOtp || everifyOtp.trim().length !== 6) {
      setErrorMessage('Please enter a valid 6-digit Aadhaar OTP to complete e-verification.');
      return;
    }

    setIsEverifying(true);
    setErrorMessage('');

    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const res = await fetch(`${API_URL}/api/itr/everify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          otp: everifyOtp.trim(),
          acknowledgement_number: ackDetails?.ack_number,
          pan_number: pan || undefined,
          assessment_year: '2025-26'
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMessage(data.detail || 'e-Verification failed. Please check the OTP and retry.');
        setIsEverifying(false);
        return;
      }

      if (data.simulated) {
        localStorage.setItem('is_simulated_filing', 'true');
        setIsSimulated(true);
      }

      localStorage.setItem('itr_verified', 'true');
      setAckDetails((prev: any) => ({
        ...prev,
        status: data.simulated ? 'Filed & Verified (Demo)' : 'Filed & e-Verified'
      }));
      setEfileStatus('verified');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Network error during e-verification.');
    } finally {
      setIsEverifying(false);
    }
  };

  const handleResendEverifyOtp = async () => {
    setErrorMessage('');
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/itr/generate-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ pan_number: pan })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMessage(data.detail || 'Failed to resend Aadhaar OTP. Please try again.');
      } else {
        alert('Aadhaar OTP resent successfully to your registered mobile number.');
      }
    } catch {
      setErrorMessage('Failed to connect to OTP service.');
    }
  };

  // 3. Download JSON for manual offline filing
  const handleDownload = async () => {
    setDownloadStatus('downloading');
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const res = await fetch(`${API_URL}/api/profile/export-json`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDownloadStatus('idle');
        setErrorMessage(data.detail || 'Failed to export official ITR JSON. Please ensure your PAN and computation are reviewed.');
        return;
      }
      const jsonPayload = data;

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(jsonPayload, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute('href', dataStr);
      downloadAnchorNode.setAttribute('download', `ITR-1_AY2025-26_${pan || 'TAX'}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();

      setDownloadStatus('done');
    } catch (e) {
      console.error(e);
      setDownloadStatus('idle');
      alert('Please upload and review your Form 16 data first.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Step Indicator */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <span className="flex items-center gap-1 text-emerald-600">
          <Check className="w-3.5 h-3.5" /> 1. Link PAN
        </span>
        <span>&gt;</span>
        <span className="flex items-center gap-1 text-emerald-600">
          <Check className="w-3.5 h-3.5" /> 2. Review Deductions
        </span>
        <span>&gt;</span>
        <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md font-bold">
          3. File ITR & e-Verify
        </span>
      </div>

      {/* PayU Payment Success Banner */}
      {paymentSuccessTxnid && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-900 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="font-extrabold text-slate-900 flex items-center gap-2">
                <span>Payment Confirmed via PayU</span>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  {paymentSuccessTxnid}
                </span>
              </div>
              <span className="text-slate-600">Your filing plan is active. Proceed to submit your ITR to the Income Tax Department below.</span>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-200/80 text-emerald-900 px-2.5 py-1 rounded-lg">
            Paid
          </span>
        </div>
      )}

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          File Your ITR & Get Acknowledgement
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Submit directly to the Income Tax Department with 1-click E-Filing, or download the official JSON file.
        </p>
      </div>

      {/* PERSISTENT DEMO BANNER */}
      {isSimulated && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">DEMO DATA, not filed with the Income Tax Department</h4>
            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
              This filing session is operating in simulation mode. No actual return will be or has been submitted to Income Tax Department servers.
            </p>
          </div>
        </div>
      )}

      {/* ERROR MESSAGE BANNER */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl text-rose-900 flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Filing Submission Failed</h4>
              <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
            </div>
          </div>
          <button
            onClick={handleDirectEfile}
            disabled={efileStatus === 'submitting'}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors shrink-0"
          >
            Retry Submission
          </button>
        </div>
      )}

      {/* E-VERIFY PENDING STATE (Phase 4: Must e-Verify before Filing is Complete) */}
      <AnimatePresence>
        {efileStatus === 'everify_pending' && ackDetails && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border-2 border-indigo-500 p-6 sm:p-8 shadow-xl space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                    Step 2 of 2: Statutory e-Verification Required
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                    Return Submitted to ITD — e-Verify Now
                  </h2>
                  <p className="text-xs text-slate-500">
                    Your return has been transmitted. Under CBDT rules, an ITR is only valid after e-verification within 30 days.
                  </p>
                </div>
              </div>

              <div className="text-right sm:self-center">
                <span className="text-[11px] text-slate-400 block">Filing Acknowledgement</span>
                <span className="font-mono text-sm font-extrabold text-indigo-900 bg-indigo-50 px-3 py-1 rounded-lg inline-block mt-0.5">
                  {ackDetails.ack_number}
                </span>
              </div>
            </div>

            {/* Statutory Deadline Notice */}
            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>30-Day Mandatory Verification Window:</strong>
                <p className="mt-0.5 leading-relaxed text-amber-800">
                  Per CBDT Notification No. 5/2022, returns not verified within 30 days ({everifyDeadline ? `by ${everifyDeadline}` : 'within 30 days of submission'}) will be treated as invalid (non-est).
                </p>
              </div>
            </div>

            {/* Aadhaar OTP Input Box */}
            <div className="max-w-md mx-auto space-y-4 py-2">
              <label className="text-xs font-bold text-slate-800 block text-center">
                Enter 6-digit Aadhaar OTP sent to your registered mobile
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={everifyOtp}
                onChange={(e) => setEverifyOtp(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="123456"
                className="w-full text-center text-2xl font-mono font-bold tracking-[0.5em] py-3.5 border-2 border-indigo-200 rounded-2xl focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-300 placeholder:tracking-widest"
              />

              <button
                onClick={handleEverifySubmit}
                disabled={isEverifying || everifyOtp.length !== 6}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
              >
                {isEverifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Verifying with ITD...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> e-Verify Return with Aadhaar OTP
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 px-1">
                <span>Didn't receive Aadhaar OTP?</span>
                <button
                  onClick={handleResendEverifyOtp}
                  className="text-indigo-600 font-bold hover:underline"
                >
                  Resend OTP
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VERIFIED SUCCESS RECEIPT STATE (Only shown when status is 'verified') */}
      <AnimatePresence>
        {efileStatus === 'verified' && ackDetails && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border-2 border-emerald-500 p-6 sm:p-8 shadow-xl space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Official Government Submission
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                    ITR Filed Successfully!
                  </h2>
                  <p className="text-xs text-slate-500">
                    Your tax return has been received and verified by the Income Tax Department.
                  </p>
                </div>
              </div>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 shrink-0 self-start sm:self-auto"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
            </div>

            {/* Acknowledgement Table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-400 block">Taxpayer Name</span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block">{name}</span>
              </div>
              <div>
                <span className="text-slate-400 block">PAN Number</span>
                <span className="font-mono font-bold text-slate-800 text-sm mt-0.5 block">
                  {pan || 'ABCDE1234F'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Assessment Year</span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block">2025 - 2026</span>
              </div>
              <div>
                <span className="text-slate-400 block">Filing Status</span>
                <span className="font-bold text-emerald-600 text-sm mt-0.5 block flex items-center gap-1">
                  <Check className="w-4 h-4" /> Verified
                </span>
              </div>
            </div>

            {/* Acknowledgement Number Banner */}
            <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">ITR-V Acknowledgement Number</span>
                <span className="font-mono text-base font-extrabold text-emerald-900 tracking-wider">
                  {ackDetails.ack_number}
                </span>
              </div>
              <div className="text-slate-500 text-[11px]">
                Filed on: <strong>{ackDetails.date}</strong>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <Link
                  href="/dashboard"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs text-center transition-colors shadow-2xs"
                >
                  Back to Dashboard
                </Link>
                <Link
                  href="/refund"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs text-center transition-colors shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Track Refund Status</span>
                </Link>
                <Link
                  href="/verify-pan"
                  onClick={() => {
                    localStorage.removeItem('verified_pan');
                    localStorage.removeItem('verified_name');
                    localStorage.removeItem('parsedTaxData');
                    localStorage.removeItem('itr_filed');
                    localStorage.removeItem('ack_number');
                  }}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-semibold text-xs text-center transition-colors"
                >
                  + File Another Return
                </Link>
              </div>
              <a
                href="https://eportal.incometax.gov.in"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1 shrink-0"
              >
                <span>Check on Income Tax Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TWO FILING OPTIONS GRID (When not yet submitted) */}
      {efileStatus !== 'verified' && efileStatus !== 'everify_pending' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Card A: 1-Click Direct e-Filing (Recommended) */}
          <div className="bg-gradient-to-b from-indigo-50/60 via-white to-white rounded-3xl border-2 border-indigo-600/30 hover:border-indigo-600 p-6 sm:p-8 shadow-sm flex flex-col justify-between relative transition-all">
            <div className="absolute top-4 right-4">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-600 text-white px-2.5 py-1 rounded-full shadow-xs">
                Recommended
              </span>
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/25">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">1-Click Direct E-Filing</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Submit directly to the Income Tax Department servers via secure tax API gateway. Receive your instant acknowledgement number (ITR-V).
                </p>
              </div>

              <ul className="space-y-2 text-xs text-slate-600 pt-2">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>No need to log in to the ITD portal manually</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Instant e-verification receipt generation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Bank-grade 256-bit SSL encrypted transfer</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 mt-4 border-t border-slate-100">
              <button
                onClick={handleDirectEfile}
                disabled={efileStatus === 'submitting'}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
              >
                {efileStatus === 'submitting' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> E-Filing to Govt Portal...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" /> 1-Click E-File Now
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Card B: Download Official JSON (Offline Mode) */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <FileJson className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Download Official JSON</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Download the official ITR-1 (Sahaj) JSON file to manually upload to the Income Tax Department portal (eportal.incometax.gov.in).
                </p>
              </div>

              <ul className="space-y-2 text-xs text-slate-600 pt-2">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Pre-validated against latest ITD JSON schema</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Includes all 80C and salary computations</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Upload under "Offline Filing" mode</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 mt-4 border-t border-slate-100">
              <button
                onClick={handleDownload}
                disabled={downloadStatus === 'downloading'}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                {downloadStatus === 'downloading' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Generating JSON...
                  </>
                ) : downloadStatus === 'done' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Downloaded JSON
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" /> Download ITR JSON
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trust & Next Steps Strip */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>256-Bit SSL Encrypted</span>
          </div>
          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
            <Award className="w-3.5 h-3.5 text-slate-500" />
            <span>ISO 27001 Data Security</span>
          </div>
          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Official ERI Intermediary</span>
          </div>
        </div>
        <div>AY 2025-2026 Compliant</div>
      </div>
    </div>
  );
}
