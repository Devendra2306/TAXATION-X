"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Logo } from '@/components/Logo';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to register');
      }

      // Automatically log them in after registration
      const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          username: formData.email,
          password: formData.password,
        }),
      });

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        localStorage.setItem('access_token', loginData.access_token);
        router.push('/upload');
      } else {
        router.push('/login');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const perks = [
    'Free Form 16 auto-parsing',
    'Old vs New regime comparison',
    'AI-powered tax optimization',
    '256-bit encrypted data storage',
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-[44%] relative overflow-hidden flex-col justify-between p-12 xl:p-16">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(260,80%,55%)] via-primary to-secondary" />
        <div className="absolute inset-0 dot-pattern opacity-20" />

        <div className="relative">
          <Logo size="md" href="/" className="[&_span]:text-white [&_span_span]:from-white [&_span_span]:to-emerald-200" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <h2 className="text-3xl xl:text-4xl font-bold text-white mb-6 leading-tight">
            Start saving on taxes today
          </h2>
          <ul className="space-y-4">
            {perks.map((perk, i) => (
              <motion.li
                key={perk}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
                <span className="text-white/90 text-sm font-medium">{perk}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <p className="relative text-xs text-white/40">
          Join 8 million+ Indians who trust NexTax
        </p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-16 xl:px-20 bg-background">
        <div className="lg:hidden mb-8 flex justify-center">
          <Logo />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto w-full max-w-[420px]"
        >
          <div className="mb-8">
            <p className="text-sm font-semibold text-primary mb-1">Get started free</p>
            <h2 className="text-3xl font-bold text-foreground tracking-tight">Create your account</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
                Log in
              </Link>
            </p>
          </div>

          <div className="card-elevated p-8">
            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                try {
                  const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
                  const { auth } = await import('@/lib/firebase');
                  
                  const provider = new GoogleAuthProvider();
                  const result = await signInWithPopup(auth, provider);
                  
                  // Firebase provides the user object
                  const user = result.user;
                  
                  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                  // Send to backend to register/login in our local system
                  const mockPassword = String(user.uid).substring(0, 30); // Using UID as a dummy password for local system
                  
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
                    router.push('/upload');
                  } else {
                    throw new Error('Failed to login with Google on backend');
                  }
                } catch (err) {
                  console.error(err);
                  setError('Google sign up failed. Try again.');
                } finally {
                  setLoading(false);
                }
              }}
              className="w-full flex justify-center items-center gap-3 bg-white border border-border rounded-xl text-foreground font-medium py-3 text-sm hover:bg-muted hover:border-primary/20 transition-all shadow-sm mb-6"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign up with Google
            </button>

            <div className="relative py-3 mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-4 text-muted-foreground text-xs uppercase tracking-wider font-medium">Or continue with email</span>
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="full_name" className="block text-sm font-semibold text-foreground mb-1.5">
                  Full Name
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-1.5">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-foreground mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Min. 8 characters"
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="text-xs text-emerald-700 font-medium">Your data is secured with 256-bit encryption</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 disabled:opacity-70"
              >
                {loading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <>
                    Create Account <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
