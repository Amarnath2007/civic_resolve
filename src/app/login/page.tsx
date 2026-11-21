'use client';

import React, { useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Building2, Lock, Mail, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      if (res.isAdmin) {
        router.push('/admin');
      } else {
        router.push('/my-reports');
      }
    } else {
      setError(res.error || 'Failed to sign in. Please verify your credentials.');
    }
  };

  const handleDemoLogin = async (role: 'citizen' | 'admin') => {
    setError(null);
    setDemoLoading(role);
    const res = await loginDemo(role);
    setDemoLoading(null);

    if (res.success) {
      if (role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/my-reports');
      }
    } else {
      setError(res.error || 'Could not authenticate demo account with Firebase.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-2xl border border-[#DDE5DF] p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-[#19364A] text-white rounded-xl mx-auto flex items-center justify-center shadow-xs">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#19364A]">Sign In to CivicResolve</h1>
          <p className="text-xs text-[#63736F]">
            Access your complaints, track resolution updates, or enter the administrator portal.
          </p>
        </div>

        {/* Demo Fast Login Buttons for Evaluators */}
        <div className="bg-[#E7F0EA]/70 p-4 rounded-xl border border-[#24796C]/20 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#19364A]">
            <UserCheck className="w-4 h-4 text-[#24796C]" />
            <span>Judge / Evaluator Fast Access:</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              disabled={Boolean(demoLoading)}
              onClick={() => handleDemoLogin('citizen')}
              className="py-2 px-3 rounded-lg bg-white border border-[#DDE5DF] font-semibold text-[#19364A] hover:border-[#24796C] transition shadow-xs cursor-pointer text-center disabled:opacity-50"
            >
              {demoLoading === 'citizen' ? 'Authenticating...' : 'Demo Citizen'}
            </button>
            <button
              type="button"
              disabled={Boolean(demoLoading)}
              onClick={() => handleDemoLogin('admin')}
              className="py-2 px-3 rounded-lg bg-[#19364A] text-white font-semibold hover:bg-[#24796C] transition shadow-xs cursor-pointer text-center disabled:opacity-50"
            >
              {demoLoading === 'admin' ? 'Authenticating...' : 'Demo Admin'}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#19364A] mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#63736F] absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="citizen@civicresolve.org"
                className="w-full text-sm pl-9 pr-3.5 py-2.5 rounded-lg border border-[#DDE5DF] bg-white text-[#19364A] focus:outline-none focus:ring-2 focus:ring-[#24796C]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#19364A] mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#63736F] absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-sm pl-9 pr-3.5 py-2.5 rounded-lg border border-[#DDE5DF] bg-white text-[#19364A] focus:outline-none focus:ring-2 focus:ring-[#24796C]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[#24796C] hover:bg-[#19364A] text-white font-semibold text-sm transition-all shadow-sm disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? 'Signing in...' : 'Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-[#63736F] pt-2 border-t border-[#DDE5DF]">
          Don&apos;t have an account yet?{' '}
          <NextLink href="/register" className="font-semibold text-[#24796C] hover:underline">
            Register as a Citizen
          </NextLink>
        </div>
      </div>
    </div>
  );
}
