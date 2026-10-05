"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Phone, Eye, EyeOff, ShieldCheck, Award, Lock, ChevronUp, ChevronDown, Sparkles, TrendingUp, FileCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '@/components/Logo';

export default function LoginPage() {
  const [showOtherOptions, setShowOtherOptions] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username: email, password }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to login');
      }
      const data = await response.json();
      localStorage.setItem('access_token', data.access_token);
      router.push('/select-plan');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* LEFT — Brand panel */}
      <div className="hidden lg:flex flex-col w-[44%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-[hsl(260,80%,55%)] to-secondary" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNiI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />

        <div className="relative flex-1 flex flex-col justify-center px-12 xl:px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Floating cards illustration */}
            <div className="relative mb-12 h-48">
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute left-0 top-4 bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-xl w-48"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-400/30 flex items-center justify-center">
                    <FileCheck className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white/60 text-[10px] font-medium">Form 16 Parsed</p>
                    <p className="text-white text-sm font-bold">100% Accurate</p>
                  </div>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-full bg-emerald-400 rounded-full" />
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="absolute right-0 top-0 bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-xl w-44"
              >
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-amber-300" />
                  <span className="text-white text-xs font-semibold">Tax Saved</span>
                </div>
                <p className="text-2xl font-bold text-white">₹42,000</p>
              </motion.div>

              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute left-1/4 bottom-0 bg-white/15 backdrop-blur-md rounded-2xl p-3 border border-white/20 shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span className="text-white text-xs font-medium">AI Optimized</span>
                </div>
              </motion.div>
            </div>

            <h2 className="text-3xl xl:text-4xl font-bold text-white mb-4 leading-tight">
              File your ITR with<br />100% Accuracy
            </h2>

            <ul className="space-y-4 mt-8">
              {[
                'Maximum Tax Savings Guaranteed',
                'Notice Protection with Money Back Guarantee',
                'Seamless ITR filing with zero manual entry',
              ].map((text, i) => (
                <motion.li
                  key={text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
                  <span className="text-white/90 font-medium text-sm">{text}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>

        <div className="relative px-12 xl:px-16 pb-10">
          <Logo size="sm" href="/" className="[&_span]:text-white [&_span_span]:from-white [&_span_span]:to-emerald-200 mb-3" />
          <p className="text-xs text-white/50 leading-relaxed max-w-sm">
            Authorized E-Return Intermediary. 256-bit bank-grade encryption.
          </p>
        </div>
      </div>

      {/* RIGHT — Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-16 xl:px-20 relative bg-background">
        <div className="lg:hidden mb-8 flex justify-center">
          <Logo />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto w-full max-w-[420px]"
        >
          <div className="mb-8">
            <p className="text-sm font-semibold text-primary mb-1">Welcome back!</p>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Login to your account</h1>
          </div>

          <div className="space-y-4">
            <button 
              type="button"
              onClick={async () => {
                setLoading(true);
                try {
                  const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
                  const { auth } = await import('@/lib/firebase');
                  
                  const provider = new GoogleAuthProvider();
                  const result = await signInWithPopup(auth, provider);
                  
                  const user = result.user;
                  
                  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                  const mockPassword = String(user.uid).substring(0, 30); 
                  
                  // In case they are logging in for the very first time with Google, register them just in case.
                  await fetch(`${API_URL}/api/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ full_name: user.displayName || 'Google User', email: user.email, password: mockPassword }),
                  });
                  
                  const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({ username: user.email || '', password: mockPassword }),
                  });
                  
                  if (loginResponse.ok) {
                    const data = await loginResponse.json();
                    localStorage.setItem('access_token', data.access_token);
                    router.push('/select-plan');
                  } else {
                    throw new Error('Failed to login with Google on backend');
                  }
                } catch (err) {
                  console.error(err);
                  setError('Google login failed. Try again.');
                } finally {
                  setLoading(false);
                }
              }}
              className="w-full flex justify-center items-center gap-3 bg-white border border-border rounded-xl text-foreground font-medium py-3 text-sm hover:bg-muted hover:border-primary/20 transition-all shadow-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </button>

            <div className="flex items-center justify-center pt-1">
              <button
                onClick={() => setShowOtherOptions(!showOtherOptions)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-muted transition-colors"
              >
                Other sign-in options {showOtherOptions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            <AnimatePresence>
              {showOtherOptions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  <button className="w-full flex justify-center items-center gap-2 bg-white border border-border rounded-xl text-foreground font-medium py-2.5 text-sm hover:bg-muted transition-colors">
                    <Phone className="w-4 h-4 text-primary" />
                    Sign in with Phone
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative py-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-4 text-muted-foreground text-xs uppercase tracking-wider font-medium">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl"
                >
                  {error}
                </motion.div>
              )}
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="input-field"
              />

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="input-field pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 mt-2">
                {loading ? 'Logging in...' : 'Login'}
              </button>

              <div className="text-center pt-1">
                <a href="#" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                  Forgot Password?
                </a>
              </div>
            </form>

            <p className="text-center text-sm text-muted-foreground pt-4">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-semibold text-primary hover:text-primary/80 transition-colors">
                Sign up free
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Trust badges */}
        <div className="absolute bottom-6 right-6 lg:right-10 flex items-center gap-3">
          {[ShieldCheck, Award, Lock].map((Icon, i) => (
            <div key={i} className="flex items-center justify-center w-9 h-9 rounded-full bg-white border border-border text-muted-foreground shadow-sm">
              <Icon size={16} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
