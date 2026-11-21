'use client';

import React, { useEffect, useState } from 'react';
import NextLink from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Report } from '@/types';
import { CIVIC_DEPARTMENTS } from '@/lib/constants';
import { Building2, Clock, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';

export default function AdminDepartmentsPage() {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DDE5DF] pb-4">
        <div>
          <span className="text-xs font-semibold text-[#24796C] uppercase tracking-wider block">
            Workforce Allocation
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#19364A]">
            Department Workload & Operational Queues
          </h1>
          <p className="text-xs text-[#63736F] mt-1">
            Real-time complaint distribution across municipal service branches.
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
        {CIVIC_DEPARTMENTS.map((dept) => {
          const deptReports = reports.filter((r) => r.finalDepartment === dept);
          const activeWorkload = deptReports.filter((r) => r.status !== 'Resolved').length;
          const criticalCount = deptReports.filter((r) => r.finalPriority === 'Critical' && r.status !== 'Resolved').length;
          const resolvedCount = deptReports.filter((r) => r.status === 'Resolved').length;

          return (
            <div
              key={dept}
              className="bg-white rounded-2xl border border-[#DDE5DF] p-6 shadow-xs space-y-4 hover:border-[#24796C] transition"
            >
              <div className="flex items-center justify-between border-b border-[#DDE5DF] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#E7F0EA] text-[#24796C] flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#19364A]">{dept}</h3>
                    <span className="text-[11px] text-[#63736F]">{deptReports.length} Total Complaints Assigned</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-[#F7F8F4] p-3 rounded-xl border border-[#DDE5DF]">
                  <span className="text-[#63736F] block text-[10px] uppercase font-bold">Active</span>
                  <span className="text-xl font-extrabold text-[#D99A42]">{activeWorkload}</span>
                </div>
                <div className="bg-[#F7F8F4] p-3 rounded-xl border border-[#DDE5DF]">
                  <span className="text-[#63736F] block text-[10px] uppercase font-bold">Critical</span>
                  <span className="text-xl font-extrabold text-[#C85C55]">{criticalCount}</span>
                </div>
                <div className="bg-[#F7F8F4] p-3 rounded-xl border border-[#DDE5DF]">
                  <span className="text-[#63736F] block text-[10px] uppercase font-bold">Closed</span>
                  <span className="text-xl font-extrabold text-[#24796C]">{resolvedCount}</span>
                </div>
              </div>

              <NextLink
                href={`/admin/complaints?department=${encodeURIComponent(dept)}`}
                className="w-full py-2.5 bg-[#F7F8F4] hover:bg-[#E7F0EA] text-[#19364A] font-semibold text-xs rounded-xl border border-[#DDE5DF] transition flex items-center justify-center gap-1.5"
              >
                <span>Filter Queue by {dept}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </NextLink>
            </div>
          );
        })}
      </div>
    </div>
  );
}
