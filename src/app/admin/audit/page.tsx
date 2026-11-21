'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Report } from '@/types';
import { History, ShieldCheck, UserCheck, Calendar } from 'lucide-react';

export default function AdminAuditTrailPage() {
  const { idToken } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      setLoading(true);
      try {
        const res = await fetch('/api/reports', { credentials: 'omit' });
        if (res.ok) {
          const d = await res.json();
          setReports(d.reports || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  // Collect all admin notes and updates
  const auditEntries = reports
    .filter((r) => r.adminNotes && r.adminNotes.length > 0)
    .flatMap((r) =>
      r.adminNotes!.map((note, idx) => ({
        id: `${r.id}-note-${idx}`,
        trackingCode: r.trackingCode,
        title: r.title,
        note,
        date: r.updatedAt,
      }))
    );

  return (
    <div className="space-y-6">
      <div className="border-b border-[#DDE5DF] pb-4">
        <span className="text-xs font-semibold text-[#24796C] uppercase tracking-wider block">
          Governance & Compliance
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#19364A]">
          Administrative Action Audit Trail
        </h1>
        <p className="text-xs text-[#63736F] mt-1">
          Immutable log of municipal officer overrides, dispatch directives, and internal notes.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#DDE5DF] p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-[#19364A] uppercase tracking-wider border-b border-[#DDE5DF] pb-3">
          <History className="w-4 h-4 text-[#24796C]" />
          <span>Recorded Officer Actions</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-[#63736F]">Loading audit logs...</div>
        ) : auditEntries.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#63736F]">
            No administrative override notes recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-[#DDE5DF]">
            {auditEntries.map((entry) => (
              <div key={entry.id} className="py-3.5 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#19364A] bg-[#F7F8F4] px-2 py-0.5 rounded border border-[#DDE5DF]">
                    {entry.trackingCode}
                  </span>
                  <span className="text-[#63736F] flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#24796C]" />
                    {new Date(entry.date).toLocaleString()}
                  </span>
                </div>
                <p className="font-semibold text-[#19364A]">{entry.title}</p>
                <p className="bg-[#F7F8F4] p-3 rounded-xl border border-[#DDE5DF] text-[#19364A] leading-relaxed">
                  {entry.note}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
