'use client';

import React, { useEffect, useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Report, DashboardStats } from '@/types';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Layers,
  Building2,
  ShieldCheck,
  AlertCircle,
  Eye,
  MapPin,
} from 'lucide-react';

export default function AdminOverviewPage() {
  const router = useRouter();
  const { idToken } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const headers: Record<string, string> = {};
        if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

        const [resReports, resStats] = await Promise.all([
          fetch('/api/reports', { credentials: 'omit' }),
          fetch('/api/admin/stats', { headers }),
        ]);

        if (resReports.ok) {
          const d = await resReports.json();
          setReports(d.reports || []);
        }

        if (resStats.ok) {
          const s = await resStats.json();
          setStats(s.stats);
        }
      } catch (err) {
        console.error('Failed to load admin overview:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [idToken]);

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-[#24796C] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-[#63736F]">Compiling municipal intelligence overview...</p>
      </div>
    );
  }

  const criticalIssues = reports.filter(
    (r) => r.finalPriority === 'Critical' && r.status !== 'Resolved'
  );
  const inProgressCount = reports.filter(
    (r) => r.status === 'In Progress' || r.status === 'Under Review'
  ).length;
  const resolvedCount = reports.filter((r) => r.status === 'Resolved').length;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DDE5DF] pb-4">
        <div>
          <span className="text-xs font-semibold text-[#24796C] uppercase tracking-wider block">
            Executive Command
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#19364A] tracking-tight">
            Municipal Operations Dashboard
          </h1>
          <p className="text-xs text-[#63736F] mt-1">
            Real-time citizen grievance intake, automated Gemini AI severity scoring, and field dispatch tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <NextLink
            href="/admin/complaints"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#24796C] hover:bg-[#19364A] text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <span>View Full Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </NextLink>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Complaints */}
        <div className="bg-white rounded-2xl border border-[#DDE5DF] p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#63736F] uppercase tracking-wider">
              Total Reports
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#E7F0EA] text-[#24796C] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-[#19364A]">{reports.length}</div>
            <p className="text-[11px] text-[#63736F] mt-1">Citizen submissions recorded</p>
          </div>
        </div>

        {/* Active Remediation */}
        <div className="bg-white rounded-2xl border border-[#DDE5DF] p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#63736F] uppercase tracking-wider">
              Active Field Work
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#D99A42] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-[#D99A42]">{inProgressCount}</div>
            <p className="text-[11px] text-[#63736F] mt-1">Under inspection or active repair</p>
          </div>
        </div>

        {/* Resolved */}
        <div className="bg-white rounded-2xl border border-[#DDE5DF] p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#63736F] uppercase tracking-wider">
              Resolved
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#24796C] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-[#24796C]">{resolvedCount}</div>
            <p className="text-[11px] text-[#63736F] mt-1">Inspected & closed</p>
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="bg-white rounded-2xl border border-[#DDE5DF] p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#63736F] uppercase tracking-wider">
              Critical Alerts
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-[#C85C55] flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-[#C85C55]">{criticalIssues.length}</div>
            <p className="text-[11px] text-[#63736F] mt-1">Immediate public safety danger</p>
          </div>
        </div>
      </div>

      {/* Critical Priority Immediate Action Section */}
      <div className="bg-white rounded-2xl border border-[#DDE5DF] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#DDE5DF] pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#C85C55]" />
            <h2 className="text-base font-bold text-[#19364A]">
              Urgent Critical Complaints Awaiting Field Remediation
            </h2>
          </div>
          <NextLink
            href="/admin/priority"
            className="text-xs font-semibold text-[#24796C] hover:underline"
          >
            View all ({criticalIssues.length}) →
          </NextLink>
        </div>

        {criticalIssues.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#63736F]">
            No unresolved critical priority complaints currently in the queue.
          </div>
        ) : (
          <div className="divide-y divide-[#DDE5DF]">
            {criticalIssues.slice(0, 4).map((cr) => (
              <div key={cr.id} className="py-3.5 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#19364A] bg-[#F7F8F4] px-2 py-0.5 rounded border border-[#DDE5DF]">
                      {cr.trackingCode}
                    </span>
                    <PriorityBadge priority="Critical" score={cr.aiPriorityScore} showScore size="sm" />
                    <span className="text-xs text-[#63736F] font-medium">{cr.finalCategory}</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#19364A]">{cr.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-[#63736F]">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#24796C]" />
                      {cr.location?.locality}
                    </span>
                    <span>Assigned to: <strong>{cr.finalDepartment}</strong></span>
                  </div>
                </div>

                <NextLink
                  href={`/admin/complaints/${cr.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#19364A] hover:bg-[#24796C] text-white text-xs font-semibold rounded-lg transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect & Triage</span>
                </NextLink>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Access Operational Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <NextLink
          href="/admin/complaints"
          className="bg-white rounded-2xl border border-[#DDE5DF] p-6 hover:border-[#24796C] transition shadow-xs space-y-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#E7F0EA] text-[#24796C] flex items-center justify-center group-hover:bg-[#24796C] group-hover:text-white transition">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-[#19364A]">All Complaints Queue</h3>
          <p className="text-xs text-[#63736F] leading-relaxed">
            Multi-filter complaints by status, department, and priority score. Update dispatch notes.
          </p>
        </NextLink>

        <NextLink
          href="/admin/pulse"
          className="bg-white rounded-2xl border border-[#DDE5DF] p-6 hover:border-[#24796C] transition shadow-xs space-y-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#E7F0EA] text-[#24796C] flex items-center justify-center group-hover:bg-[#24796C] group-hover:text-white transition">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-[#19364A]">Proximity Clusters (150m)</h3>
          <p className="text-xs text-[#63736F] leading-relaxed">
            Detect spatial problem clusters sharing category within 150 metres to dispatch joint work crews.
          </p>
        </NextLink>

        <NextLink
          href="/admin/departments"
          className="bg-white rounded-2xl border border-[#DDE5DF] p-6 hover:border-[#24796C] transition shadow-xs space-y-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#E7F0EA] text-[#24796C] flex items-center justify-center group-hover:bg-[#24796C] group-hover:text-white transition">
            <Building2 className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-[#19364A]">Department Workload</h3>
          <p className="text-xs text-[#63736F] leading-relaxed">
            Monitor active work volume across Roads, Sanitation, Electricity, and Water Supply.
          </p>
        </NextLink>
      </div>
    </div>
  );
}
