'use client';

import React, { useState, useRef, useEffect } from 'react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Building2,
  PlusCircle,
  LogOut,
  ShieldAlert,
  Menu,
  X,
  UserCheck,
  ChevronDown,
  Sparkles,
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

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // If inside the Admin Portal, omit the citizen header so the admin layout controls navigation
  if (pathname.startsWith('/admin')) {
    return null;
  }

  // Full middle navigation links
  const allNavLinks = [
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
    <header className="sticky top-0 z-50 bg-[#F7F8F4]/95 backdrop-blur-md border-b border-[#DDE5DF] h-16 sm:h-18 lg:h-20 flex items-center transition-colors w-full">
      <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-8">
        <div className="flex items-center justify-between gap-2 sm:gap-4 w-full">
          {/* LEFT: Brand Logo & Title */}
          <NextLink
            href="/"
            className="flex items-center gap-2 sm:gap-2.5 shrink-0 group py-1"
            aria-label="CivicResolve Home"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-xl bg-[#19364A] flex items-center justify-center text-white shadow-xs group-hover:bg-[#24796C] transition-colors shrink-0">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg lg:text-xl font-extrabold tracking-tight text-[#19364A] leading-tight whitespace-nowrap">
                Civic<span className="text-[#24796C]">Resolve</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#63736F] font-semibold leading-none hidden 2xl:block">
                Citizen Grievance Platform
              </span>
            </div>
          </NextLink>

          {/* CENTRE: Desktop Navigation Links (>= lg, adaptive density) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 2xl:gap-2 shrink min-w-0">
            {allNavLinks.map((link) => {
              const active = isActive(link.href);
              // On medium desktop (lg to xl), "Report an Issue" is represented by the right CTA button
              const hideOnMedium = link.href === '/report';
              return (
                <NextLink
                  key={link.href}
                  href={link.href}
                  className={`px-2.5 py-1.5 xl:px-3 xl:py-2 rounded-lg text-xs xl:text-sm font-semibold whitespace-nowrap transition-colors ${
                    hideOnMedium ? 'hidden xl:inline-flex' : 'inline-flex'
                  } ${
                    active
                      ? 'text-[#24796C] bg-[#E7F0EA] shadow-2xs'
                      : 'text-[#19364A] hover:text-[#24796C] hover:bg-white/80'
                  }`}
                >
                  {link.label}
                </NextLink>
              );
            })}
          </nav>

          {/* RIGHT: Actions, Demo Switcher, User Profile & CTA Button */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-3 shrink-0">
            {/* Admin Portal - Only shown to authorized administrators */}
            {user?.isAdmin && (
              <NextLink
                href="/admin"
                className={`px-2.5 py-1.5 xl:px-3 xl:py-2 rounded-lg text-xs xl:text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isActive('/admin')
                    ? 'bg-[#19364A] text-white shadow-xs'
                    : 'bg-[#19364A]/10 text-[#19364A] hover:bg-[#19364A] hover:text-white'
                }`}
                title="Municipal Administration Dashboard"
              >
                <ShieldAlert className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-[#24796C]" />
                <span className="hidden xl:inline">Admin Portal</span>
                <span className="xl:hidden">Admin</span>
              </NextLink>
            )}

            {/* Fast Demo Role Switcher Dropdown */}
            <div className="relative" ref={demoMenuRef}>
              <button
                type="button"
                onClick={() => setDemoMenuOpen(!demoMenuOpen)}
                className="px-2 py-1.5 xl:px-2.5 xl:py-2 rounded-lg text-xs font-semibold text-[#19364A] bg-white border border-[#DDE5DF] hover:border-[#24796C] hover:bg-[#F7F8F4] flex items-center gap-1.5 transition shadow-2xs cursor-pointer whitespace-nowrap"
                title="Switch demo roles for evaluation"
                aria-expanded={demoMenuOpen}
              >
                <UserCheck className="w-3.5 h-3.5 text-[#24796C] shrink-0" />
                <span className="hidden xl:inline">Demo Switcher</span>
                <span className="xl:hidden">Demo</span>
                <ChevronDown className="w-3 h-3 text-[#63736F]" />
              </button>

              {demoMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-[#DDE5DF] rounded-xl shadow-xl p-2 z-50 text-xs space-y-1.5 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-[#63736F] border-b border-[#DDE5DF] uppercase tracking-wider">
                    Fast Evaluator Access
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

            {/* Authenticated User Profile & Sign Out / In */}
            {user ? (
              <div className="flex items-center gap-1.5 xl:gap-2 pl-1 border-l border-[#DDE5DF]">
                <NextLink
                  href={user.isAdmin ? '/admin' : '/my-reports'}
                  className="flex items-center gap-1.5 xl:gap-2 px-2 py-1 xl:px-2.5 xl:py-1.5 rounded-lg hover:bg-white/80 text-xs font-medium text-[#19364A] transition shrink-0"
                  title="View user account"
                >
                  <div className="w-7 h-7 rounded-full bg-[#19364A] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="text-left hidden xl:block">
                    <span className="block font-semibold leading-tight text-xs truncate max-w-[100px]">
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
                className="text-xs xl:text-sm font-semibold px-2.5 py-1.5 xl:px-3 xl:py-2 rounded-lg text-[#19364A] border border-[#DDE5DF] bg-white hover:bg-[#F7F8F4] transition whitespace-nowrap shadow-2xs"
              >
                Sign In
              </NextLink>
            )}

            {/* Primary Report Issue CTA Button (Strictly unclipped and fully visible) */}
            <NextLink
              href="/report"
              className="inline-flex items-center gap-1.5 px-3 py-2 xl:px-4 xl:py-2.5 text-xs xl:text-sm font-bold text-white bg-[#24796C] hover:bg-[#19364A] rounded-xl shadow-xs hover:shadow transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>Report Issue</span>
            </NextLink>
          </div>

          {/* MOBILE & TABLET CONTROLS (< 1024px: Tablets and Phones) */}
          <div className="flex lg:hidden items-center gap-2 shrink-0">
            {/* Primary Report Issue CTA Button (Always accessible on mobile without clipping) */}
            <NextLink
              href="/report"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-white bg-[#24796C] hover:bg-[#19364A] rounded-lg shadow-xs transition shrink-0 whitespace-nowrap"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Report Issue</span>
            </NextLink>

            {/* Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 sm:p-2 text-[#19364A] rounded-lg hover:bg-white border border-[#DDE5DF] transition cursor-pointer shrink-0"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE / TABLET RESPONSIVE DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-16 sm:top-18 bg-white/98 backdrop-blur-md border-b border-[#DDE5DF] shadow-xl px-4 py-5 space-y-4 max-h-[calc(100vh-4.5rem)] overflow-y-auto animate-in slide-in-from-top-2 duration-150 z-50">
          <nav className="flex flex-col space-y-1">
            {allNavLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <NextLink
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                    active
                      ? 'text-[#24796C] bg-[#E7F0EA]'
                      : 'text-[#19364A] hover:bg-[#F7F8F4]'
                  }`}
                >
                  {link.label}
                </NextLink>
              );
            })}

            {user?.isAdmin && (
              <NextLink
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2.5 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${
                  isActive('/admin')
                    ? 'text-[#19364A] bg-[#19364A]/10'
                    : 'text-[#19364A] hover:bg-[#F7F8F4]'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-[#24796C]" />
                <span>Admin Operations Portal</span>
              </NextLink>
            )}
          </nav>

          {/* Mobile Fast Role Switcher */}
          <div className="border-t border-[#DDE5DF] pt-4 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#63736F] block">
              Fast Demo Roles (Judge / Evaluator)
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  loginDemo('citizen');
                  setMobileMenuOpen(false);
                }}
                className="py-2 px-3 rounded-lg bg-[#E7F0EA] border border-[#24796C]/20 text-[#24796C] font-semibold text-center hover:bg-[#24796C] hover:text-white transition"
              >
                Priya Raman (Citizen)
              </button>
              <button
                type="button"
                onClick={() => {
                  loginDemo('admin');
                  setMobileMenuOpen(false);
                }}
                className="py-2 px-3 rounded-lg bg-[#19364A] text-white font-semibold text-center hover:bg-[#24796C] transition"
              >
                Operations Desk (Admin)
              </button>
            </div>
          </div>

          {/* Mobile User Profile Section */}
          <div className="border-t border-[#DDE5DF] pt-4">
            {user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#19364A] text-white flex items-center justify-center font-bold text-xs">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <span className="block font-semibold text-xs text-[#19364A]">
                      {user.displayName}
                    </span>
                    <span className="text-[10px] text-[#63736F] block">
                      {user.isAdmin ? 'Municipal Administrator' : 'Verified Resident'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#C85C55] bg-rose-50 border border-rose-200 hover:bg-rose-100 transition"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <NextLink
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2.5 rounded-xl bg-[#24796C] text-white font-semibold text-xs shadow-xs"
              >
                Sign In
              </NextLink>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
