'use client';

import React from 'react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, ShieldCheck, Heart, MapPin, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  const pathname = usePathname();
  // If inside the Admin Portal, omit the citizen footer
  if (pathname.startsWith('/admin')) {
    return null;
  }
  return (
    <footer className="bg-[#19364A] text-white border-t border-[#DDE5DF] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-[#24796C] flex items-center justify-center text-white">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                Civic<span className="text-[#24796C] brightness-125">Resolve</span>
              </span>
            </div>
            <p className="text-xs text-[#DDE5DF] leading-relaxed">
              AI-Powered Citizen Grievance Management and Resolution Platform. Bridging the gap
              between residents and municipal authorities through intelligent triage and transparent tracking.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-[#24796C] brightness-125">
              <MapPin className="w-3.5 h-3.5" />
              <span>Pilot Deployment: Coimbatore, Tamil Nadu</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#DDE5DF]">
              Citizen Services
            </h4>
            <ul className="text-xs space-y-2 text-[#DDE5DF]/80">
              <li>
                <NextLink href="/report" className="hover:text-white transition">
                  Report a Civic Issue
                </NextLink>
              </li>
              <li>
                <NextLink href="/track" className="hover:text-white transition">
                  Track Complaint Progress
                </NextLink>
              </li>
              <li>
                <NextLink href="/issues" className="hover:text-white transition">
                  Neighbourhood Pulse
                </NextLink>
              </li>
              <li>
                <NextLink href="/my-reports" className="hover:text-white transition">
                  My Submitted Complaints
                </NextLink>
              </li>
            </ul>
          </div>

          {/* Municipal Administration */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#DDE5DF]">
              Administration
            </h4>
            <ul className="text-xs space-y-2 text-[#DDE5DF]/80">
              <li>
                <NextLink href="/admin" className="hover:text-white transition">
                  Operations Command Center
                </NextLink>
              </li>
              <li>
                <NextLink href="/admin?tab=pulse" className="hover:text-white transition">
                  Neighbourhood Cluster Map
                </NextLink>
              </li>
              <li>
                <NextLink href="/admin?tab=workload" className="hover:text-white transition">
                  Department Workload
                </NextLink>
              </li>
              <li>
                <NextLink href="/login" className="hover:text-white transition">
                  Official Staff Login
                </NextLink>
              </li>
            </ul>
          </div>

          {/* AI & Competition Notice */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#DDE5DF] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#24796C] brightness-125" />
              AI Advisory Notice
            </h4>
            <p className="text-xs text-[#DDE5DF]/80 leading-relaxed">
              Google Gemini provides advisory decision-support for complaint categorization and urgency scoring. All remediation actions are authorized by human municipal staff.
            </p>
            <div className="p-2.5 rounded bg-white/5 border border-white/10 text-[11px] text-[#DDE5DF]/70">
              Developed for the <strong>PromptWars X GDG On Campus PSG iTech Challenge</strong>.
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#DDE5DF]/60 gap-3">
          <p>
            © {new Date().getFullYear()} CivicResolve Platform. Prototype civic technology. Does not represent an official government authority.
          </p>
          <div className="flex items-center gap-4">
            <NextLink href="/" className="hover:text-white transition">
              Privacy Policy
            </NextLink>
            <NextLink href="/" className="hover:text-white transition">
              Terms of Service
            </NextLink>
            <NextLink href="/" className="hover:text-white transition">
              Security
            </NextLink>
          </div>
        </div>
      </div>
    </footer>
  );
};
