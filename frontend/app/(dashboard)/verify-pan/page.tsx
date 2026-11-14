'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Sparkles,
  HelpCircle,
  MessageSquare,
  Lock,
  Award,
  Building2,
  FileText,
  Loader2,
  Check,
  RefreshCw,
  Phone,
  Mail,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Types for the 5 workflow stages
type FlowStep = 'pan_input' | 'itd_otp' | 'prefilling';

export default function StartFilingWorkflowPage() {
  const router = useRouter();

  // Current Step
  const [currentStep, setCurrentStep] = useState<FlowStep>('pan_input');

  // Form Fields
  const [panNumber, setPanNumber] = useState('');
  const [nameAsPerPan, setNameAsPerPan] = useState('');
  const [dob, setDob] = useState('');
  
  // Government ITD Aadhaar OTP State (6-digit array)
  const [itdOtp, setItdOtp] = useState(['', '', '', '', '', '']);

  // UI & Loading States
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [verifiedName, setVerifiedName] = useState('');
  const [supportDrawerOpen, setSupportDrawerOpen] = useState(false);

  // Timer State for OTP resend (seconds)
  const [resendTimer, setResendTimer] = useState(150);

  // Input refs for segmented OTP
  const itdRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentStep === 'itd_otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentStep, resendTimer]);

  // Format timer as M:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Helper for segmented ITD OTP typing
  const handleOtpChange = (val: string, index: number) => {
    const digit = val.replace(/[^0-9]/g, '').slice(-1);
    const targetState = [...itdOtp];
    targetState[index] = digit;
    setItdOtp(targetState);

    if (digit && index < 5) {
      itdRefs.current[index + 1]?.focus();
    }
  };

  // Helper for OTP backspace
  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !itdOtp[index] && index > 0) {
      itdRefs.current[index - 1]?.focus();
    }
  };

  // Helper for OTP paste
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pasted) return;

    const newOtp = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setItdOtp(newOtp);

    const focusIndex = Math.min(pasted.length, 5);
    itdRefs.current[focusIndex]?.focus();
  };

  // ============================================================
  // ACTION HANDLERS
  // ============================================================

  // 1. Submit PAN Details (Step 1 -> Step 2)
  const handlePanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanPan = panNumber.trim().toUpperCase();
    if (cleanPan.length !== 10) {
      setErrorMessage('Please enter a valid 10-character PAN number (e.g. ABCDE1234F)');
      return;
    }

    if (!dob.trim()) {
      setErrorMessage('Please specify Date of Birth in DD/MM/YYYY format');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      // Call PAN verification API
      const res = await fetch(`${API_URL}/api/itr/verify-pan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          pan_number: cleanPan,
          name: nameAsPerPan.trim() || 'Taxpayer',
          dob: dob.trim(),
          otp: ''
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMessage(data.detail || 'PAN verification failed. Please verify your details.');
        return;
      }

      // Store PAN in localStorage
      localStorage.setItem('verified_pan', cleanPan);
      const displayName = data.name || nameAsPerPan || 'Taxpayer';
      setVerifiedName(displayName);
      localStorage.setItem('verified_name', displayName);
      if (data.simulated) {
        localStorage.setItem('is_simulated_filing', 'true');
      } else {
        localStorage.removeItem('is_simulated_filing');
      }

      // Trigger Aadhaar/ITD OTP call
      const otpRes = await fetch(`${API_URL}/api/itr/generate-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ pan_number: cleanPan })
      });
      if (!otpRes.ok) {
        const otpErr = await otpRes.json().catch(() => ({}));
        setErrorMessage(otpErr.detail || 'Failed to send ITD Aadhaar OTP. Please try again.');
        return;
      }
      const otpData = await otpRes.json().catch(() => ({}));
      if (otpData.simulated) {
        localStorage.setItem('is_simulated_filing', 'true');
      }

      // Advance directly to real ITD Aadhaar OTP step
      setResendTimer(150);
      setCurrentStep('itd_otp');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Network error occurred during PAN verification. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  // 4. Submit ITD Pre-fill OTP (Step 4 -> Step 5 -> Review)
  const handleItdPrefill = async () => {
    setErrorMessage('');
    const fullItdOtp = itdOtp.join('');
    if (fullItdOtp.length < 6) {
      setErrorMessage('Please enter the 6-digit OTP to authorize government pre-fill');
      return;
    }

    setLoading(true);
    setCurrentStep('prefilling'); // Moves to Image 5 with sync animation

    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const res = await fetch(`${API_URL}/api/itr/prefill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          pan_number: panNumber.trim().toUpperCase(),
          otp: fullItdOtp
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setErrorMessage(errData.detail || 'Failed to verify OTP or fetch prefill data from Income Tax Department.');
        setCurrentStep('itd_otp');
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (data.simulated) {
        localStorage.setItem('is_simulated_filing', 'true');
      } else {
        localStorage.removeItem('is_simulated_filing');
      }

      localStorage.setItem(
        'parsedTaxData',
        JSON.stringify({
          gross_salary: data.gross_salary || 0,
          deductions_80c: data.deductions_80c || 0,
          tds_deducted: data.tds_deducted || 0,
          employer_name: data.employer_name || '',
          pan: panNumber.toUpperCase(),
          simulated: Boolean(data.simulated)
        })
      );

      setTimeout(() => {
        router.push('/review');
      }, 2500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to connect to ITD data service. Please try again.');
      setCurrentStep('itd_otp');
      setLoading(false);
    }
  };

  // 5. Skip Action (routes straight to manual upload)
  const handleSkip = () => {
    if (panNumber) {
      localStorage.setItem('verified_pan', panNumber.toUpperCase());
    }
    router.push('/upload');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 pt-4">
      {/* ============================================================ */}
      {/* TOP HEADER ROW: Breadcrumb / Title & Customer Support Card   */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {currentStep === 'pan_input' && 'Provide your PAN details'}
            {currentStep === 'itd_otp' && 'Enter Aadhaar / ITD OTP to fetch your tax details'}
            {currentStep === 'prefilling' && (
              <span className="flex items-center gap-2">
                Pre-fill your tax return in 5 seconds
                <span className="text-xs font-semibold text-indigo-600 underline cursor-pointer">
                  Learn More
                </span>
              </span>
            )}
          </h1>
        </div>

        {/* Top-Right Customer Support Pill Card (ClearTax Style) */}
        <div
          onClick={() => setSupportDrawerOpen(true)}
          className="self-start sm:self-auto bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl px-4 py-2.5 shadow-2xs flex items-center gap-3 cursor-pointer transition-all group"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
              <span>Customer Support</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="text-[11px] text-slate-400">AI and Human Assistance</div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MAIN CONTAINER: Split Card Interface                         */}
      {/* ============================================================ */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden min-h-[520px] flex flex-col justify-between">
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1">
          {/* ------------------------------------------------------------ */}
          {/* LEFT PANEL: Dynamic Information & Realistic Card Illustration */}
          {/* ------------------------------------------------------------ */}
          <div className="lg:col-span-5 relative overflow-hidden flex flex-col justify-between p-6 sm:p-8 text-white">
            {/* Background Theme: Blue for PAN, Dark Emerald for ITD */}
            <div
              className={`absolute inset-0 transition-colors duration-500 ${
                currentStep === 'itd_otp' || currentStep === 'prefilling'
                  ? 'bg-gradient-to-b from-[#063327] via-[#04281f] to-[#011711]'
                  : 'bg-gradient-to-b from-[#0b2559] via-[#081f4a] to-[#04122d]'
              }`}
            />

            {/* Subtle Grid Watermark */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

            <div className="relative z-10 space-y-6">
              {/* PAN Illustration Card (Steps 1, 2, 3) */}
              {currentStep === 'pan_input' && (
                <div className="space-y-6">
                  {/* Realistic PAN Card Mockup */}
                  <div className="w-full max-w-xs mx-auto aspect-[1.58/1] rounded-2xl p-4 bg-gradient-to-br from-blue-200 via-sky-100 to-indigo-100 text-slate-800 shadow-xl border border-sky-300/40 relative overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-400/30 pb-2">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-700">
                        आयकर विभाग <br />
                        <span className="text-[8px] font-normal text-slate-600">INCOME TAX DEPARTMENT</span>
                      </div>
                      <div className="text-[9px] font-bold text-right text-slate-700">
                        भारत सरकार <br />
                        <span className="text-[8px] font-normal text-slate-600">GOVT. OF INDIA</span>
                      </div>
                    </div>

                    {/* Middle: Number & Photo Placeholder */}
                    <div className="flex items-center justify-between mt-3">
                      <div>
                        <div className="text-[8px] text-slate-500">Permanent Account Number</div>
                        <div className="text-sm font-mono font-bold tracking-widest text-slate-900 mt-0.5">
                          {panNumber ? panNumber.toUpperCase() : 'YU00000000'}
                        </div>
                        <div className="text-[8px] text-slate-500 mt-2">Date of Birth</div>
                        <div className="text-[10px] font-mono text-slate-700 font-semibold">
                          {dob || 'DD/MM/YYYY'}
                        </div>
                      </div>

                      {/* Photo & Hologram */}
                      <div className="flex flex-col items-center gap-1.5 shrink-0">
                        <div className="w-8 h-8 rounded bg-gradient-to-tr from-amber-200 to-amber-100 border border-amber-300 shadow-inner flex items-center justify-center text-[7px] text-amber-800 font-bold">
                          HOLO
                        </div>
                        <div className="w-9 h-11 bg-slate-300 rounded border border-slate-400/50 flex items-center justify-center text-slate-500">
                          <UserCheck className="w-5 h-5 text-slate-500" />
                        </div>
                      </div>
                    </div>

                    {/* Bottom strip */}
                    <div className="absolute bottom-1.5 left-4 right-4 text-[7px] text-slate-500 font-mono tracking-tighter">
                      SIGNATURE / हस्ताक्षर
                    </div>
                  </div>

                  {/* Benefit Points */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-base font-bold text-white">Why is PAN required</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      PAN verification is mandatory to fetch your tax details from IT Dept and helps to -
                    </p>
                    <ul className="space-y-2 text-xs text-slate-200">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                        <span>Eliminate manual data entry</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                        <span>Generate a more accurate tax summary</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                        <span>Auto-fill personal and salary details</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* ITD Government Building Illustration (Steps 4 & 5) */}
              {(currentStep === 'itd_otp' || currentStep === 'prefilling') && (
                <div className="space-y-6">
                  {/* Government ITD Pillar graphic */}
                  <div className="w-full max-w-xs mx-auto aspect-[1.58/1] rounded-2xl p-4 bg-gradient-to-b from-emerald-900/60 to-emerald-950/90 border border-emerald-500/30 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-2">
                      <Building2 className="w-10 h-10 text-emerald-400" />
                    </div>
                    <span className="text-xs font-bold text-emerald-200 tracking-wide uppercase">
                      Income Tax Department
                    </span>
                    <span className="text-[10px] text-emerald-400/80">Government of India Portal</span>
                  </div>

                  <div className="space-y-3 pt-2">
                    <h3 className="text-base font-bold text-white">
                      Pre-fill your details from Income Tax Department
                    </h3>
                    <ul className="space-y-2 text-xs text-slate-200">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        <span>Eliminate manual data entry</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        <span>Generate a more accurate tax summary</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        <span>Auto-fill personal and salary details</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Highlight Pill */}
            <div className="relative z-10 mt-6 pt-4 border-t border-white/10 text-center">
              <span className="inline-block text-[11px] font-semibold text-sky-200/90 bg-white/10 px-3 py-1 rounded-full backdrop-blur-xs">
                {currentStep === 'itd_otp' || currentStep === 'prefilling'
                  ? 'Using Pre-fill, 90% users file in just 5 mins.'
                  : '90% users adding PAN finish their filing in 5mins'}
              </span>
            </div>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* RIGHT PANEL: Multi-step interactive forms                     */}
          {/* ------------------------------------------------------------ */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              {/* -------------------------------------------------------- */}
              {/* STEP 1: Enter PAN Details (Image 1)                      */}
              {/* -------------------------------------------------------- */}
              {currentStep === 'pan_input' && (
                <motion.div
                  key="step-pan"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="max-w-md mx-auto w-full space-y-6"
                >
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                      Enter your PAN Details
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      To verify your PAN and fetch your tax details from IT Dept.
                    </p>
                  </div>

                  <form onSubmit={handlePanSubmit} className="space-y-5">
                    {/* PAN Input */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">
                        PAN Card Number
                      </label>
                      <input
                        type="text"
                        maxLength={10}
                        placeholder="Enter 10 digit PAN"
                        value={panNumber}
                        onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                        className="w-full px-4 py-3.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none text-base font-mono uppercase tracking-wider transition-all placeholder:normal-case placeholder:font-sans placeholder:tracking-normal placeholder:text-slate-400"
                        required
                      />
                    </div>

                    {/* Date of Birth Input */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">
                        Date of Birth
                      </label>
                      <input
                        type="text"
                        placeholder="DD/MM/YYYY"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full px-4 py-3.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition-all placeholder:text-slate-400"
                        required
                      />
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Specify date in a format like DD/MM/YYYY
                      </span>
                    </div>

                    {/* Error Notice */}
                    {errorMessage && (
                      <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                        {errorMessage}
                      </div>
                    )}

                    {/* Continue Button */}
                    <button
                      type="submit"
                      disabled={loading || panNumber.length < 10 || !dob}
                      className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Verifying PAN...
                        </>
                      ) : (
                        'Continue'
                      )}
                    </button>

                    {/* Skip Link */}
                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={handleSkip}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                      >
                        Skip
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* -------------------------------------------------------- */}
              {/* STEP 4: Enter New OTP to fetch details from ITD (Image 4)*/}
              {/* -------------------------------------------------------- */}
              {currentStep === 'itd_otp' && (
                <motion.div
                  key="step-itd-otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="max-w-md mx-auto w-full space-y-6"
                >
                  {/* Verified Pill Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>PAN Verification Successful</span>
                  </div>

                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                      Enter New OTP to fetch your details from ITD
                    </h2>
                    <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500 mt-1">
                      <span>Verifying via IT Dept registered phone</span>
                      <button
                        onClick={() => setCurrentStep('pan_input')}
                        className="text-indigo-600 font-semibold hover:underline"
                      >
                        Change method
                      </button>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {/* ITD OTP Segment */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-2">
                        Enter OTP sent to your Phone number
                      </label>
                      <div className="flex items-center gap-2 sm:gap-3">
                        {itdOtp.map((digit, idx) => (
                          <input
                            key={`itd-${idx}`}
                            ref={(el) => {
                            itdRefs.current[idx] = el;
                          }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(e.target.value, idx)}
                            onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                            onPaste={(e) => handleOtpPaste(e)}
                            className="w-11 h-12 sm:w-12 sm:h-14 text-center text-lg font-bold border-2 border-slate-200 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                          />
                        ))}
                      </div>
                    </div>

                    <div className="text-xs text-slate-500">
                      OTPs may take up to 150s{' '}
                      {resendTimer > 0 ? (
                        <span className="text-emerald-700 font-medium">
                          Resend both OTPs ({formatTimer(resendTimer)})
                        </span>
                      ) : (
                        <button
                          onClick={() => setResendTimer(150)}
                          className="text-emerald-700 font-bold hover:underline"
                        >
                          Resend both OTPs
                        </button>
                      )}
                    </div>

                    {errorMessage && (
                      <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                        {errorMessage}
                      </div>
                    )}

                    {/* Pre-fill now button */}
                    <button
                      onClick={handleItdPrefill}
                      disabled={loading}
                      className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Authorizing ITD...
                        </>
                      ) : (
                        'Pre-fill now'
                      )}
                    </button>

                    {/* Skip */}
                    <div className="text-center pt-2">
                      <button
                        onClick={handleSkip}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                      >
                        Skip
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* -------------------------------------------------------- */}
              {/* STEP 5: Pre-fill in 5 seconds sync animation (Image 5)   */}
              {/* -------------------------------------------------------- */}
              {currentStep === 'prefilling' && (
                <motion.div
                  key="step-prefill-anim"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="max-w-md mx-auto w-full text-center space-y-8 py-12"
                >
                  {/* Animated Connecting Nodes */}
                  <div className="flex items-center justify-center gap-4 sm:gap-6 relative">
                    {/* ITD Server Node */}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/25 relative z-10">
                      <Building2 className="w-8 h-8" />
                    </div>

                    {/* Glowing Animated Wave */}
                    <div className="flex items-center gap-1.5 px-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce" />
                    </div>

                    {/* Client Tax Return Node */}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/25 relative z-10">
                      <FileText className="w-8 h-8" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-800">
                      Fetching your details from IT Portal
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                      Downloading Form 26AS, AIS, and pre-filling your salary & TDS records...
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ============================================================ */}
        {/* BOTTOM TRUST STRIP (ClearTax Style)                          */}
        {/* ============================================================ */}
        <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>SSL SECURE</span>
            </div>
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
              <Award className="w-3.5 h-3.5 text-slate-500" />
              <span>ISO 27001 Certified</span>
            </div>
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Secure Tax Preparation Platform</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400">
            Your data is 100% secure with NexTax.
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* CUSTOMER SUPPORT DRAWER / MODAL                              */}
      {/* ============================================================ */}
      <AnimatePresence>
        {supportDrawerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Tax Support Helpdesk</h3>
                    <p className="text-[11px] text-slate-400">AI and Human Assistance</p>
                  </div>
                </div>
                <button
                  onClick={() => setSupportDrawerOpen(false)}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
                >
                  ✕
                </button>
              </div>

              <div className="py-4 space-y-3 text-xs text-slate-600">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-800">Q: Not receiving OTP?</span>
                  <p className="mt-1">
                    ITD sends the OTP to the mobile number and email linked to your Aadhaar/PAN. Make sure your phone has active SMS reception, or wait for the 150s resend timer.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-800">Q: Can I skip pre-fill?</span>
                  <p className="mt-1">
                    Yes! Click "Skip" on any step to manually upload your Form 16 PDF or fill in your salary details.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <Link
                  href="/chat"
                  onClick={() => setSupportDrawerOpen(false)}
                  className="flex-1 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-colors text-center"
                >
                  Ask AI Tax Assistant
                </Link>
                <button
                  onClick={() => setSupportDrawerOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
