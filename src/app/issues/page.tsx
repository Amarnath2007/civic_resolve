'use client';

import React, { useEffect, useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PublicReport, CivicCategory } from '@/types';
import { CIVIC_CATEGORIES } from '@/lib/constants';
import {
  Activity,
  MapPin,
  ThumbsUp,
  Filter,
  ShieldCheck,
  Search,
  ArrowRight,
  Sparkles,
  Building2,
  Users,
} from 'lucide-react';

export default function NeighbourhoodPulsePage() {
  const router = useRouter();
  const { user, idToken } = useAuth();
  const [reports, setReports] = useState<PublicReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [localityFilter, setLocalityFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [votedMap, setVotedMap] = useState<Record<string, number>>({});
  const [voteFeedback, setVoteFeedback] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchPublicReports() {
      setLoading(true);
      try {
        const res = await fetch('/api/reports/public');
        const data = await res.json();
        if (res.ok) {
          setReports(data.reports || []);
        }
      } catch (err) {
        console.error('Error fetching public reports:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPublicReports();
  }, []);

  const handleSupport = async (reportId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`/api/reports/${reportId}/support`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        setVotedMap((prev) => ({ ...prev, [reportId]: data.supportCount }));
        setVoteFeedback((prev) => ({ ...prev, [reportId]: 'Supported!' }));
      } else {
        setVoteFeedback((prev) => ({ ...prev, [reportId]: data.message || 'Already voted' }));
      }
    } catch {
      setVoteFeedback((prev) => ({ ...prev, [reportId]: 'Vote failed' }));
    }
  };

  // Derive unique localities
  const localities = Array.from(new Set(reports.map((r) => r.locality).filter(Boolean)));

  const filtered = reports.filter((r) => {
    if (categoryFilter !== 'All' && r.category !== categoryFilter) return false;
    if (localityFilter !== 'All' && r.locality !== localityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        r.title.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q) ||
        r.locality.toLowerCase().includes(q) ||
        r.trackingCode.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#24796C] animate-pulse" />
          <span className="text-xs font-semibold text-[#24796C] uppercase tracking-wider">
            Community-Powered Civic Watch
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#19364A] tracking-tight">
          Neighbourhood Pulse
        </h1>
        <p className="text-xs sm:text-sm text-[#63736F] max-w-2xl leading-relaxed">
          Explore recurring community issues, see problems reported in your locality, and support
          existing complaints instead of submitting duplicates.
        </p>

        {/* Privacy badge */}
        <div className="inline-flex items-center gap-2 bg-[#E7F0EA] border border-[#24796C]/20 px-3.5 py-1.5 rounded-lg text-xs text-[#24796C]">
          <ShieldCheck className="w-4 h-4" />
          <span>
            Privacy Guarantee: All reports displayed here are explicitly approved for public sharing.
            Reporter personal identities and exact private home coordinates are completely omitted.
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-[#DDE5DF] p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-[#63736F] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keyword, street, or ID..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-[#DDE5DF] bg-[#F7F8F4] focus:outline-none focus:ring-1 focus:ring-[#24796C]"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-[#DDE5DF] bg-[#F7F8F4] text-[#19364A] focus:outline-none focus:ring-1 focus:ring-[#24796C]"
          >
            <option value="All">All Categories</option>
            {CIVIC_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Locality Dropdown */}
          <select
            value={localityFilter}
            onChange={(e) => setLocalityFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-[#DDE5DF] bg-[#F7F8F4] text-[#19364A] focus:outline-none focus:ring-1 focus:ring-[#24796C]"
          >
            <option value="All">All Localities</option>
            {localities.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        <NextLink
          href="/report"
          className="text-xs font-semibold px-4 py-2 bg-[#24796C] text-white rounded-lg hover:bg-[#19364A] transition shadow-xs"
        >
          Report an Issue
        </NextLink>
      </div>

      {/* Grid of Public Complaints */}
      {loading ? (
        <div className="py-20 text-center text-xs text-[#63736F]">
          Loading neighbourhood issues...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#DDE5DF] p-12 text-center text-[#63736F] space-y-2">
          <p className="text-sm font-semibold text-[#19364A]">No reports found matching your filters.</p>
          <p className="text-xs">Try clearing your search query or selecting "All Categories".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((report) => {
            const currentCount = votedMap[report.id] !== undefined ? votedMap[report.id] : report.supportCount;
            const feedback = voteFeedback[report.id];

            return (
              <div
                key={report.id}
                className="bg-white rounded-xl border border-[#DDE5DF] p-5 shadow-sm hover:border-[#24796C] transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-[#63736F]">
                      {report.trackingCode}
                    </span>
                    <PriorityBadge priority={report.priority} size="sm" />
                  </div>

                  <h3 className="text-base font-bold text-[#19364A] line-clamp-2">
                    {report.title}
                  </h3>

                  <p className="text-xs text-[#63736F] line-clamp-3 leading-relaxed">
                    {report.summary}
                  </p>

                  {/* Privacy-safe AI visual inspection badge */}
                  {report.imageObservations && report.imageObservations.length > 0 && (
                    <div className="bg-[#E7F0EA] p-2.5 rounded-lg border border-[#24796C]/20 text-[11px] text-[#24796C] space-y-0.5">
                      <span className="font-semibold block">AI Visual Evidence:</span>
                      <span className="text-[#19364A] line-clamp-2">{report.imageObservations[0]}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-3 border-t border-[#DDE5DF]">
                  <div className="flex items-center justify-between text-xs text-[#63736F]">
                    <span className="flex items-center gap-1 font-medium text-[#19364A]">
                      <MapPin className="w-3.5 h-3.5 text-[#24796C]" />
                      {report.locality}
                    </span>
                    <StatusBadge status={report.status} size="sm" />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    {/* Support Button */}
                    <button
                      type="button"
                      onClick={() => handleSupport(report.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#E7F0EA] hover:bg-[#24796C] hover:text-white text-[#24796C] transition cursor-pointer"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{currentCount} Supporters</span>
                      {feedback && <span className="text-[10px] ml-1 font-bold">({feedback})</span>}
                    </button>

                    <NextLink
                      href={`/track/${report.trackingCode}`}
                      className="text-xs font-semibold text-[#24796C] hover:underline flex items-center gap-1"
                    >
                      <span>Track</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </NextLink>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
