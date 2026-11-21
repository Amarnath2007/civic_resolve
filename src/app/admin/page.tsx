'use client';

import React, { useEffect, useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PriorityScoreCard } from '@/components/ui/PriorityScoreCard';
import { AiAssessmentCard } from '@/components/ui/AiAssessmentCard';
import {
  Report,
  ComplaintStatus,
  CivicCategory,
  CivicDepartment,
  PriorityLevel,
  DashboardStats,
  ComplaintUpdate,
} from '@/types';
import {
  CIVIC_CATEGORIES,
  CIVIC_DEPARTMENTS,
  COMPLAINT_STATUSES,
  PRIORITY_LEVELS,
} from '@/lib/constants';
import { findNearbyRelatedReports } from '@/lib/geo';
import {
  ShieldAlert,
  Building2,
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  MapPin,
  RefreshCw,
  Eye,
  Edit,
  X,
  FileText,
  AlertCircle,
  Database,
  BarChart3,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, idToken, loginDemo, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'pulse' | 'workload'>('overview');
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  // Selected report detail view
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportUpdates, setReportUpdates] = useState<ComplaintUpdate[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Edit controls inside modal
  const [editStatus, setEditStatus] = useState<ComplaintStatus>('Reported');
  const [editCategory, setEditCategory] = useState<CivicCategory>('Roads & Potholes');
  const [editDepartment, setEditDepartment] = useState<CivicDepartment>('Roads & Public Works');
  const [editPriority, setEditPriority] = useState<PriorityLevel>('Medium');
  const [publicUpdateNote, setPublicUpdateNote] = useState('');
  const [internalAdminNote, setInternalAdminNote] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const [resReports, resStats] = await Promise.all([
        fetch('/api/reports', { credentials: 'omit' }),
        fetch('/api/admin/stats', { headers }),
      ]);

      const dataReports = await resReports.json();
      if (resReports.ok) {
        setReports(dataReports.reports || []);
      }

      if (resStats.ok) {
        const dataStats = await resStats.json();
        setStats(dataStats.stats);
      }
    } catch (err) {
      console.error('Admin data fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchData();
    }
  }, [authLoading, idToken]);

  const handleOpenDetail = async (rep: Report) => {
    setSelectedReport(rep);
    setEditStatus(rep.status);
    setEditCategory(rep.finalCategory);
    setEditDepartment(rep.finalDepartment);
    setEditPriority(rep.finalPriority);
    setPublicUpdateNote('');
    setInternalAdminNote('');
    setSaveSuccessMsg(null);
    setDetailLoading(true);

    try {
      const headers: Record<string, string> = {};
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
      const res = await fetch(`/api/reports/${rep.id}`, { headers });
      const data = await res.json();
      if (res.ok) {
        setReportUpdates(data.updates || []);
      }
    } catch (err) {
      console.error('Error fetching details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedReport) return;
    setSaveLoading(true);
    setSaveSuccessMsg(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const payload = {
        status: editStatus,
        finalCategory: editCategory,
        finalDepartment: editDepartment,
        finalPriority: editPriority,
        publicNote: publicUpdateNote.trim() || undefined,
        internalNote: internalAdminNote.trim() || undefined,
      };

      const res = await fetch(`/api/reports/${selectedReport.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update report.');
      }

      setSelectedReport(data.report);
      setReportUpdates(data.updates || []);
      setSaveSuccessMsg('Administrative changes and progress update saved successfully.');
      setPublicUpdateNote('');
      setInternalAdminNote('');

      // Refresh list
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Update failed.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSeedDemo = async () => {
    if (!confirm('Re-seed the demonstration dataset for Coimbatore?')) return;
    setRefreshing(true);
    try {
      const headers: Record<string, string> = {};
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch('/api/seed', {
        method: 'POST',
        headers,
      });

      if (res.ok) {
        await fetchData();
        alert('Sample demo complaints successfully re-seeded.');
      }
    } catch {
      alert('Seeding failed.');
    } finally {
      setRefreshing(false);
    }
  };

  if (authLoading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-3 border-[#24796C] border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  // Not signed in as admin guard
  if (!user || !user.isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full mx-auto flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-extrabold text-[#19364A]">Administrator Access Only</h2>
        <p className="text-xs text-[#63736F] leading-relaxed">
          The operations dashboard is reserved for authorized municipal administrators.
          You can test administrator functionality instantly below.
        </p>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => loginDemo('admin')}
            className="w-full py-3 px-4 rounded-xl bg-[#19364A] hover:bg-[#24796C] text-white font-semibold text-xs sm:text-sm transition shadow-sm cursor-pointer"
          >
            Switch to Demo Administrator
          </button>
        </div>
      </div>
    );
  }

  // Filtered reports table
  const filteredReports = reports.filter((r) => {
    if (statusFilter !== 'All' && r.status !== statusFilter) return false;
    if (categoryFilter !== 'All' && r.finalCategory !== categoryFilter) return false;
    if (priorityFilter !== 'All' && r.finalPriority !== priorityFilter) return false;
    if (departmentFilter !== 'All' && r.finalDepartment !== departmentFilter) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        r.title.toLowerCase().includes(q) ||
        r.trackingCode.toLowerCase().includes(q) ||
        r.location?.locality?.toLowerCase().includes(q) ||
        r.finalCategory.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header & Fast Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DDE5DF] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#24796C] uppercase tracking-wider">
              Municipal Operations Command Center
            </span>
            <span className="text-[10px] bg-[#E7F0EA] text-[#24796C] px-2 py-0.5 rounded font-mono font-bold">
              Admin: {user.email}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#19364A] tracking-tight">
            Grievance Triage & Resolution Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSeedDemo}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#19364A] bg-white border border-[#DDE5DF] hover:border-[#24796C] rounded-lg transition shadow-xs cursor-pointer"
            title="Reset sample demonstration complaints"
          >
            <Database className="w-3.5 h-3.5 text-[#24796C]" />
            <span>Re-seed Demo Data</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              fetchData();
            }}
            disabled={refreshing}
            className="p-2 text-[#63736F] hover:text-[#19364A] bg-white border border-[#DDE5DF] rounded-lg transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#DDE5DF] pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'bg-[#19364A] text-white shadow-xs'
              : 'text-[#63736F] hover:bg-[#E7F0EA]'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'reports'
              ? 'bg-[#19364A] text-white shadow-xs'
              : 'text-[#63736F] hover:bg-[#E7F0EA]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>All Reports ({reports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pulse')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'pulse'
              ? 'bg-[#19364A] text-white shadow-xs'
              : 'text-[#63736F] hover:bg-[#E7F0EA]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Neighbourhood Clusters (150m)</span>
        </button>

        <button
          onClick={() => setActiveTab('workload')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'workload'
              ? 'bg-[#19364A] text-white shadow-xs'
              : 'text-[#63736F] hover:bg-[#E7F0EA]'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Department Workload</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl border border-[#DDE5DF] p-5 shadow-sm">
              <span className="text-xs font-semibold text-[#63736F] uppercase">Total Grievances</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#19364A] mt-1">
                {reports.length}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#DDE5DF] p-5 shadow-sm">
              <span className="text-xs font-semibold text-[#63736F] uppercase">Newly Reported</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-1">
                {reports.filter((r) => r.status === 'Reported').length}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#DDE5DF] p-5 shadow-sm">
              <span className="text-xs font-semibold text-[#63736F] uppercase">Under Review</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-700 mt-1">
                {reports.filter((r) => r.status === 'Under Review').length}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#DDE5DF] p-5 shadow-sm">
              <span className="text-xs font-semibold text-[#63736F] uppercase">In Progress</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#D99A42] mt-1">
                {reports.filter((r) => r.status === 'In Progress').length}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#DDE5DF] p-5 shadow-sm">
              <span className="text-xs font-semibold text-[#63736F] uppercase">Critical Alerts</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#C85C55] mt-1">
                {reports.filter((r) => r.finalPriority === 'Critical').length}
              </div>
            </div>
          </div>

          {/* Quick Critical Queue */}
          <div className="bg-white rounded-xl border border-[#DDE5DF] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#DDE5DF] pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#C85C55]" />
                <h3 className="text-base font-bold text-[#19364A]">
                  Critical Priority Issues Awaiting Field Action
                </h3>
              </div>
              <button
                onClick={() => {
                  setPriorityFilter('Critical');
                  setActiveTab('reports');
                }}
                className="text-xs font-semibold text-[#24796C] hover:underline"
              >
                View all critical →
              </button>
            </div>

            <div className="divide-y divide-[#DDE5DF]">
              {reports
                .filter((r) => r.finalPriority === 'Critical' && r.status !== 'Resolved')
                .slice(0, 3)
                .map((cr) => (
                  <div key={cr.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#19364A]">
                          {cr.trackingCode}
                        </span>
                        <PriorityBadge priority="Critical" score={cr.aiPriorityScore} showScore size="sm" />
                        <span className="text-xs text-[#63736F]">{cr.finalCategory}</span>
                      </div>
                      <p className="text-sm font-semibold text-[#19364A]">{cr.title}</p>
                      <p className="text-xs text-[#63736F]">
                        {cr.location?.locality} • Assigned to {cr.finalDepartment}
                      </p>
                    </div>

                    <button
                      onClick={() => handleOpenDetail(cr)}
                      className="px-3 py-1.5 rounded-lg bg-[#19364A] text-white text-xs font-semibold hover:bg-[#24796C] transition shrink-0 cursor-pointer"
                    >
                      Inspect
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALL REPORTS TABLE */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-xl border border-[#DDE5DF] p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-[#63736F] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ID, street, title..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#DDE5DF] bg-[#F7F8F4] focus:outline-none focus:ring-1 focus:ring-[#24796C]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-2 rounded-lg border border-[#DDE5DF] bg-[#F7F8F4]"
            >
              <option value="All">All Statuses</option>
              {COMPLAINT_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-2 rounded-lg border border-[#DDE5DF] bg-[#F7F8F4]"
            >
              <option value="All">All Categories</option>
              {CIVIC_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-2 rounded-lg border border-[#DDE5DF] bg-[#F7F8F4]"
            >
              <option value="All">All Priorities</option>
              {PRIORITY_LEVELS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-2.5 py-2 rounded-lg border border-[#DDE5DF] bg-[#F7F8F4]"
            >
              <option value="All">All Departments</option>
              {CIVIC_DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-[#DDE5DF] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F7F8F4] border-b border-[#DDE5DF] text-[#63736F] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Tracking Code</th>
                    <th className="py-3.5 px-4">Issue Title</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Locality</th>
                    <th className="py-3.5 px-4">Priority</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE5DF] text-[#19364A]">
                  {filteredReports.map((r) => (
                    <tr key={r.id} className="hover:bg-[#F7F8F4]/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#19364A]">
                        {r.trackingCode}
                      </td>
                      <td className="py-3 px-4 font-medium max-w-[240px] truncate" title={r.title}>
                        {r.title}
                      </td>
                      <td className="py-3 px-4 text-[#63736F]">{r.finalCategory}</td>
                      <td className="py-3 px-4 text-[#63736F]">{r.finalDepartment}</td>
                      <td className="py-3 px-4 text-[#63736F]">{r.location?.locality}</td>
                      <td className="py-3 px-4">
                        <PriorityBadge priority={r.finalPriority} size="sm" />
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={r.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenDetail(r)}
                          className="px-2.5 py-1 rounded bg-[#E7F0EA] hover:bg-[#24796C] hover:text-white text-[#24796C] font-semibold transition cursor-pointer"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredReports.length === 0 && (
              <div className="py-12 text-center text-xs text-[#63736F]">
                No reports matching the specified filter criteria.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: NEIGHBOURHOOD PULSE CLUSTER DETECTION */}
      {activeTab === 'pulse' && (
        <div className="space-y-6">
          <div className="bg-[#E7F0EA]/70 p-5 rounded-xl border border-[#24796C]/20 space-y-2">
            <h3 className="text-sm font-bold text-[#19364A] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#24796C]" />
              Proximity Cluster & Recurring Problem Detection (150m Radius)
            </h3>
            <p className="text-xs text-[#63736F] leading-relaxed">
              CivicResolve continuously compares unresolved complaints within a 150-metre radius
              sharing the same category. This enables administrators to spot systemic street failures,
              identify recurring infrastructure bottlenecks, and dispatch unified work crews without
              prematurely merging complaints.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reports
              .filter((r) => r.status !== 'Resolved')
              .map((r) => {
                const nearby = findNearbyRelatedReports(
                  {
                    id: r.id,
                    category: r.finalCategory,
                    latitude: r.location?.latitude,
                    longitude: r.location?.longitude,
                  },
                  reports,
                  150
                );

                if (nearby.length === 0) return null;

                return (
                  <div
                    key={r.id}
                    className="bg-white rounded-xl border border-amber-300 p-5 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                        Recurring Problem Cluster Detected
                      </span>
                      <span className="text-[#63736F]">
                        {nearby.length} Related Issue(s) within 150m
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-[#19364A]">{r.title}</h4>
                      <p className="text-xs text-[#63736F] mt-0.5">
                        {r.location?.locality} ({r.finalCategory})
                      </p>
                    </div>

                    <div className="bg-[#F7F8F4] p-3 rounded-lg border border-[#DDE5DF] space-y-2">
                      <span className="text-[11px] font-bold text-[#19364A] block">
                        Nearby Related Reports:
                      </span>
                      <ul className="text-xs space-y-1.5">
                        {nearby.map((m, idx) => (
                          <li key={idx} className="flex justify-between items-center text-[#63736F]">
                            <span className="font-medium text-[#19364A] truncate max-w-[200px]">
                              {m.report.trackingCode}: {m.report.title}
                            </span>
                            <span className="font-mono font-semibold text-[#24796C]">
                              ~{m.distanceMetres}m away
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => handleOpenDetail(r)}
                      className="w-full py-2 bg-[#19364A] hover:bg-[#24796C] text-white text-xs font-semibold rounded-lg transition"
                    >
                      Manage Cluster
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 4: DEPARTMENT WORKLOAD */}
      {activeTab === 'workload' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CIVIC_DEPARTMENTS.map((dept) => {
            const deptReports = reports.filter((r) => r.finalDepartment === dept);
            const pending = deptReports.filter((r) => r.status !== 'Resolved').length;
            const critical = deptReports.filter((r) => r.finalPriority === 'Critical').length;

            return (
              <div key={dept} className="bg-white rounded-xl border border-[#DDE5DF] p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-[#DDE5DF] pb-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#24796C]" />
                    <h4 className="text-sm font-bold text-[#19364A]">{dept}</h4>
                  </div>
                  <span className="text-xs font-bold text-[#19364A]">
                    {deptReports.length} Total
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-[#F7F8F4] p-3 rounded-lg border border-[#DDE5DF]">
                    <span className="text-[#63736F] block">Active Workload</span>
                    <span className="text-lg font-bold text-[#D99A42]">{pending}</span>
                  </div>
                  <div className="bg-[#F7F8F4] p-3 rounded-lg border border-[#DDE5DF]">
                    <span className="text-[#63736F] block">Critical Incidents</span>
                    <span className="text-lg font-bold text-[#C85C55]">{critical}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setDepartmentFilter(dept);
                    setActiveTab('reports');
                  }}
                  className="w-full py-2 bg-[#F7F8F4] hover:bg-[#E7F0EA] text-[#19364A] font-semibold text-xs rounded-lg border border-[#DDE5DF] transition"
                >
                  View Department Queue →
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL MODAL / DRAWER */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#DDE5DF] max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl relative">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#DDE5DF] pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-[#19364A] bg-[#F7F8F4] px-2.5 py-1 rounded border border-[#DDE5DF]">
                    {selectedReport.trackingCode}
                  </span>
                  <PriorityBadge priority={selectedReport.finalPriority} />
                  <StatusBadge status={selectedReport.status} />
                </div>
                <h2 className="text-xl font-bold text-[#19364A] pt-1">
                  {selectedReport.title}
                </h2>
              </div>

              <button
                onClick={() => setSelectedReport(null)}
                className="p-2 text-[#63736F] hover:text-[#19364A] rounded-lg hover:bg-[#F7F8F4] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saveSuccessMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            {/* Complaint Info & Photographic Evidence */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-3">
                <span className="font-bold text-[#19364A] uppercase tracking-wider block">
                  Original Citizen Report
                </span>
                <p className="bg-[#F7F8F4] p-3.5 rounded-lg border border-[#DDE5DF] text-[#19364A] leading-relaxed">
                  {selectedReport.description}
                </p>
                <div className="space-y-1 text-[#63736F]">
                  <p>
                    <strong>Location:</strong> {selectedReport.location?.locality},{' '}
                    {selectedReport.location?.streetOrLandmark}
                  </p>
                  <p>
                    <strong>Submitted:</strong>{' '}
                    {new Date(selectedReport.createdAt).toLocaleString()}
                  </p>
                  {selectedReport.reporterEmail && (
                    <p>
                      <strong>Reporter Email:</strong> {selectedReport.reporterEmail} (Confidential)
                    </p>
                  )}
                </div>
              </div>

              <div>
                <span className="font-bold text-[#19364A] uppercase tracking-wider block mb-2">
                  Photographic Evidence
                </span>
                {selectedReport.imageUrl ? (
                  <div className="h-48 rounded-lg overflow-hidden border border-[#DDE5DF] bg-slate-100 flex items-center justify-center">
                    <img
                      src={selectedReport.imageUrl}
                      alt="Complaint Evidence"
                      className="max-h-48 w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="h-48 rounded-lg border border-dashed border-[#DDE5DF] bg-[#F7F8F4] flex items-center justify-center text-[#63736F]">
                    No image uploaded by citizen
                  </div>
                )}
              </div>
            </div>

            {/* AI Assessment & Transparent Score Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AiAssessmentCard
                summary={selectedReport.aiSummary}
                reason={selectedReport.aiReason}
                suggestedCategory={selectedReport.aiSuggestedCategory}
                suggestedDepartment={selectedReport.aiSuggestedDepartment}
                priorityLevel={selectedReport.aiPriorityLevel}
                priorityScore={selectedReport.aiPriorityScore}
                confidence={selectedReport.aiConfidence}
                imageObservations={selectedReport.imageObservations}
                recommendedAction={selectedReport.recommendedAction}
                triageMethod={selectedReport.triageMethod}
                detectedLanguage={selectedReport.detectedLanguage}
              />

              <PriorityScoreCard
                score={selectedReport.aiPriorityScore}
                priorityLevel={selectedReport.aiPriorityLevel}
                breakdown={selectedReport.scoreBreakdown}
                justification={selectedReport.aiReason}
              />
            </div>

            {/* ADMINISTRATIVE CONTROLS SECTION */}
            <div className="bg-[#F7F8F4] p-6 rounded-xl border border-[#DDE5DF] space-y-4">
              <div className="flex items-center gap-2 border-b border-[#DDE5DF] pb-3">
                <Edit className="w-4 h-4 text-[#24796C]" />
                <h3 className="text-sm font-bold text-[#19364A] uppercase tracking-wider">
                  Administrative Overrides & Status Management
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                {/* Status selector */}
                <div>
                  <label className="font-bold text-[#19364A] block mb-1">Update Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as ComplaintStatus)}
                    className="w-full p-2.5 rounded-lg border border-[#DDE5DF] bg-white font-medium"
                  >
                    {COMPLAINT_STATUSES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                {/* Category Override */}
                <div>
                  <label className="font-bold text-[#19364A] block mb-1">Final Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as CivicCategory)}
                    className="w-full p-2.5 rounded-lg border border-[#DDE5DF] bg-white font-medium"
                  >
                    {CIVIC_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Department Override */}
                <div>
                  <label className="font-bold text-[#19364A] block mb-1">Assigned Department</label>
                  <select
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value as CivicDepartment)}
                    className="w-full p-2.5 rounded-lg border border-[#DDE5DF] bg-white font-medium"
                  >
                    {CIVIC_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                {/* Priority Override */}
                <div>
                  <label className="font-bold text-[#19364A] block mb-1">Final Priority</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as PriorityLevel)}
                    className="w-full p-2.5 rounded-lg border border-[#DDE5DF] bg-white font-medium"
                  >
                    {PRIORITY_LEVELS.map((pr) => (
                      <option key={pr} value={pr}>{pr}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Public Progress Note */}
              <div className="space-y-1 text-xs">
                <label className="font-bold text-[#19364A] block">
                  Public Progress Update (Visible on Citizen Tracking Timeline)
                </label>
                <input
                  type="text"
                  value={publicUpdateNote}
                  onChange={(e) => setPublicUpdateNote(e.target.value)}
                  placeholder="e.g. Field unit dispatched to patch road aggregate tomorrow morning."
                  className="w-full p-2.5 rounded-lg border border-[#DDE5DF] bg-white text-[#19364A]"
                />
              </div>

              {/* Private Internal Note */}
              <div className="space-y-1 text-xs">
                <label className="font-bold text-[#19364A] block">
                  Internal Administrative Note (Staff & Audit Log Only — Never Public)
                </label>
                <input
                  type="text"
                  value={internalAdminNote}
                  onChange={(e) => setInternalAdminNote(e.target.value)}
                  placeholder="e.g. Material vendor requisition approved by Executive Engineer."
                  className="w-full p-2.5 rounded-lg border border-[#DDE5DF] bg-white text-[#19364A]"
                />
              </div>

              {/* Save Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveChanges}
                  disabled={saveLoading}
                  className="px-6 py-2.5 rounded-xl bg-[#24796C] hover:bg-[#19364A] text-white font-bold text-xs transition shadow-sm cursor-pointer"
                >
                  {saveLoading ? 'Saving...' : 'Save Official Decision & Publish Update'}
                </button>
              </div>
            </div>

            {/* Audit History & Internal Notes */}
            {selectedReport.adminNotes && selectedReport.adminNotes.length > 0 && (
              <div className="border-t border-[#DDE5DF] pt-4 text-xs space-y-2">
                <span className="font-bold text-[#19364A] uppercase tracking-wider block">
                  Staff Internal Log History
                </span>
                <ul className="list-disc list-inside space-y-1 text-[#63736F]">
                  {selectedReport.adminNotes.map((note, idx) => (
                    <li key={idx}>{note}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
