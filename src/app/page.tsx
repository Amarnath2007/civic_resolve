import React from 'react';
import NextLink from 'next/link';
import Image from 'next/image';
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
  FileText,
  Activity,
} from 'lucide-react';
import { dbService } from '@/lib/db/store';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';

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
    <div className="space-y-12 sm:space-y-16 lg:space-y-20 pb-20">
      {/* 1. Hero Section: Clean Two-Column Layout */}
      <section className="bg-gradient-to-b from-[#E7F0EA]/40 via-[#F7F8F4] to-[#F7F8F4] border-b border-[#DDE5DF] pt-8 pb-12 sm:pt-12 sm:pb-16 lg:pt-16 lg:pb-18">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Heading, Context, Actions, Trust */}
            <div className="lg:col-span-6 xl:col-span-6 space-y-6 text-left">
              {/* Introductory Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E7F0EA] border border-[#24796C]/25 text-[#24796C] text-[11px] sm:text-xs font-semibold shadow-2xs max-w-full">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate sm:overflow-visible">Next-Generation Municipal Grievance Triage</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[2.75rem] xl:text-[3.25rem] font-extrabold text-[#19364A] tracking-tight leading-[1.15] hyphens-none break-normal">
                Your city. Your voice. <br className="hidden sm:inline" />
                <span className="text-[#24796C] inline-block">A better tomorrow.</span>
              </h1>

              {/* Supporting Text */}
              <p className="text-base sm:text-lg text-[#63736F] max-w-xl leading-relaxed">
                Report civic issues, help your community and follow every complaint from submission
                to resolution. Together, we can make our neighbourhoods better.
              </p>

              {/* Primary & Secondary CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <NextLink
                  href="/report"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm sm:text-base font-semibold text-white bg-[#24796C] hover:bg-[#19364A] rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-[1.01] cursor-pointer whitespace-nowrap"
                >
                  <span>Report an Issue</span>
                  <ArrowRight className="w-4 h-4" />
                </NextLink>

                <NextLink
                  href="/track"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm sm:text-base font-semibold text-[#19364A] bg-white border border-[#DDE5DF] hover:border-[#24796C] hover:bg-[#F7F8F4] rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
                >
                  <Search className="w-4 h-4 text-[#24796C]" />
                  <span>Track a Complaint</span>
                </NextLink>
              </div>

              {/* Three Small Trust Indicators */}
              <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-5 gap-y-2 pt-4 text-xs font-medium text-[#63736F] border-t border-[#DDE5DF]">
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <CheckCircle2 className="w-4 h-4 text-[#24796C] shrink-0" />
                  <span>Verified Tracking IDs</span>
                </div>
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <ShieldCheck className="w-4 h-4 text-[#24796C] shrink-0" />
                  <span>Human-Governed Decisions</span>
                </div>
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <MapPin className="w-4 h-4 text-[#24796C] shrink-0" />
                  <span>Neighbourhood Geolocation</span>
                </div>
              </div>
            </div>

            {/* Right Column: Prominent Hero Image (hero.png) */}
            <div className="lg:col-span-6 xl:col-span-6 flex justify-center lg:justify-end">
              <div className="w-full max-w-lg lg:max-w-none">
                <div className="overflow-hidden rounded-[22px] border border-[#DDE5DF] shadow-lg shadow-black/5 bg-white transition-all">
                  <Image
                    src="/hero.png"
                    alt="Resident reporting a road pothole using the CivicResolve smartphone app"
                    width={1536}
                    height={1024}
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                    className="w-full h-auto object-cover block"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Real Statistics Section: Consistent One-Row Layout on Desktop */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
          {/* Card 1: Total Reports */}
          <div className="bg-white rounded-2xl border border-[#DDE5DF] p-5 sm:p-6 shadow-xs hover:border-[#24796C]/40 transition-colors h-full flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#63736F] uppercase tracking-wider block">
                Total Reports
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#E7F0EA] text-[#24796C] flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-[#19364A] tracking-tight">
                {stats.totalComplaints}
              </div>
              <p className="text-xs text-[#63736F] mt-1.5">Submitted by verified citizens</p>
            </div>
          </div>

          {/* Card 2: In Remediation */}
          <div className="bg-white rounded-2xl border border-[#DDE5DF] p-5 sm:p-6 shadow-xs hover:border-[#D99A42]/40 transition-colors h-full flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#63736F] uppercase tracking-wider block">
                In Remediation
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#D99A42] flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-[#D99A42] tracking-tight">
                {stats.inProgress + stats.underReview}
              </div>
              <p className="text-xs text-[#63736F] mt-1.5">Under active field review</p>
            </div>
          </div>

          {/* Card 3: Resolved */}
          <div className="bg-white rounded-2xl border border-[#DDE5DF] p-5 sm:p-6 shadow-xs hover:border-[#24796C]/40 transition-colors h-full flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#63736F] uppercase tracking-wider block">
                Resolved
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#24796C] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-[#24796C] tracking-tight">
                {stats.resolved}
              </div>
              <p className="text-xs text-[#63736F] mt-1.5">Inspected and successfully closed</p>
            </div>
          </div>

          {/* Card 4: Urgent & Critical */}
          <div className="bg-white rounded-2xl border border-[#DDE5DF] p-5 sm:p-6 shadow-xs hover:border-[#C85C55]/40 transition-colors h-full flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#63736F] uppercase tracking-wider block">
                High / Critical
              </span>
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#C85C55] flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-[#C85C55] tracking-tight">
                {stats.criticalPriority + stats.highPriority}
              </div>
              <p className="text-xs text-[#63736F] mt-1.5">Urgent public safety alerts</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Civic Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-semibold text-[#24796C] uppercase tracking-wider">
            Municipal Scope
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#19364A] tracking-tight">
            Report Any Neighbourhood Concern
          </h2>
          <p className="text-sm text-[#63736F]">
            Select a category to jump directly into the reporting form, or let Gemini AI recommend the
            right department automatically.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat, idx) => (
            <NextLink
              key={idx}
              href={cat.href}
              className="group bg-white rounded-2xl border border-[#DDE5DF] p-6 hover:border-[#24796C] hover:shadow-md transition-all space-y-3 cursor-pointer"
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

      {/* 4. How It Works */}
      <section className="bg-white border-y border-[#DDE5DF] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-semibold text-[#24796C] uppercase tracking-wider">
              Transparent Operations
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#19364A] tracking-tight">
              How CivicResolve Works
            </h2>
            <p className="text-sm text-[#63736F]">
              Three straightforward steps connecting citizens with local government field teams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#F7F8F4] rounded-2xl border border-[#DDE5DF] p-6 space-y-3">
              <span className="text-3xl font-extrabold text-[#24796C] block font-mono">01</span>
              <h3 className="text-base font-bold text-[#19364A]">Report the Issue</h3>
              <p className="text-xs text-[#63736F] leading-relaxed">
                Describe the problem in English or Tamil, capture an optional photo, and confirm the
                street location using GPS or landmark entry.
              </p>
            </div>

            <div className="bg-[#F7F8F4] rounded-2xl border border-[#DDE5DF] p-6 space-y-3">
              <span className="text-3xl font-extrabold text-[#24796C] block font-mono">02</span>
              <h3 className="text-base font-bold text-[#19364A]">Get It to the Right Team</h3>
              <p className="text-xs text-[#63736F] leading-relaxed">
                Gemini AI performs multimodal triage, predicts responsible departments, and computes
                a transparent 5-factor priority score.
              </p>
            </div>

            <div className="bg-[#F7F8F4] rounded-2xl border border-[#DDE5DF] p-6 space-y-3">
              <span className="text-3xl font-extrabold text-[#24796C] block font-mono">03</span>
              <h3 className="text-base font-bold text-[#19364A]">Track the Progress</h3>
              <p className="text-xs text-[#63736F] leading-relaxed">
                Receive a tracking ID (e.g. CR-2026-8491) and follow field inspection, crew
                assignment, and resolution updates in real time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Neighbourhood Pulse Live Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#DDE5DF] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#24796C] animate-pulse" />
              <span className="text-xs font-semibold text-[#24796C] uppercase tracking-wider">
                Neighbourhood Pulse
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-[#19364A] tracking-tight">
              Recent Public Neighbourhood Reports
            </h2>
            <p className="text-xs text-[#63736F]">
              Privacy-safe issues submitted and supported by fellow residents across the pilot
              jurisdiction.
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
          <div className="bg-white rounded-2xl border border-[#DDE5DF] p-8 text-center text-[#63736F]">
            No public reports currently available. Be the first to report an issue in your area!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentReports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-2xl border border-[#DDE5DF] p-5 shadow-xs space-y-4 flex flex-col justify-between hover:border-[#24796C] transition"
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
