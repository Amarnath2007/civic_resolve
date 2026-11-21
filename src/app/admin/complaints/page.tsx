'use client';

import React, { useEffect, useState, Suspense } from 'react';
import NextLink from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Report } from '@/types';
import {
  CIVIC_CATEGORIES,
  CIVIC_DEPARTMENTS,
  COMPLAINT_STATUSES,
  PRIORITY_LEVELS,
} from '@/lib/constants';
import {
  Search,
  Filter,
  Eye,
  RefreshCw,
  FileText,
  MapPin,
  Download,
} from 'lucide-react';

function ComplaintQueueContent() {
  const searchParams = useSearchParams();
  const { idToken } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const initialSearch = searchParams.get('search') || '';
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
      const res = await fetch('/api/reports', { headers });
      if (res.ok) {
        const d = await res.json();
        setReports(d.reports || []);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [idToken]);

  const filtered = reports.filter((r) => {
    if (statusFilter !== 'All' && r.status !== statusFilter) return false;
    if (categoryFilter !== 'All' && r.finalCategory !== categoryFilter) return false;
    if (priorityFilter !== 'All' && r.finalPriority !== priorityFilter) return false;
    if (departmentFilter !== 'All' && r.finalDepartment !== departmentFilter) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        r.trackingCode.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        (r.location?.locality && r.location.locality.toLowerCase().includes(q)) ||
        r.finalCategory.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DDE5DF] pb-4">
        <div>
          <span className="text-xs font-semibold text-[#24796C] uppercase tracking-wider block">
            Grievance Registry
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#19364A]">
            All Citizen Complaints ({filtered.length} of {reports.length})
          </h1>
        </div>

        <button
          type="button"
          onClick={() => {
            setRefreshing(true);
            fetchReports();
          }}
          disabled={refreshing}
          className="p-2 text-[#63736F] hover:text-[#19364A] bg-white border border-[#DDE5DF] rounded-xl transition shadow-2xs cursor-pointer"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Multi-Filter Bar */}
      <div className="bg-white rounded-2xl border border-[#DDE5DF] p-4 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-[#63736F] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search code, title, street..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#DDE5DF] bg-[#F7F8F4] focus:outline-none focus:ring-1 focus:ring-[#24796C]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-[#DDE5DF] bg-[#F7F8F4]"
        >
          <option value="All">All Statuses</option>
          {COMPLAINT_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-[#DDE5DF] bg-[#F7F8F4]"
        >
          <option value="All">All Categories</option>
          {CIVIC_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-[#DDE5DF] bg-[#F7F8F4]"
        >
          <option value="All">All Priorities</option>
          {PRIORITY_LEVELS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-[#DDE5DF] bg-[#F7F8F4]"
        >
          <option value="All">All Departments</option>
          {CIVIC_DEPARTMENTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {(statusFilter !== 'All' || categoryFilter !== 'All' || priorityFilter !== 'All' || departmentFilter !== 'All' || searchQuery) && (
          <button
            onClick={() => {
              setStatusFilter('All');
              setCategoryFilter('All');
              setPriorityFilter('All');
              setDepartmentFilter('All');
              setSearchQuery('');
            }}
            className="text-xs font-semibold text-[#24796C] hover:underline px-2"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#DDE5DF] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F7F8F4] border-b border-[#DDE5DF] text-[#63736F] font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Tracking Code</th>
                <th className="py-3.5 px-4">Issue Title</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Locality</th>
                <th className="py-3.5 px-4">Priority Score</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE5DF] text-[#19364A]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#63736F]">
                    Loading complaint records...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#63736F]">
                    No complaint records found matching the specified filters.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F7F8F4]/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#19364A]">
                      {r.trackingCode}
                    </td>
                    <td className="py-3.5 px-4 font-medium max-w-[260px] truncate" title={r.title}>
                      {r.title}
                    </td>
                    <td className="py-3.5 px-4 text-[#63736F]">{r.finalDepartment}</td>
                    <td className="py-3.5 px-4 text-[#63736F]">{r.location?.locality}</td>
                    <td className="py-3.5 px-4">
                      <PriorityBadge priority={r.finalPriority} score={r.aiPriorityScore} showScore size="sm" />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={r.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <NextLink
                        href={`/admin/complaints/${r.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#E7F0EA] hover:bg-[#24796C] hover:text-white text-[#24796C] font-semibold transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </NextLink>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AdminComplaintsPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center">Loading queue...</div>}>
      <ComplaintQueueContent />
    </Suspense>
  );
}
