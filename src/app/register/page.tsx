'use client';

import React, { useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Building2, Lock, Mail, User, AlertCircle, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const res = await register(email, password, name);
    setLoading(false);

    if (res.success) {
      router.push('/my-reports');
    } else {
      setError(res.error || 'Failed to register account.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-2xl border border-[#DDE5DF] p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-[#24796C] text-white rounded-xl mx-auto flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#19364A]">Create Citizen Account</h1>
          <p className="text-xs text-[#63736F]">
            Join your neighbours in reporting, tracking, and resolving municipal issues.
          </p>
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
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#63736F] absolute left-3 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Priya Raman"
                className="w-full text-sm pl-9 pr-3.5 py-2.5 rounded-lg border border-[#DDE5DF] bg-white text-[#19364A] focus:outline-none focus:ring-2 focus:ring-[#24796C]"
              />
            </div>
          </div>

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
              Password (min 6 characters)
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

          <div>
            <label className="block text-xs font-semibold text-[#19364A] mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#63736F] absolute left-3 top-3" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? 'Creating Account...' : 'Complete Registration'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-[#63736F] pt-2 border-t border-[#DDE5DF]">
          Already have an account?{' '}
          <NextLink href="/login" className="font-semibold text-[#24796C] hover:underline">
            Sign In here
          </NextLink>
        </div>
      </div>
    </div>
  );
}
