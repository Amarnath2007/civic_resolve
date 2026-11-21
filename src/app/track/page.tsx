'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight, HelpCircle } from 'lucide-react';

export default function TrackSearchPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    if (!clean) {
      setError('Please enter a valid complaint tracking code.');
      return;
    }
    router.push(`/track/${clean}`);
  };

  const sampleCodes = ['CR-2026-8491', 'CR-2026-3812', 'CR-2026-5129', 'CR-2026-9214', 'CR-2026-1044'];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-8">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 bg-[#E7F0EA] text-[#24796C] rounded-2xl mx-auto flex items-center justify-center">
          <Search className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-extrabold text-[#19364A] tracking-tight">
          Track Your Complaint
        </h1>
        <p className="text-sm text-[#63736F] max-w-md mx-auto">
          Enter your unique tracking code to view the live status, department routing, and official field updates.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#DDE5DF] p-6 sm:p-8 shadow-sm space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#19364A] uppercase tracking-wider mb-2">
              Complaint Tracking ID
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError(null);
                }}
                placeholder="e.g. CR-2026-8491"
                className="w-full text-base sm:text-lg font-mono px-4 py-3.5 rounded-xl border border-[#DDE5DF] bg-white text-[#19364A] uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#24796C] transition"
              />
            </div>
            {error && <p className="text-xs text-rose-600 mt-1.5">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-[#24796C] hover:bg-[#19364A] text-white font-bold text-sm sm:text-base transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Search Complaint Record</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick sample codes for judges */}
        <div className="border-t border-[#DDE5DF] pt-4 space-y-2">
          <span className="text-xs font-semibold text-[#63736F] flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Try one of these sample demonstration codes:</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {sampleCodes.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCode(c)}
                className="text-xs font-mono font-medium px-2.5 py-1 bg-[#F7F8F4] border border-[#DDE5DF] hover:border-[#24796C] rounded text-[#19364A] transition cursor-pointer"
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
