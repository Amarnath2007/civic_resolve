'use client';

import React, { useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, ShieldAlert, Lock, Mail, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, loginDemo, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

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
        // Normal citizen logged into admin portal -> reject and log out
        await logout();
        setError('Access Denied: Your account does not have municipal administrator privileges.');
      }
    } else {
      setError(res.error || 'Failed to authenticate administrator credentials.');
    }
  };

  const handleDemoAdmin = async () => {
    setError(null);
    setDemoLoading(true);
    const res = await loginDemo('admin');
    setDemoLoading(false);

    if (res.success && res.isAdmin) {
      router.push('/admin');
    } else {
      setError(res.error || 'Failed to authenticate demo administrator.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8F4] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-2xl border border-[#DDE5DF] p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-[#19364A] text-white rounded-2xl mx-auto flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#19364A]">Municipal Administrator Portal</h1>
          <p className="text-xs text-[#63736F]">
            Secure operations portal for municipal officers, department heads, and field supervisors.
          </p>
        </div>

        {/* Demo Fast Login for Evaluators */}
        <div className="p-4 bg-[#E7F0EA]/70 rounded-xl border border-[#24796C]/20 text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-[#19364A]">
            <UserCheck className="w-4 h-4 text-[#24796C]" />
            <span>Competition Judge / Evaluator Fast Access:</span>
          </div>
          <p className="text-[#63736F]">
            Click below to authenticate with the pre-provisioned municipal admin identity.
          </p>
          <button
            type="button"
            disabled={demoLoading}
            onClick={handleDemoAdmin}
            className="w-full py-2.5 px-3 bg-[#19364A] hover:bg-[#24796C] text-white font-semibold rounded-lg transition shadow-xs cursor-pointer text-center block text-xs disabled:opacity-50"
          >
            {demoLoading ? 'Authenticating Admin...' : 'Sign In as Demo Admin'}
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#19364A] mb-1">
              Municipal Officer Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#63736F] absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@civicresolve.gov"
                className="w-full text-sm pl-9 pr-3.5 py-2.5 rounded-lg border border-[#DDE5DF] bg-white text-[#19364A] focus:outline-none focus:ring-2 focus:ring-[#24796C]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#19364A] mb-1">
              Secure Password
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
            className="w-full py-3 rounded-lg bg-[#19364A] hover:bg-[#24796C] text-white font-semibold text-sm transition-all shadow-sm disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? 'Authenticating...' : 'Sign In to Admin Portal'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 border-t border-[#DDE5DF] flex items-center justify-between text-xs">
          <NextLink href="/" className="text-[#63736F] hover:text-[#19364A] transition font-medium">
            ← Return to Citizen Homepage
          </NextLink>
          <NextLink href="/login" className="text-[#24796C] font-semibold hover:underline">
            Citizen Sign In
          </NextLink>
        </div>
      </div>
    </div>
  );
}
