'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DashboardStats, Report } from '@/types';

export default function AdminAnalyticsPage() {
  const { idToken } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const headers: Record<string, string> = {};
        if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

        const [resStats, resReports] = await Promise.all([
          fetch('/api/admin/stats', { headers }),
          fetch('/api/reports', { headers }),
        ]);

        if (resStats.ok) {
          const s = await resStats.json();
          setStats(s.stats);
        }
        if (resReports.ok) {
          const r = await resReports.json();
          setReports(r.reports || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [idToken]);

  if (loading || !stats) {
    return (
      <div className="py-20 text-center text-xs text-[#63736F]">
        Aggregating municipal resolution analytics...
      </div>
    );
  }

  const total = stats.totalComplaints || 1;
  const resolutionRate = Math.round((stats.resolved / total) * 100);

  return (
    <div className="space-y-8">
      <div className="border-b border-[#DDE5DF] pb-4">
        <span className="text-xs font-semibold text-[#24796C] uppercase tracking-wider block">
          Performance Metrics
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#19364A]">
          Municipal Analytics & Key Performance Indicators
        </h1>
        <p className="text-xs text-[#63736F] mt-1">
          Evaluating resolution velocity, departmental workload balance, and priority score distributions.
        </p>
      </div>

      {/* Top 3 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-[#DDE5DF] p-6 shadow-xs space-y-2">
          <span className="text-xs font-bold text-[#63736F] uppercase tracking-wider block">
            Resolution Rate
          </span>
          <div className="text-4xl font-extrabold text-[#24796C]">{resolutionRate}%</div>
          <p className="text-xs text-[#63736F]">
            {stats.resolved} of {stats.totalComplaints} complaints successfully remediated and inspected.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#DDE5DF] p-6 shadow-xs space-y-2">
          <span className="text-xs font-bold text-[#63736F] uppercase tracking-wider block">
            Average Priority Score
          </span>
          <div className="text-4xl font-extrabold text-[#19364A]">
            {reports.length > 0
              ? Math.round(reports.reduce((acc, r) => acc + (r.aiPriorityScore || 0), 0) / reports.length)
              : 0}
            /100
          </div>
          <p className="text-xs text-[#63736F]">
            Objective 5-factor severity weighted index across all grievances.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#DDE5DF] p-6 shadow-xs space-y-2">
          <span className="text-xs font-bold text-[#63736F] uppercase tracking-wider block">
            Critical Triage Share
          </span>
          <div className="text-4xl font-extrabold text-[#C85C55]">
            {Math.round(((stats.criticalPriority) / total) * 100)}%
          </div>
          <p className="text-xs text-[#63736F]">
            {stats.criticalPriority} complaints designated as immediate public safety alerts.
          </p>
        </div>
      </div>

      {/* Priority Distribution Progress Bars */}
      <div className="bg-white rounded-2xl border border-[#DDE5DF] p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-[#19364A]">Priority Urgency Distribution</h3>
        <div className="space-y-3 text-xs">
          <div>
            <div className="flex justify-between mb-1 font-semibold text-[#19364A]">
              <span>Critical (Score 75–100)</span>
              <span>{stats.criticalPriority} ({Math.round((stats.criticalPriority / total) * 100)}%)</span>
            </div>
            <div className="w-full bg-[#F7F8F4] rounded-full h-3 overflow-hidden">
              <div
                className="bg-[#C85C55] h-3 rounded-full transition-all duration-500"
                style={{ width: `${(stats.criticalPriority / total) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1 font-semibold text-[#19364A]">
              <span>High (Score 50–74)</span>
              <span>{stats.highPriority} ({Math.round((stats.highPriority / total) * 100)}%)</span>
            </div>
            <div className="w-full bg-[#F7F8F4] rounded-full h-3 overflow-hidden">
              <div
                className="bg-[#D99A42] h-3 rounded-full transition-all duration-500"
                style={{ width: `${(stats.highPriority / total) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1 font-semibold text-[#19364A]">
              <span>Medium (Score 25–49)</span>
              <span>{stats.mediumPriority} ({Math.round((stats.mediumPriority / total) * 100)}%)</span>
            </div>
            <div className="w-full bg-[#F7F8F4] rounded-full h-3 overflow-hidden">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(stats.mediumPriority / total) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1 font-semibold text-[#19364A]">
              <span>Low (Score 0–24)</span>
              <span>{stats.lowPriority} ({Math.round((stats.lowPriority / total) * 100)}%)</span>
            </div>
            <div className="w-full bg-[#F7F8F4] rounded-full h-3 overflow-hidden">
              <div
                className="bg-emerald-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(stats.lowPriority / total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
