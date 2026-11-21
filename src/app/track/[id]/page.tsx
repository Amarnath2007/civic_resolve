'use client';

import React, { useEffect, useState } from 'react';
import NextLink from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TimelineView } from '@/components/ui/TimelineView';
import { PriorityScoreCard } from '@/components/ui/PriorityScoreCard';
import { AiAssessmentCard } from '@/components/ui/AiAssessmentCard';
import { ImageViewer } from '@/components/ui/ImageViewer';
import { Report, ComplaintUpdate } from '@/types';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  Sparkles,
  ThumbsUp,
  AlertCircle,
  Copy,
  Check,
  Tag,
} from 'lucide-react';

export default function TrackDetailPage() {
  const params = useParams();
  const idOrCode = params.id as string;
  const router = useRouter();
  const { user, idToken, loading: authLoading } = useAuth();

  const [report, setReport] = useState<Report | null>(null);
  const [updates, setUpdates] = useState<ComplaintUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [supportCount, setSupportCount] = useState(0);
  const [supportMessage, setSupportMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReport() {
      if (!idOrCode) return;
      setLoading(true);
      setError(null);

      try {
        const headers: Record<string, string> = {};
        if (idToken) {
          headers['Authorization'] = `Bearer ${idToken}`;
        }

        const res = await fetch(`/api/reports/${encodeURIComponent(idOrCode)}`, { headers });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to load complaint information.');
        }

        setReport(data.report);
        setUpdates(data.updates || []);
        setSupportCount(data.report.supportCount || 0);
      } catch (err: any) {
        console.error('Fetch report error:', err);
        setError(err.message || 'Complaint not found.');
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchReport();
    }
  }, [idOrCode, idToken, authLoading]);

  const handleSupport = async () => {
    if (!report) return;
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`/api/reports/${report.id}/support`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setSupportCount(data.supportCount);
        setSupportMessage(data.message);
      } else {
        setSupportMessage(data.message || data.error);
      }
    } catch {
      setSupportMessage('Failed to submit support vote.');
    }
  };

  const handleCopyCode = () => {
    if (!report) return;
    navigator.clipboard.writeText(report.trackingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-[#24796C] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-[#63736F]">Retrieving official complaint record...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full mx-auto flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-[#19364A]">Complaint Record Not Found</h2>
        <p className="text-xs text-[#63736F] leading-relaxed">
          {error || 'No matching complaint was found for this tracking identifier.'}
        </p>
        <NextLink
          href="/track"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#24796C] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Try another tracking code</span>
        </NextLink>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <NextLink
          href="/track"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#63736F] hover:text-[#19364A] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tracker</span>
        </NextLink>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-[#19364A] bg-white border border-[#DDE5DF] px-3 py-1.5 rounded-lg flex items-center gap-2">
            <span>{report.trackingCode}</span>
            <button
              onClick={handleCopyCode}
              className="text-[#63736F] hover:text-[#24796C] cursor-pointer"
              title="Copy code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#24796C]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </span>

          <StatusBadge status={report.status} />
        </div>
      </div>

      {/* Main Overview Card */}
      <div className="bg-white rounded-2xl border border-[#DDE5DF] p-6 sm:p-8 shadow-sm space-y-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <PriorityBadge priority={report.finalPriority} score={report.aiPriorityScore} showScore />
            <span className="text-xs font-semibold text-[#63736F] bg-[#F7F8F4] px-2.5 py-1 rounded-md border border-[#DDE5DF]">
              {report.finalCategory}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#19364A] tracking-tight">
            {report.title}
          </h1>

          <p className="text-sm text-[#63736F] leading-relaxed pt-1">
            {report.description}
          </p>
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#DDE5DF] text-xs">
          <div className="flex items-start gap-2">
            <Building2 className="w-4 h-4 text-[#24796C] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#19364A] block">Assigned Department</span>
              <span className="text-[#63736F]">{report.finalDepartment}</span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-[#24796C] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#19364A] block">Location</span>
              <span className="text-[#63736F]">
                {report.location?.locality}
                {report.location?.streetOrLandmark ? `, ${report.location.streetOrLandmark}` : ''}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-[#24796C] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#19364A] block">Submission Date</span>
              <span className="text-[#63736F]">
                {new Date(report.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Photographic Evidence if attached */}
        {report.imageUrl ? (
          <div className="border-t border-[#DDE5DF] pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#19364A] uppercase tracking-wider block">
                Photographic Evidence (Authorized Access)
              </span>
              <span className="text-[10px] text-[#24796C] font-semibold bg-[#E7F0EA] px-2 py-0.5 rounded">
                Cloudinary Signed Temporary Delivery
              </span>
            </div>
            <ImageViewer
              src={report.imageUrl}
              alt={report.title}
              observations={report.imageObservations}
              caption={`${report.trackingCode}: ${report.title}`}
              isAuthorized={true}
            />
          </div>
        ) : report.imageObservations && report.imageObservations.length > 0 ? (
          <div className="border-t border-[#DDE5DF] pt-4 space-y-1.5 text-xs">
            <span className="font-bold text-[#19364A] uppercase tracking-wider block">
              Photographic Evidence
            </span>
            <p className="text-[#63736F] bg-[#F7F8F4] p-3 rounded-lg border border-[#DDE5DF]">
              Original complaint photographs are protected and restricted to the verified report owner and authorized municipal staff.
              AI visual inspection observations are available in the assessment card below.
            </p>
          </div>
        ) : null}

        {/* Support this issue banner */}
        {report.sharePublicly && (
          <div className="bg-[#E7F0EA]/70 p-4 rounded-xl border border-[#24796C]/20 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs space-y-0.5">
              <span className="font-semibold text-[#19364A] block">
                Neighbourhood Support Count
              </span>
              <p className="text-[#63736F]">
                {supportCount} citizens have supported this issue.
              </p>
              {supportMessage && (
                <p className="text-[11px] font-semibold text-[#24796C]">{supportMessage}</p>
              )}
            </div>

            <button
              type="button"
              onClick={handleSupport}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#24796C] hover:bg-[#19364A] rounded-lg transition shadow-xs cursor-pointer"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>Support This Issue</span>
            </button>
          </div>
        )}
      </div>

      {/* Progress Timeline */}
      <TimelineView currentStatus={report.status} updates={updates} />

      {/* AI Triage and Scoring Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AiAssessmentCard
          summary={report.aiSummary}
          reason={report.aiReason}
          suggestedCategory={report.finalCategory}
          suggestedDepartment={report.finalDepartment}
          priorityLevel={report.finalPriority}
          priorityScore={report.aiPriorityScore}
          confidence={report.aiConfidence}
          imageObservations={report.imageObservations}
          recommendedAction={report.recommendedAction}
          triageMethod={report.triageMethod}
          detectedLanguage={report.detectedLanguage}
        />

        <PriorityScoreCard
          score={report.aiPriorityScore}
          priorityLevel={report.finalPriority}
          breakdown={report.scoreBreakdown}
          justification={report.aiReason}
        />
      </div>
    </div>
  );
}
