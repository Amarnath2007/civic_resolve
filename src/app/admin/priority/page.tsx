'use client';

import React, { useEffect, useState } from 'react';
import NextLink from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { Report } from '@/types';
import { MapPin, Eye, RefreshCw, Flame } from 'lucide-react';

export default function AdminPriorityQueuePage() {
  const { idToken } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [idToken]);

  const criticalIssues = reports.filter(
    (r) => (r.finalPriority === 'Critical' || r.finalPriority === 'High') && r.status !== 'Resolved'
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DDE5DF] pb-4">
        <div>
          <span className="text-xs font-semibold text-[#C85C55] uppercase tracking-wider block flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-[#C85C55]" />
            <span>Emergency Priority Queue</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#19364A]">
            Critical & High Urgency Incidents ({criticalIssues.length})
          </h1>
          <p className="text-xs text-[#63736F] mt-1">
            Grievances with priority scores ≥ 50/100 requiring immediate field crew dispatch and human oversight.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchReports}
          className="p-2 text-[#63736F] hover:text-[#19364A] bg-white border border-[#DDE5DF] rounded-xl transition shadow-2xs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 py-16 text-center text-xs text-[#63736F]">
            Loading critical incidents...
          </div>
        ) : criticalIssues.length === 0 ? (
          <div className="col-span-2 py-16 text-center text-xs text-[#63736F] bg-white rounded-2xl border border-[#DDE5DF]">
            No unresolved high or critical priority complaints in the queue.
          </div>
        ) : (
          criticalIssues.map((cr) => (
            <div
              key={cr.id}
              className="bg-white rounded-2xl border border-rose-200 p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-rose-400 transition"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-[#19364A] bg-[#F7F8F4] px-2.5 py-1 rounded border border-[#DDE5DF]">
                    {cr.trackingCode}
                  </span>
                  <PriorityBadge priority={cr.finalPriority} score={cr.aiPriorityScore} showScore size="sm" />
                </div>

                <h3 className="text-base font-bold text-[#19364A]">{cr.title}</h3>

                <p className="text-xs text-[#63736F] line-clamp-3 leading-relaxed">
                  {cr.aiSummary || cr.description}
                </p>

                <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-xs text-rose-900 space-y-1">
                  <span className="font-bold block text-[11px] uppercase tracking-wider text-rose-800">
                    AI Urgency Justification:
                  </span>
                  <p className="leading-relaxed">{cr.aiReason}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#DDE5DF] flex items-center justify-between">
                <div className="space-y-0.5 text-xs text-[#63736F]">
                  <span className="flex items-center gap-1 text-[#19364A] font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-[#24796C]" />
                    {cr.location?.locality}
                  </span>
                  <span>Assigned to: {cr.finalDepartment}</span>
                </div>

                <NextLink
                  href={`/admin/complaints/${cr.id}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#C85C55] hover:bg-[#19364A] text-white text-xs font-semibold rounded-xl transition shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect Dossier</span>
                </NextLink>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
