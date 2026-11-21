'use client';

import React, { useState } from 'react';
import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Building2,
  LayoutDashboard,
  FileText,
  AlertTriangle,
  Layers,
  BarChart3,
  History,
  ShieldCheck,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Database,
  Search,
  RefreshCw,
  MapPin,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, idToken, loginDemo, logout, loading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');
  const [isReSeeding, setIsReSeeding] = useState(false);
  const [reSeedSuccess, setReSeedSuccess] = useState(false);

  // Quick jump by tracking code or ID
  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = quickSearch.trim().toUpperCase();
    if (!clean) return;
    router.push(`/admin/complaints?search=${encodeURIComponent(clean)}`);
    setQuickSearch('');
  };

  const handleSeedDemo = async () => {
    if (!confirm('Re-seed the demonstration dataset for Coimbatore?')) return;
    setIsReSeeding(true);
    setReSeedSuccess(false);
    try {
      const headers: Record<string, string> = {};
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
      const res = await fetch('/api/seed', { method: 'POST', headers });
      if (res.ok) {
        setReSeedSuccess(true);
        setTimeout(() => setReSeedSuccess(false), 3000);
        router.refresh();
      }
    } catch (err) {
      alert('Failed to re-seed demo data.');
    } finally {
      setIsReSeeding(false);
    }
  };

  // If visiting the dedicated admin login page, bypass layout gating and render directly
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F7F8F4] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-9 h-9 border-3 border-[#24796C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#63736F]">Verifying municipal credentials...</p>
        </div>
      </div>
    );
  }

  // Administrator authorization gate: strictly rejects unauthenticated users and citizens
  if (!user || !user.isAdmin) {
    return (
      <div className="min-h-screen bg-[#F7F8F4] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-[#DDE5DF] p-8 shadow-sm text-center space-y-5">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl mx-auto flex items-center justify-center shadow-xs">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-[#19364A]">Municipal Administrator Portal</h1>
            <p className="text-xs text-[#63736F] leading-relaxed">
              This area is strictly restricted to authorized municipal officers and operations staff.
            </p>
            {user && !user.isAdmin && (
              <p className="text-xs font-semibold text-rose-700 bg-rose-50 py-1.5 px-2.5 rounded-lg border border-rose-200 mt-2">
                Currently signed in as: {user.email} (Citizen Role)
              </p>
            )}
          </div>

          <div className="p-4 bg-[#E7F0EA]/70 rounded-xl border border-[#24796C]/20 text-xs text-left space-y-2">
            <span className="font-bold text-[#19364A] block">Evaluator / Judge Quick Access:</span>
            <p className="text-[#63736F]">
              Click below to authenticate as the <strong>Municipal Operations Desk</strong> admin account.
            </p>
            <button
              type="button"
              onClick={async () => {
                await loginDemo('admin');
              }}
              className="w-full py-2.5 px-3 bg-[#19364A] hover:bg-[#24796C] text-white font-semibold rounded-lg transition shadow-xs cursor-pointer text-center block text-xs"
            >
              Sign In as Demo Admin
            </button>
          </div>

          <div className="pt-2 border-t border-[#DDE5DF] flex items-center justify-between text-xs">
            <NextLink href="/" className="text-[#63736F] hover:text-[#19364A] transition font-medium">
              ← Return to Citizen Homepage
            </NextLink>
            <NextLink href="/admin/login" className="text-[#24796C] font-semibold hover:underline">
              Officer Login
            </NextLink>
          </div>
        </div>
      </div>
    );
  }

  const navLinks = [
    { href: '/admin', label: 'Executive Overview', icon: LayoutDashboard, exact: true },
    { href: '/admin/complaints', label: 'Complaint Queue', icon: FileText },
    { href: '/admin/priority', label: 'Critical Incidents', icon: AlertTriangle },
    { href: '/admin/pulse', label: 'Proximity Clusters', icon: Layers },
    { href: '/admin/departments', label: 'Department Workload', icon: Building2 },
    { href: '/admin/analytics', label: 'Analytics & KPIs', icon: TrendingUp },
    { href: '/admin/audit', label: 'Audit Trail', icon: History },
  ];

  const isLinkActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen flex bg-[#F7F8F4] text-[#19364A]">
      {/* 1. Left Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#19364A] text-white shrink-0 border-r border-[#19364A]/40 justify-between select-none">
        <div>
          {/* Logo & Platform identity */}
          <div className="h-18 px-5 border-b border-white/10 flex items-center justify-between">
            <NextLink href="/admin" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#24796C] flex items-center justify-center text-white shadow-xs">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-white block leading-tight">
                  Civic<span className="text-[#24796C] brightness-125">Resolve</span>
                </span>
                <span className="text-[10px] uppercase font-bold text-[#DDE5DF]/70 tracking-wider block">
                  Municipal Desk
                </span>
              </div>
            </NextLink>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold text-white/50 uppercase tracking-wider">
              Operations Navigation
            </div>
            {navLinks.map((item) => {
              const active = isLinkActive(item.href, item.exact);
              const Icon = item.icon;
              return (
                <NextLink
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    active
                      ? 'bg-[#24796C] text-white shadow-xs'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NextLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-white/10 space-y-2.5">
          {/* Pilot jurisdiction notice */}
          <div className="px-3 py-2 bg-white/5 rounded-xl text-[11px] text-white/70 space-y-0.5 border border-white/5">
            <span className="text-[10px] font-bold text-[#24796C] brightness-125 uppercase tracking-wider block">
              Jurisdiction
            </span>
            <div className="flex items-center gap-1 font-medium text-white/90">
              <MapPin className="w-3 h-3 text-[#24796C]" />
              <span>Coimbatore, Tamil Nadu</span>
            </div>
          </div>

          {/* Admin User Chip */}
          <div className="px-3 py-2.5 bg-white/10 rounded-xl flex items-center justify-between">
            <div className="truncate pr-2">
              <span className="text-xs font-bold text-white block truncate">
                {user.displayName || 'Operations Desk'}
              </span>
              <span className="text-[10px] text-white/60 block truncate">{user.email}</span>
            </div>
            <button
              type="button"
              onClick={logout}
              className="p-1.5 hover:bg-white/20 text-white/70 hover:text-white rounded-lg transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Return to Citizen View */}
          <NextLink
            href="/"
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/15 text-white/80 hover:text-white text-xs font-medium transition"
          >
            <span>Exit to Citizen View</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </NextLink>
        </div>
      </aside>

      {/* 2. Mobile Drawer Navigation */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex">
          <div className="w-72 bg-[#19364A] text-white h-full flex flex-col justify-between p-4 shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#24796C] flex items-center justify-center text-white">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-white">CivicResolve Operations</span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 text-white/70 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {navLinks.map((item) => {
                  const active = isLinkActive(item.href, item.exact);
                  const Icon = item.icon;
                  return (
                    <NextLink
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                        active ? 'bg-[#24796C] text-white' : 'text-white/80 hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </NextLink>
                  );
                })}
              </nav>
            </div>

            <div className="pt-3 border-t border-white/10 space-y-2">
              <div className="text-xs text-white/70">
                Logged in: <strong>{user.email}</strong>
              </div>
              <NextLink
                href="/"
                className="block text-center py-2 bg-white/10 rounded-lg text-xs font-semibold text-white"
              >
                Exit to Citizen View
              </NextLink>
            </div>
          </div>
          <div className="flex-1" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* 3. Main Admin Work Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#DDE5DF] h-16 sm:h-18 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-[#DDE5DF] text-[#19364A] hover:bg-[#F7F8F4]"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs text-[#63736F]">
              <span className="font-semibold text-[#19364A]">Operations Command</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="capitalize">
                {pathname.replace('/admin', '').replace('/', '') || 'Overview'}
              </span>
            </div>
          </div>

          {/* Quick Search & Fast Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <form onSubmit={handleQuickSearch} className="relative hidden md:block w-64">
              <Search className="w-3.5 h-3.5 text-[#63736F] absolute left-3 top-2.5" />
              <input
                type="text"
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                placeholder="Search complaint code..."
                className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-[#DDE5DF] bg-[#F7F8F4] text-[#19364A] focus:outline-none focus:ring-1 focus:ring-[#24796C]"
              />
            </form>

            {reSeedSuccess && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                <span>Re-seeded!</span>
              </span>
            )}

            <button
              type="button"
              onClick={handleSeedDemo}
              disabled={isReSeeding}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 text-xs font-semibold text-[#19364A] bg-[#F7F8F4] border border-[#DDE5DF] hover:border-[#24796C] rounded-lg transition shadow-2xs cursor-pointer disabled:opacity-50"
              title="Reset demonstration data"
            >
              <Database className="w-3.5 h-3.5 text-[#24796C]" />
              <span className="hidden sm:inline">Re-seed Data</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
