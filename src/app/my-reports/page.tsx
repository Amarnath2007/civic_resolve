'use client';

import React, { useEffect, useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Report, ComplaintStatus } from '@/types';
import {
  FileText,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  ArrowRight,
  Filter,
} from 'lucide-react';

export default function MyReportsPage() {
  const router = useRouter();
  const { user, idToken, loading: authLoading } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('All');

  useEffect(() => {
    async function fetchUserReports() {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const headers: Record<string, string> = {};
        if (idToken) {
          headers['Authorization'] = `Bearer ${idToken}`;
        }

        const res = await fetch(`/api/reports?reporterUid=${encodeURIComponent(user.uid)}`, {
          headers,
        });
        const data = await res.json();
        if (res.ok) {
          setReports(data.reports || []);
        }
      } catch (err) {
        console.error('Error fetching user complaints:', err);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchUserReports();
    }
  }, [user, idToken, authLoading]);

  if (authLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-3 border-[#24796C] border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 bg-[#E7F0EA] text-[#24796C] rounded-full mx-auto flex items-center justify-center">
          <FileText className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-extrabold text-[#19364A]">Citizen Sign-In Required</h2>
        <p className="text-xs text-[#63736F] leading-relaxed">
          Please sign in to view and manage your submitted civic complaints.
        </p>
        <NextLink
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#24796C] hover:bg-[#19364A] text-white font-semibold text-sm transition shadow-sm"
        >
          <span>Sign In as Citizen</span>
          <ArrowRight className="w-4 h-4" />
        </NextLink>
      </div>
    );
  }

  // Summary Metrics
  const total = reports.length;
  const inProgress = reports.filter((r) => r.status === 'In Progress' || r.status === 'Under Review').length;
  const resolved = reports.filter((r) => r.status === 'Resolved').length;

  const filtered = reports.filter((r) => {
    if (filterStatus === 'All') return true;
    return r.status === filterStatus;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-[#24796C] uppercase tracking-wider">
            Citizen Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#19364A]">
            Welcome, {user.displayName}
          </h1>
          <p className="text-xs text-[#63736F]">
            Track resolution timelines for all grievances reported by your account.
          </p>
        </div>

        <NextLink
          href="/report"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#24796C] hover:bg-[#19364A] text-white font-semibold text-xs sm:text-sm shadow-sm transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report New Issue</span>
        </NextLink>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[#DDE5DF] p-5 shadow-sm">
          <span className="text-xs font-semibold text-[#63736F] uppercase">Total Complaints</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#19364A] mt-1">{total}</div>
        </div>

        <div className="bg-white rounded-xl border border-[#DDE5DF] p-5 shadow-sm">
          <span className="text-xs font-semibold text-[#63736F] uppercase">Active Remediation</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#D99A42] mt-1">{inProgress}</div>
        </div>

        <div className="bg-white rounded-xl border border-[#DDE5DF] p-5 shadow-sm">
          <span className="text-xs font-semibold text-[#63736F] uppercase">Resolved</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#24796C] mt-1">{resolved}</div>
        </div>
      </div>

      {/* Filters Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#DDE5DF] pb-3">
        {['All', 'Reported', 'Under Review', 'In Progress', 'Resolved'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              filterStatus === st
                ? 'bg-[#19364A] text-white'
                : 'text-[#63736F] bg-white border border-[#DDE5DF] hover:bg-[#F7F8F4]'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Complaint List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-[#63736F]">Loading your reports...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#DDE5DF] p-12 text-center space-y-4">
          <div className="w-12 h-12 bg-[#F7F8F4] text-[#63736F] rounded-full mx-auto flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#19364A]">No Complaints in this view</h3>
          <p className="text-xs text-[#63736F] max-w-sm mx-auto">
            You currently have no complaints matching the selected filter.
          </p>
          <NextLink
            href="/report"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#24796C] text-white text-xs font-semibold shadow-sm"
          >
            Report an Issue
          </NextLink>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-xl border border-[#DDE5DF] p-5 shadow-sm hover:border-[#24796C] transition space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#19364A] bg-[#F7F8F4] px-2.5 py-1 rounded border border-[#DDE5DF]">
                    {report.trackingCode}
                  </span>
                  <PriorityBadge priority={report.finalPriority} size="sm" />
                </div>
                <StatusBadge status={report.status} size="sm" />
              </div>

              <div>
                <h3 className="text-base font-bold text-[#19364A]">{report.title}</h3>
                <p className="text-xs text-[#63736F] line-clamp-2 mt-1 leading-relaxed">
                  {report.aiSummary || report.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#DDE5DF] text-xs text-[#63736F]">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#24796C]" />
                    {report.location?.locality}
                  </span>
                  <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                  <span className="font-medium text-[#19364A]">{report.finalDepartment}</span>
                </div>

                <NextLink
                  href={`/track/${report.trackingCode}`}
                  className="font-semibold text-[#24796C] hover:underline flex items-center gap-1"
                >
                  <span>Track Full Timeline</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </NextLink>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
