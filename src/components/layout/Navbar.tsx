'use client';

import React, { useState, useRef, useEffect } from 'react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Building2,
  PlusCircle,
  Search,
  User,
  LogOut,
  ShieldAlert,
  Menu,
  X,
  UserCheck,
  ChevronDown,
  Activity,
  FileText,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout, loginDemo } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);
  const demoMenuRef = useRef<HTMLDivElement>(null);

  // Close demo dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (demoMenuRef.current && !demoMenuRef.current.contains(event.target as Node)) {
        setDemoMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // If inside the Admin Portal, omit the citizen header so the admin layout controls navigation
  if (pathname.startsWith('/admin')) {
    return null;
  }

  // Middle navigation links
  const middleNavLinks = [
    { href: '/', label: 'Home' },
    { href: '/report', label: 'Report an Issue' },
    { href: '/track', label: 'Track Complaint' },
    { href: '/issues', label: 'Neighbourhood Pulse' },
    { href: '/my-reports', label: 'My Reports' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#F7F8F4]/95 backdrop-blur-md border-b border-[#DDE5DF] h-18 sm:h-20 flex items-center transition-colors w-full overflow-x-clip">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          {/* Left: Brand Logo & Subtitle */}
          <NextLink
            href="/"
            className="flex items-center gap-2.5 sm:gap-3 shrink-0 group py-1"
            aria-label="CivicResolve Home"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#19364A] flex items-center justify-center text-white shadow-xs group-hover:bg-[#24796C] transition-colors shrink-0">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-bold tracking-tight text-[#19364A] leading-tight">
                Civic<span className="text-[#24796C]">Resolve</span>
              </span>
              <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#63736F] font-semibold leading-none hidden sm:block">
                Citizen Grievance Platform
              </span>
            </div>
          </NextLink>

          {/* Middle: Desktop Navigation (Desktop & Large screens, strictly single line) */}
          <nav className="hidden xl:flex items-center gap-1.5 2xl:gap-2">
            {middleNavLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <NextLink
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${active
                    ? 'text-[#24796C] bg-[#E7F0EA] font-semibold shadow-2xs'
                    : 'text-[#19364A] hover:text-[#24796C] hover:bg-white/80'
                    }`}
                >
                  {link.label}
                </NextLink>
              );
            })}
          </nav>

          {/* Right: Actions, Auth, Role & CTA */}
          <div className="hidden xl:flex items-center gap-2.5 2xl:gap-3 shrink-0">
            {/* Admin Portal - Only shown to authorized administrators */}
            {user?.isAdmin && (
              <NextLink
                href="/admin"
                className={`px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${isActive('/admin')
                  ? 'bg-[#19364A] text-white shadow-xs'
                  : 'bg-[#19364A]/10 text-[#19364A] hover:bg-[#19364A] hover:text-white'
                  }`}
                title="Municipal Administration Dashboard"
              >
                <ShieldAlert className="w-4 h-4 text-[#24796C]" />
                <span>Admin Portal</span>
              </NextLink>
            )}

            {/* Compact Demo Switcher Menu */}
            <div className="relative" ref={demoMenuRef}>
              <button
                type="button"
                onClick={() => setDemoMenuOpen(!demoMenuOpen)}
                className="px-2.5 py-2 rounded-lg text-xs font-medium text-[#19364A] bg-white border border-[#DDE5DF] hover:border-[#24796C] hover:bg-[#F7F8F4] flex items-center gap-1.5 transition shadow-2xs cursor-pointer whitespace-nowrap"
                title="Switch demo roles for evaluation"
                aria-expanded={demoMenuOpen}
              >
                <UserCheck className="w-3.5 h-3.5 text-[#24796C]" />
                <span>Demo Switcher</span>
                <ChevronDown className="w-3 h-3 text-[#63736F]" />
              </button>

              {demoMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white border border-[#DDE5DF] rounded-xl shadow-xl p-2 z-50 text-xs space-y-1.5 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2.5 py-1 text-[11px] font-semibold text-[#63736F] border-b border-[#DDE5DF] uppercase tracking-wider">
                    Fast Role Switching
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      loginDemo('citizen');
                      setDemoMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#E7F0EA] text-[#19364A] flex items-center justify-between cursor-pointer transition"
                  >
                    <div>
                      <span className="block font-semibold">Priya Raman</span>
                      <span className="text-[10px] text-[#63736F]">Citizen Reporter</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#24796C] bg-[#E7F0EA] px-2 py-0.5 rounded-full">
                      Citizen
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      loginDemo('admin');
                      setDemoMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-rose-50 text-[#19364A] flex items-center justify-between cursor-pointer transition"
                  >
                    <div>
                      <span className="block font-semibold">Operations Desk</span>
                      <span className="text-[10px] text-[#63736F]">Municipal Staff</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#C85C55] bg-rose-100/60 px-2 py-0.5 rounded-full">
                      Admin
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* User Profile & Sign Out / In */}
            {user ? (
              <div className="flex items-center gap-2 pl-1 border-l border-[#DDE5DF]">
                <NextLink
                  href={user.isAdmin ? '/admin' : '/my-reports'}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/80 text-xs font-medium text-[#19364A] transition"
                  title="View user account"
                >
                  <div className="w-7 h-7 rounded-full bg-[#19364A] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="text-left">
                    <span className="block font-semibold leading-tight text-xs truncate max-w-[110px]">
                      {user.displayName}
                    </span>
                    <span className="text-[10px] text-[#63736F] block leading-none">
                      {user.isAdmin ? 'Admin' : 'Citizen'}
                    </span>
                  </div>
                </NextLink>

                <button
                  type="button"
                  onClick={logout}
                  className="p-1.5 text-[#63736F] hover:text-[#C85C55] hover:bg-rose-50 rounded-lg transition cursor-pointer"
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <NextLink
                href="/login"
                className="text-sm font-semibold px-3 py-2 rounded-lg text-[#19364A] border border-[#DDE5DF] bg-white hover:bg-[#F7F8F4] transition whitespace-nowrap shadow-2xs"
              >
                Sign In
              </NextLink>
            )}

            {/* Primary Report Issue CTA */}
            <NextLink
              href="/report"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-[#24796C] hover:bg-[#19364A] rounded-xl shadow-sm hover:shadow transition-all whitespace-nowrap cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>Report Issue</span>
            </NextLink>
          </div>

          {/* Mobile & Tablet Controls (< 1280px: Tablets and Mobile Devices) */}
          <div className="flex xl:hidden items-center gap-2 sm:gap-2.5">
            <NextLink
              href="/report"
              className="inline-flex items-center gap-1 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold text-white bg-[#24796C] hover:bg-[#19364A] rounded-lg sm:rounded-xl shadow-xs transition shrink-0 whitespace-nowrap"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Report Issue</span>
            </NextLink>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#19364A] rounded-lg hover:bg-white border border-[#DDE5DF] transition cursor-pointer shrink-0"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile / Tablet Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden fixed inset-x-0 top-18 sm:top-20 bg-white/98 backdrop-blur-md border-b border-[#DDE5DF] shadow-xl px-4 py-5 space-y-4 max-h-[calc(100vh-5rem)] overflow-y-auto animate-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col space-y-1">
            {middleNavLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <NextLink
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium transition ${active
                    ? 'text-[#24796C] bg-[#E7F0EA] font-semibold'
                    : 'text-[#19364A] hover:bg-[#F7F8F4]'
                    }`}
                >
                  {link.label}
                </NextLink>
              );
            })}

            {/* Admin Portal in Mobile Drawer - Only for authorized administrators */}
            {user?.isAdmin && (
              <NextLink
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#19364A] flex items-center gap-2 mt-1"
              >
                <ShieldAlert className="w-4 h-4 text-[#24796C]" />
                <span>Admin Operations Portal</span>
              </NextLink>
            )}
          </nav>

          {/* Quick Demo Switcher on Tablets / Mobile */}
          <div className="pt-3 border-t border-[#DDE5DF] space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[#63736F]">
              <span>Fast Role Switching:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    loginDemo('citizen');
                    setMobileMenuOpen(false);
                  }}
                  className="px-2.5 py-1 bg-[#E7F0EA] text-[#24796C] font-bold rounded-md text-xs cursor-pointer"
                >
                  Citizen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    loginDemo('admin');
                    setMobileMenuOpen(false);
                  }}
                  className="px-2.5 py-1 bg-rose-50 text-[#C85C55] font-bold rounded-md text-xs cursor-pointer"
                >
                  Admin
                </button>
              </div>
            </div>

            {/* User State on Mobile */}
            {user ? (
              <div className="flex items-center justify-between pt-2 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#19364A] text-white flex items-center justify-center font-bold text-xs">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#19364A] block">{user.displayName}</span>
                    <span className="text-[10px] text-[#63736F]">{user.isAdmin ? 'Admin' : 'Citizen'}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-[#C85C55] hover:underline font-semibold flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <NextLink
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2.5 text-sm font-semibold text-[#19364A] bg-[#F7F8F4] border border-[#DDE5DF] rounded-xl hover:border-[#24796C]"
              >
                Sign In to Your Account
              </NextLink>
            )}

            <NextLink
              href="/report"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-center py-3 text-sm font-semibold text-white bg-[#24796C] hover:bg-[#19364A] rounded-xl shadow-sm"
            >
              Report an Issue Now
            </NextLink>
          </div>
        </div>
      )}
    </header>
  );
};
