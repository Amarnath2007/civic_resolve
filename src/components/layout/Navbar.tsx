'use client';

import React, { useState } from 'react';
import Link from 'next/router';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Building2,
  PlusCircle,
  Search,
  Activity,
  User,
  LogOut,
  ShieldAlert,
  Menu,
  X,
  FileText,
  UserCheck,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout, loginDemo } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/report', label: 'Report an Issue', highlight: true },
    { href: '/track', label: 'Track Complaint' },
    { href: '/issues', label: 'Neighbourhood Pulse' },
  ];

  if (user) {
    navLinks.push({ href: '/my-reports', label: 'My Reports' });
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#DDE5DF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <NextLink href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-[#19364A] flex items-center justify-center text-white shadow-sm group-hover:bg-[#24796C] transition-colors">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-[#19364A] block leading-none">
                Civic<span className="text-[#24796C]">Resolve</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#63736F] font-semibold">
                Citizen Grievance Platform
              </span>
            </div>
          </NextLink>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => (
              <NextLink
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'text-[#24796C] bg-[#E7F0EA] font-semibold'
                    : 'text-[#19364A] hover:text-[#24796C] hover:bg-[#F7F8F4]'
                }`}
              >
                {link.label}
              </NextLink>
            ))}

            {/* Admin Portal Link */}
            <NextLink
              href="/admin"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isActive('/admin')
                  ? 'bg-[#19364A] text-white font-semibold'
                  : 'text-[#19364A] hover:bg-[#F7F8F4]'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-[#24796C]" />
              <span>Admin Portal</span>
            </NextLink>
          </nav>

          {/* Right Action buttons & Auth */}
          <div className="hidden md:flex items-center gap-3">
            {/* Quick Demo Switcher for Competition Evaluators */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setDemoMenuOpen(!demoMenuOpen)}
                className="text-xs bg-[#F7F8F4] border border-[#DDE5DF] text-[#19364A] hover:border-[#24796C] px-2.5 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 cursor-pointer"
                title="Switch demo roles for competition evaluation"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#24796C]" />
                <span>Demo Switcher</span>
              </button>

              {demoMenuOpen && (
                <div
                  className="absolute right-0 mt-1 w-56 bg-white border border-[#DDE5DF] rounded-lg shadow-lg p-2 z-50 text-xs space-y-1"
                  onMouseLeave={() => setDemoMenuOpen(false)}
                >
                  <div className="px-2 py-1 font-semibold text-[#63736F] border-b border-[#DDE5DF]">
                    Fast Role Switching:
                  </div>
                  <button
                    onClick={() => {
                      loginDemo('citizen');
                      setDemoMenuOpen(false);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-[#E7F0EA] text-[#19364A] flex items-center justify-between cursor-pointer"
                  >
                    <span>Citizen (Priya Raman)</span>
                    <span className="text-[10px] text-[#24796C] font-semibold">Citizen</span>
                  </button>
                  <button
                    onClick={() => {
                      loginDemo('admin');
                      setDemoMenuOpen(false);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-[#E7F0EA] text-[#19364A] flex items-center justify-between cursor-pointer"
                  >
                    <span>Operations Desk</span>
                    <span className="text-[10px] text-[#C85C55] font-semibold">Admin</span>
                  </button>
                </div>
              )}
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                <NextLink
                  href={user.isAdmin ? '/admin' : '/my-reports'}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-[#F7F8F4] text-xs font-medium text-[#19364A]"
                >
                  <div className="w-7 h-7 rounded-full bg-[#19364A] text-white flex items-center justify-center font-bold text-xs">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <span className="block font-semibold leading-tight">{user.displayName}</span>
                    <span className="text-[10px] text-[#63736F]">
                      {user.isAdmin ? 'Admin' : 'Citizen'}
                    </span>
                  </div>
                </NextLink>

                <button
                  type="button"
                  onClick={logout}
                  className="p-1.5 text-[#63736F] hover:text-[#C85C55] rounded-md transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <NextLink
                href="/login"
                className="text-xs font-semibold px-3 py-1.5 rounded-md text-[#19364A] border border-[#DDE5DF] hover:bg-[#F7F8F4] transition"
              >
                Sign In
              </NextLink>
            )}

            {/* Primary CTA */}
            <NextLink
              href="/report"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-[#24796C] hover:bg-[#19364A] rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Issue</span>
            </NextLink>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#19364A] rounded-md hover:bg-[#F7F8F4]"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#DDE5DF] bg-white px-4 pt-3 pb-6 space-y-3">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <NextLink
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive(link.href)
                    ? 'text-[#24796C] bg-[#E7F0EA] font-semibold'
                    : 'text-[#19364A] hover:bg-[#F7F8F4]'
                }`}
              >
                {link.label}
              </NextLink>
            ))}
            <NextLink
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md text-sm font-medium text-[#19364A] hover:bg-[#F7F8F4] flex items-center gap-2"
            >
              <ShieldAlert className="w-4 h-4 text-[#24796C]" />
              <span>Admin Portal</span>
            </NextLink>
          </nav>

          <div className="pt-3 border-t border-[#DDE5DF] flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#63736F]">
              <span>Quick Demo:</span>
              <button
                onClick={() => {
                  loginDemo('citizen');
                  setMobileMenuOpen(false);
                }}
                className="px-2 py-1 bg-[#E7F0EA] text-[#24796C] rounded"
              >
                Citizen
              </button>
              <button
                onClick={() => {
                  loginDemo('admin');
                  setMobileMenuOpen(false);
                }}
                className="px-2 py-1 bg-rose-50 text-[#C85C55] rounded"
              >
                Admin
              </button>
            </div>

            {user ? (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-[#19364A] font-semibold">{user.displayName}</span>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-[#C85C55] font-semibold"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <NextLink
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2 text-sm font-semibold text-[#19364A] border border-[#DDE5DF] rounded-md"
              >
                Sign In
              </NextLink>
            )}

            <NextLink
              href="/report"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-center py-2 text-sm font-semibold text-white bg-[#24796C] rounded-lg shadow-sm"
            >
              Report an Issue
            </NextLink>
          </div>
        </div>
      )}
    </header>
  );
};
