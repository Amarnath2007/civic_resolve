import React from 'react';
import NextLink from 'next/link';
import {
  Building2,
  ArrowRight,
  ShieldCheck,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  Users,
  AlertCircle,
  Trash2,
  Lightbulb,
  Droplets,
  Trees,
  Car,
  HelpCircle,
  ThumbsUp,
} from 'lucide-react';
import { dbService } from '@/lib/db/store';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CATEGORY_DESCRIPTIONS } from '@/lib/constants';

export default async function HomePage() {
  const stats = await dbService.getDashboardStats();
  const publicReports = await dbService.getPublicReports();
  const recentReports = publicReports.slice(0, 3);

  const categories = [
    {
      name: 'Roads & Potholes',
      icon: <Car className="w-6 h-6 text-[#24796C]" />,
      desc: 'Potholes, surface erosion, damaged asphalt and road hazards.',
      href: '/report?cat=Roads%20%26%20Potholes',
    },
    {
      name: 'Waste & Garbage',
      icon: <Trash2 className="w-6 h-6 text-[#24796C]" />,
      desc: 'Overflowing bins, illegal dumping and uncollected municipal waste.',
      href: '/report?cat=Waste%20%26%20Garbage',
    },
    {
      name: 'Streetlights & Electricity',
      icon: <Lightbulb className="w-6 h-6 text-[#24796C]" />,
      desc: 'Defunct light poles, dark streets, and hazardous exposed cables.',
      href: '/report?cat=Streetlights%20%26%20Electricity',
    },
    {
      name: 'Water Supply & Drainage',
      icon: <Droplets className="w-6 h-6 text-[#24796C]" />,
      desc: 'Pipeline bursts, contaminated tap supply and overflowing drains.',
      href: '/report?cat=Water%20Supply%20%26%20Drainage',
    },
    {
      name: 'Public Spaces & Parks',
      icon: <Trees className="w-6 h-6 text-[#24796C]" />,
      desc: 'Damaged park equipment, broken benches and unsafe walkways.',
      href: '/report?cat=Public%20Spaces%20%26%20Parks',
    },
    {
      name: 'Other Civic Issues',
      icon: <HelpCircle className="w-6 h-6 text-[#24796C]" />,
      desc: 'General municipal problems requiring departmental inspection.',
      href: '/report',
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-[#E7F0EA]/50 to-[#F7F8F4] border-b border-[#DDE5DF] pt-12 pb-16 lg:pt-20 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E7F0EA] border border-[#24796C]/20 text-[#24796C] text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Generation Municipal Grievance Triage</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#19364A] tracking-tight leading-[1.15]">
                Your city. Your voice. <br className="hidden sm:inline" />
                <span className="text-[#24796C]">A better tomorrow.</span>
              </h1>

              <p className="text-base sm:text-lg text-[#63736F] max-w-2xl leading-relaxed">
                Report civic issues, help your community and follow every complaint from
                submission to resolution. Together, we can make our neighbourhoods better.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <NextLink
                  href="/report"
                  className="inline-flex items-center gap-2 px-6 py-3.5 text-sm sm:text-base font-semibold text-white bg-[#24796C] hover:bg-[#19364A] rounded-xl shadow-md transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <span>Report an Issue</span>
                  <ArrowRight className="w-4 h-4" />
                </NextLink>

                <NextLink
                  href="/track"
                  className="inline-flex items-center gap-2 px-6 py-3.5 text-sm sm:text-base font-semibold text-[#19364A] bg-white border border-[#DDE5DF] hover:border-[#24796C] hover:bg-[#F7F8F4] rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <Search className="w-4 h-4 text-[#24796C]" />
                  <span>Track a Complaint</span>
                </NextLink>
              </div>

              {/* Trust signals */}
              <div className="flex flex-wrap items-center gap-6 pt-4 text-xs text-[#63736F] border-t border-[#DDE5DF]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#24796C]" />
                  <span>Verified Tracking IDs</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#24796C]" />
                  <span>Human-Governed Decisions</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#24796C]" />
                  <span>Neighbourhood Geolocation</span>
                </div>
              </div>
            </div>

            {/* Right Civic Illustration Card */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md bg-white rounded-2xl border border-[#DDE5DF] p-6 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-[#DDE5DF] pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#C85C55]" />
                    <div className="w-3 h-3 rounded-full bg-[#D99A42]" />
                    <div className="w-3 h-3 rounded-full bg-[#24796C]" />
                  </div>
                  <span className="text-xs font-semibold text-[#63736F]">
                    Live Citizen Resolution Flow
                  </span>
                </div>

                {/* Friendly SVG Scene */}
                <div className="bg-[#F7F8F4] rounded-xl p-4 border border-[#DDE5DF] text-center space-y-3">
                  <svg
                    viewBox="0 0 320 180"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-auto max-h-44 mx-auto"
                  >
                    {/* Background City Silhouette */}
                    <rect x="20" y="70" width="35" height="90" rx="3" fill="#E7F0EA" />
                    <rect x="65" y="50" width="45" height="110" rx="3" fill="#DDE5DF" />
                    <rect x="120" y="80" width="40" height="80" rx="3" fill="#E7F0EA" />
                    <rect x="170" y="60" width="50" height="100" rx="3" fill="#DDE5DF" />
                    <rect x="230" y="75" width="40" height="85" rx="3" fill="#E7F0EA" />

                    {/* Streetline */}
                    <rect x="10" y="150" width="300" height="8" rx="4" fill="#19364A" />
                    <line x1="30" y1="154" x2="60" y2="154" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="4 4" />
                    <line x1="90" y1="154" x2="140" y2="154" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="4 4" />
                    <line x1="170" y1="154" x2="220" y2="154" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="4 4" />
                    <line x1="250" y1="154" x2="290" y2="154" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="4 4" />

                    {/* Streetlight */}
                    <path d="M260 150 V95 C260 90 250 88 245 88" stroke="#63736F" strokeWidth="4" strokeLinecap="round" />
                    <circle cx="243" cy="92" r="5" fill="#D99A42" />

                    {/* Resident Figure with Mobile Phone */}
                    <circle cx="85" cy="115" r="9" fill="#19364A" />
                    <path d="M85 124 V148" stroke="#19364A" strokeWidth="6" strokeLinecap="round" />
                    <path d="M78 132 L95 130" stroke="#19364A" strokeWidth="3" strokeLinecap="round" />
                    {/* Smartphone */}
                    <rect x="94" y="122" width="9" height="16" rx="2" fill="#24796C" />
                    <circle cx="98.5" cy="126" r="1.5" fill="#FFFFFF" />

                    {/* Speech / Report Pin Bubble */}
                    <g transform="translate(108, 102)">
                      <rect x="0" y="0" width="85" height="30" rx="6" fill="#24796C" />
                      <polygon points="0,15 -6,20 0,22" fill="#24796C" />
                      <text x="8" y="14" fill="#FFFFFF" fontSize="8" fontWeight="bold">Civic Issue</text>
                      <text x="8" y="24" fill="#E7F0EA" fontSize="7">Triaged & Geotagged</text>
                    </g>
                  </svg>

                  <p className="text-xs text-[#19364A] font-medium">
                    A resident snapping a photo of road damage in Gandhipuram, Coimbatore
                  </p>
                </div>

                {/* Instant Assessment Snapshot */}
                <div className="bg-[#E7F0EA] p-3 rounded-xl border border-[#24796C]/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#24796C]" />
                    <span className="font-semibold text-[#19364A]">Gemini AI Triage Engine</span>
                  </div>
                  <span className="text-[#24796C] font-mono font-bold">Priority: 82/100</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Real Statistics Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white rounded-xl border border-[#DDE5DF] p-6 shadow-sm">
            <span className="text-xs font-semibold text-[#63736F] uppercase tracking-wider block">
              Total Reports
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#19364A] mt-2">
              {stats.totalComplaints}
            </div>
            <p className="text-xs text-[#63736F] mt-1">Submitted by verified citizens</p>
          </div>

          <div className="bg-white rounded-xl border border-[#DDE5DF] p-6 shadow-sm">
            <span className="text-xs font-semibold text-[#63736F] uppercase tracking-wider block">
              In Remediation
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#D99A42] mt-2">
              {stats.inProgress + stats.underReview}
            </div>
            <p className="text-xs text-[#63736F] mt-1">Under active field review</p>
          </div>

          <div className="bg-white rounded-xl border border-[#DDE5DF] p-6 shadow-sm">
            <span className="text-xs font-semibold text-[#63736F] uppercase tracking-wider block">
              Resolved
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#24796C] mt-2">
              {stats.resolved}
            </div>
            <p className="text-xs text-[#63736F] mt-1">Inspected and closed</p>
          </div>

          <div className="bg-white rounded-xl border border-[#DDE5DF] p-6 shadow-sm">
            <span className="text-xs font-semibold text-[#63736F] uppercase tracking-wider block">
              High / Critical
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#C85C55] mt-2">
              {stats.criticalPriority + stats.highPriority}
            </div>
            <p className="text-xs text-[#63736F] mt-1">Urgent public safety alerts</p>
          </div>
        </div>
      </section>

      {/* Civic Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-semibold text-[#24796C] uppercase tracking-wider">
            Municipal Scope
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#19364A]">
            Report Any Neighbourhood Concern
          </h2>
          <p className="text-sm text-[#63736F]">
            Select a category to jump directly into the reporting form, or let Gemini AI recommend the right department automatically.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat, idx) => (
            <NextLink
              key={idx}
              href={cat.href}
              className="group bg-white rounded-xl border border-[#DDE5DF] p-6 hover:border-[#24796C] hover:shadow-md transition-all space-y-3 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-[#E7F0EA] flex items-center justify-center group-hover:bg-[#24796C] group-hover:text-white transition-colors">
                {cat.icon}
              </div>
              <h3 className="text-lg font-bold text-[#19364A] group-hover:text-[#24796C] transition-colors">
                {cat.name}
              </h3>
              <p className="text-xs text-[#63736F] leading-relaxed">{cat.desc}</p>
              <div className="pt-2 text-xs font-semibold text-[#24796C] flex items-center gap-1">
                <span>File complaint</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </NextLink>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white border-y border-[#DDE5DF] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-semibold text-[#24796C] uppercase tracking-wider">
              Transparent Operations
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#19364A]">
              How CivicResolve Works
            </h2>
            <p className="text-sm text-[#63736F]">
              Three straightforward steps connecting citizens with local government field teams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#F7F8F4] rounded-xl border border-[#DDE5DF] p-6 space-y-3">
              <span className="text-3xl font-extrabold text-[#24796C] block font-mono">01</span>
              <h3 className="text-base font-bold text-[#19364A]">Report the Issue</h3>
              <p className="text-xs text-[#63736F] leading-relaxed">
                Describe the problem in English or Tamil, capture an optional photo, and confirm the
                street location using GPS or landmark entry.
              </p>
            </div>

            <div className="bg-[#F7F8F4] rounded-xl border border-[#DDE5DF] p-6 space-y-3">
              <span className="text-3xl font-extrabold text-[#24796C] block font-mono">02</span>
              <h3 className="text-base font-bold text-[#19364A]">Get It to the Right Team</h3>
              <p className="text-xs text-[#63736F] leading-relaxed">
                Gemini AI performs multimodal triage, predicts responsible departments, and
                computes a transparent 5-factor priority score.
              </p>
            </div>

            <div className="bg-[#F7F8F4] rounded-xl border border-[#DDE5DF] p-6 space-y-3">
              <span className="text-3xl font-extrabold text-[#24796C] block font-mono">03</span>
              <h3 className="text-base font-bold text-[#19364A]">Track the Progress</h3>
              <p className="text-xs text-[#63736F] leading-relaxed">
                Receive a tracking ID (e.g. CR-2026-8491) and follow field inspection, crew assignment,
                and resolution updates in real time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Neighbourhood Pulse Live Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#DDE5DF] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#24796C] animate-pulse" />
              <span className="text-xs font-semibold text-[#24796C] uppercase tracking-wider">
                Neighbourhood Pulse
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-[#19364A]">
              Recent Public Neighbourhood Reports
            </h2>
            <p className="text-xs text-[#63736F]">
              Privacy-safe issues submitted and supported by fellow residents across the pilot jurisdiction.
            </p>
          </div>

          <NextLink
            href="/issues"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#24796C] hover:text-[#19364A] transition"
          >
            <span>View All Public Issues</span>
            <ArrowRight className="w-4 h-4" />
          </NextLink>
        </div>

        {recentReports.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#DDE5DF] p-8 text-center text-[#63736F]">
            No public reports currently available. Be the first to report an issue in your area!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentReports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-xl border border-[#DDE5DF] p-5 shadow-sm space-y-4 flex flex-col justify-between hover:border-[#24796C] transition"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-[#63736F]">
                      {report.trackingCode}
                    </span>
                    <PriorityBadge priority={report.priority} size="sm" />
                  </div>

                  <h3 className="text-sm font-bold text-[#19364A] line-clamp-2">
                    {report.title}
                  </h3>

                  <p className="text-xs text-[#63736F] line-clamp-2 leading-relaxed">
                    {report.summary}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-[#DDE5DF]">
                  <div className="flex items-center justify-between text-xs text-[#63736F]">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#24796C]" />
                      <span>{report.locality}</span>
                    </div>
                    <StatusBadge status={report.status} size="sm" />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1 text-xs font-semibold text-[#19364A]">
                      <ThumbsUp className="w-3.5 h-3.5 text-[#24796C]" />
                      <span>{report.supportCount} Supporters</span>
                    </div>

                    <NextLink
                      href={`/track/${report.trackingCode}`}
                      className="text-xs font-semibold text-[#24796C] hover:underline"
                    >
                      Track Details →
                    </NextLink>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
