'use client';

import React, { useEffect, useState } from 'react';
import NextLink from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PriorityScoreCard } from '@/components/ui/PriorityScoreCard';
import { AiAssessmentCard } from '@/components/ui/AiAssessmentCard';
import { TimelineView } from '@/components/ui/TimelineView';
import { ImageViewer } from '@/components/ui/ImageViewer';
import {
  Report,
  ComplaintStatus,
  CivicCategory,
  CivicDepartment,
  PriorityLevel,
  ComplaintUpdate,
} from '@/types';
import {
  CIVIC_CATEGORIES,
  CIVIC_DEPARTMENTS,
  COMPLAINT_STATUSES,
  PRIORITY_LEVELS,
} from '@/lib/constants';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Save,
  Lock,
} from 'lucide-react';

export default function AdminComplaintDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { idToken } = useAuth();

  const [report, setReport] = useState<Report | null>(null);
  const [updates, setUpdates] = useState<ComplaintUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit controls
  const [editStatus, setEditStatus] = useState<ComplaintStatus>('Reported');
  const [editCategory, setEditCategory] = useState<CivicCategory>('Roads & Potholes');
  const [editDepartment, setEditDepartment] = useState<CivicDepartment>('Roads & Public Works');
  const [editPriority, setEditPriority] = useState<PriorityLevel>('Medium');
  const [publicUpdateNote, setPublicUpdateNote] = useState('');
  const [internalAdminNote, setInternalAdminNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDetail() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const headers: Record<string, string> = {};
        if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

        const res = await fetch(`/api/reports/${encodeURIComponent(id)}`, { headers });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to load complaint detail.');
        }

        const rep = data.report as Report;
        setReport(rep);
        setUpdates(data.updates || []);

        setEditStatus(rep.status);
        setEditCategory(rep.finalCategory);
        setEditDepartment(rep.finalDepartment);
        setEditPriority(rep.finalPriority);
      } catch (err: unknown) {
        const errorObj = err as Error;
        console.error('Fetch detail error:', errorObj);
        setError(errorObj.message || 'Complaint not found.');
      } finally {
        setLoading(false);
      }
    }

    fetchDetail();
  }, [id, idToken]);

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report) return;
    setSaving(true);
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

      const res = await fetch(`/api/reports/${report.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save administrative updates.');
      }

      setReport(data.report);
      setUpdates(data.updates || []);
      setSaveSuccessMsg('Administrative record and dispatch note successfully updated.');
      setPublicUpdateNote('');
      setInternalAdminNote('');
    } catch (err: unknown) {
      const errorObj = err as Error;
      alert(errorObj.message || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-[#24796C] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-[#63736F]">Loading complaint dossier...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl mx-auto flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-[#19364A]">Complaint Dossier Not Found</h2>
        <p className="text-xs text-[#63736F]">{error}</p>
        <NextLink
          href="/admin/complaints"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#24796C] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Complaints Queue</span>
        </NextLink>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DDE5DF] pb-4">
        <div className="space-y-1">
          <NextLink
            href="/admin/complaints"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#63736F] hover:text-[#19364A] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Complaints Queue</span>
          </NextLink>
          <div className="flex items-center gap-3 pt-1">
            <span className="font-mono text-base font-extrabold text-[#19364A] bg-white border border-[#DDE5DF] px-3 py-1 rounded-lg">
              {report.trackingCode}
            </span>
            <PriorityBadge priority={report.finalPriority} score={report.aiPriorityScore} showScore />
            <StatusBadge status={report.status} />
          </div>
        </div>

        <NextLink
          href={`/track/${report.trackingCode}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#DDE5DF] hover:border-[#24796C] text-xs font-semibold text-[#19364A] transition shadow-2xs"
        >
          <span>View Public Citizen Tracker</span>
          <ExternalLink className="w-3.5 h-3.5 text-[#24796C]" />
        </NextLink>
      </div>

      {saveSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Main Grid: Details & Admin Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): Original Grievance, Photographic Evidence, Timeline */}
        <div className="lg:col-span-7 space-y-8">
          {/* Grievance Statement */}
          <div className="bg-white rounded-2xl border border-[#DDE5DF] p-6 shadow-xs space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#63736F] tracking-wider block">
                Citizen Grievance Title
              </span>
              <h2 className="text-xl font-extrabold text-[#19364A]">
                {report.title}
              </h2>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-[#19364A] block">Original Problem Description:</span>
              <p className="bg-[#F7F8F4] p-4 rounded-xl border border-[#DDE5DF] text-xs sm:text-sm text-[#19364A] leading-relaxed whitespace-pre-wrap">
                {report.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-[#63736F] border-t border-[#DDE5DF]">
              <div>
                <strong>Locality:</strong> {report.location?.locality}
                {report.location?.streetOrLandmark ? `, ${report.location.streetOrLandmark}` : ''}
              </div>
              <div>
                <strong>Submitted:</strong> {new Date(report.createdAt).toLocaleString()}
              </div>
              <div>
                <strong>Citizen Email:</strong> {report.reporterEmail || 'Anonymous'} (Confidential)
              </div>
              <div>
                <strong>Language Detected:</strong> {report.detectedLanguage || 'English'}
              </div>
            </div>
          </div>

          {/* Photographic Evidence via ImageViewer */}
          <div className="bg-white rounded-2xl border border-[#DDE5DF] p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#DDE5DF] pb-3">
              <span className="text-xs font-bold text-[#19364A] uppercase tracking-wider block">
                Photographic Evidence
              </span>
              <span className="text-[10px] text-[#24796C] font-semibold bg-[#E7F0EA] px-2 py-0.5 rounded">
                Cloudinary Authenticated Delivery
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

          {/* Timeline of Status Updates */}
          <TimelineView currentStatus={report.status} updates={updates} />
        </div>

        {/* Right Column (5 cols): Admin Management Panel, Gemini Assessment */}
        <div className="lg:col-span-5 space-y-8">
          {/* Administrative Action Control Box */}
          <form
            onSubmit={handleSaveChanges}
            className="bg-white rounded-2xl border-2 border-[#19364A]/20 p-6 shadow-sm space-y-5"
          >
            <div className="flex items-center gap-2 border-b border-[#DDE5DF] pb-3">
              <Building2 className="w-5 h-5 text-[#24796C]" />
              <h3 className="text-base font-extrabold text-[#19364A]">
                Municipal Action Desk
              </h3>
            </div>

            {/* Status Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#19364A] uppercase tracking-wider">
                Remediation Status
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as ComplaintStatus)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-[#DDE5DF] bg-[#F7F8F4] font-semibold text-[#19364A] focus:outline-none focus:ring-2 focus:ring-[#24796C]"
              >
                {COMPLAINT_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Department Reassignment */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#19364A] uppercase tracking-wider">
                Assigned Municipal Department
              </label>
              <select
                value={editDepartment}
                onChange={(e) => setEditDepartment(e.target.value as CivicDepartment)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-[#DDE5DF] bg-[#F7F8F4] font-semibold text-[#19364A] focus:outline-none focus:ring-2 focus:ring-[#24796C]"
              >
                {CIVIC_DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Category Override */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#19364A] uppercase tracking-wider">
                Civic Category
              </label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value as CivicCategory)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-[#DDE5DF] bg-[#F7F8F4] text-[#19364A] focus:outline-none focus:ring-2 focus:ring-[#24796C]"
              >
                {CIVIC_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Priority Override */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#19364A] uppercase tracking-wider">
                Urgency Priority Level
              </label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as PriorityLevel)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-[#DDE5DF] bg-[#F7F8F4] font-semibold text-[#19364A] focus:outline-none focus:ring-2 focus:ring-[#24796C]"
              >
                {PRIORITY_LEVELS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Public Note for Citizen */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#19364A] uppercase tracking-wider flex items-center justify-between">
                <span>Citizen Dispatch Note (Public)</span>
                <span className="text-[10px] text-[#24796C] lowercase font-normal">visible on tracker</span>
              </label>
              <textarea
                rows={2}
                value={publicUpdateNote}
                onChange={(e) => setPublicUpdateNote(e.target.value)}
                placeholder="e.g. Field inspection unit dispatched. Materials requisitioned."
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-[#DDE5DF] bg-[#F7F8F4] text-[#19364A] focus:outline-none focus:ring-2 focus:ring-[#24796C]"
              />
            </div>

            {/* Internal Admin Note */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#19364A] uppercase tracking-wider flex items-center justify-between">
                <span>Internal Staff Note (Confidential)</span>
                <span className="text-[10px] text-amber-700 lowercase font-normal flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" /> internal only
                </span>
              </label>
              <textarea
                rows={2}
                value={internalAdminNote}
                onChange={(e) => setInternalAdminNote(e.target.value)}
                placeholder="e.g. Contractor penalty issued; site visit by Assistant Engineer scheduled."
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-[#DDE5DF] bg-[#F7F8F4] text-[#19364A] focus:outline-none focus:ring-2 focus:ring-[#24796C]"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl bg-[#19364A] hover:bg-[#24796C] text-white font-bold text-xs transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving Updates...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Commit Administrative Updates</span>
                </>
              )}
            </button>
          </form>

          {/* AI Assessment Card */}
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

          {/* Priority Score Breakdown Card */}
          <PriorityScoreCard
            score={report.aiPriorityScore}
            priorityLevel={report.finalPriority}
            breakdown={report.scoreBreakdown}
            justification={report.aiReason}
          />
        </div>
      </div>
    </div>
  );
}
