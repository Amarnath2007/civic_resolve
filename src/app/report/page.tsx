'use client';

import React, { useState, useEffect, Suspense } from 'react';
import NextLink from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LocationPicker } from '@/components/map/LocationPicker';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { PriorityScoreCard } from '@/components/ui/PriorityScoreCard';
import { AiAssessmentCard } from '@/components/ui/AiAssessmentCard';
import { CIVIC_CATEGORIES } from '@/lib/constants';
import { CivicCategory, Report } from '@/types';
import {
  Upload,
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Shield,
  HelpCircle,
  Copy,
  Check,
  Building2,
  FileText,
  MapPin,
  Image as ImageIcon,
  UserCheck,
  Lock,
} from 'lucide-react';

function ReportIssueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, idToken, loading: authLoading, loginDemo } = useAuth();
  const [isDemoSigningIn, setIsDemoSigningIn] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CivicCategory>('Other / Not Sure');
  const [locality, setLocality] = useState('');
  const [streetOrLandmark, setStreetOrLandmark] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [sharePublicly, setSharePublicly] = useState(false);

  // Image upload states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  // Submission & Result states
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submittedReport, setSubmittedReport] = useState<Report | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Pre-populate category from query param if provided
  useEffect(() => {
    const qCat = searchParams.get('cat');
    if (qCat && CIVIC_CATEGORIES.includes(qCat as CivicCategory)) {
      setCategory(qCat as CivicCategory);
    }
  }, [searchParams]);

  // One-click quick demo login for citizen
  const handleQuickCitizenDemo = async () => {
    setIsDemoSigningIn(true);
    setImageError(null);
    try {
      const res = await loginDemo('citizen');
      if (!res.success) {
        setImageError(res.error || 'Failed to authenticate citizen demo account.');
      }
    } catch (err: any) {
      setImageError(err.message || 'Error signing in as citizen.');
    } finally {
      setIsDemoSigningIn(false);
    }
  };

  // Handle file input
  const handleImageChange = (file: File | null) => {
    setImageError(null);
    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      setImageBase64(null);
      return;
    }

    if (!user) {
      setImageError('Citizen sign-in is required before uploading photographic evidence.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setImageError('Please upload an image in JPEG, PNG, or WebP format.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image file size must be less than 5 MB.');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setImagePreview(result);
      const base64Data = result.replace(/^data:image\/\w+;base64,/, '');
      setImageBase64(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);

    if (title.trim().length < 5) {
      setSubmissionError('Please enter a descriptive issue title (minimum 5 characters).');
      return;
    }

    if (description.trim().length < 10) {
      setSubmissionError('Please describe the issue in at least 10 characters.');
      return;
    }

    if (!locality.trim()) {
      setSubmissionError('Please specify the neighbourhood locality or area.');
      return;
    }

    setSubmitting(true);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        locality: locality.trim(),
        streetOrLandmark: streetOrLandmark.trim() || undefined,
        latitude,
        longitude,
        sharePublicly,
        imageBase64: imageBase64 || undefined,
        imageMimeType: imageFile?.type || undefined,
      };

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Your citizen session has expired or requires authentication. Please sign in again.');
        }
        throw new Error(data.error || 'Failed to submit complaint.');
      }

      setSubmittedReport(data.report);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Submission failed:', err);
      setSubmissionError(err.message || 'Network error occurred while submitting your report.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (!submittedReport) return;
    navigator.clipboard.writeText(submittedReport.trackingCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // SUCCESS CONFIRMATION VIEW
  if (submittedReport) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Banner */}
        <div className="bg-white rounded-2xl border border-[#24796C]/30 p-8 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#E7F0EA] text-[#24796C] mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#19364A]">
              Your report has been successfully submitted.
            </h1>
            <p className="text-xs sm:text-sm text-[#63736F]">
              Your grievance has been validated, triaged by Gemini AI, and recorded in the municipal registry.
            </p>
          </div>

          {/* Tracking ID Badge */}
          <div className="inline-flex flex-col sm:flex-row items-center gap-3 bg-[#F7F8F4] border border-[#DDE5DF] px-6 py-3 rounded-xl mx-auto">
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-[#63736F] tracking-wider block">
                Complaint Tracking ID
              </span>
              <span className="text-xl sm:text-2xl font-mono font-extrabold text-[#19364A]">
                {submittedReport.trackingCode}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#DDE5DF] hover:border-[#24796C] text-xs font-semibold text-[#19364A] transition shadow-xs cursor-pointer"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#24796C]" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#63736F]" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex flex-wrap justify-center gap-3 pt-3">
            <NextLink
              href={`/track/${submittedReport.trackingCode}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#24796C] hover:bg-[#19364A] text-white font-semibold text-sm transition shadow-sm"
            >
              <span>Track My Complaint</span>
              <ArrowRight className="w-4 h-4" />
            </NextLink>

            {submittedReport.sharePublicly && (
              <NextLink
                href="/issues"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-[#DDE5DF] hover:border-[#24796C] text-[#19364A] font-semibold text-sm transition shadow-xs"
              >
                <span>View in Neighbourhood Pulse</span>
              </NextLink>
            )}

            <button
              type="button"
              onClick={() => {
                setSubmittedReport(null);
                setTitle('');
                setDescription('');
                setImageFile(null);
                setImagePreview(null);
                setImageBase64(null);
              }}
              className="px-5 py-3 rounded-xl text-xs font-semibold text-[#63736F] hover:text-[#19364A] transition"
            >
              File Another Report
            </button>
          </div>
        </div>

        {/* AI Triage Details & Evidence-Based Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AiAssessmentCard
            summary={submittedReport.aiSummary}
            reason={submittedReport.aiReason}
            suggestedCategory={submittedReport.finalCategory}
            suggestedDepartment={submittedReport.finalDepartment}
            priorityLevel={submittedReport.finalPriority}
            priorityScore={submittedReport.aiPriorityScore}
            confidence={submittedReport.aiConfidence}
            imageObservations={submittedReport.imageObservations}
            recommendedAction={submittedReport.recommendedAction}
            triageMethod={submittedReport.triageMethod}
            detectedLanguage={submittedReport.detectedLanguage}
          />

          <PriorityScoreCard
            score={submittedReport.aiPriorityScore}
            priorityLevel={submittedReport.finalPriority}
            breakdown={submittedReport.scoreBreakdown}
            justification={submittedReport.aiReason}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      {/* Page Title */}
      <div className="space-y-2 text-left">
        <span className="text-xs font-semibold text-[#24796C] uppercase tracking-wider">
          Direct Civic Filing
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#19364A] tracking-tight">
          Report a Neighbourhood Issue
        </h1>
        <p className="text-xs sm:text-sm text-[#63736F] leading-relaxed">
          Provide the details of the problem. Google Gemini AI will assess the severity,
          route to the proper municipal department, and assign a verifiable tracking ID.
        </p>
      </div>

      {submissionError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{submissionError}</span>
        </div>
      )}

      {/* Main Reporting Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#DDE5DF] p-6 sm:p-8 shadow-sm space-y-6">
        {/* 1. Title */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#19364A] uppercase tracking-wider">
            1. Issue Title <span className="text-[#C85C55]">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Large pothole near the main road junction"
            className="w-full text-sm px-4 py-3 rounded-xl border border-[#DDE5DF] bg-white text-[#19364A] placeholder-[#63736F]/60 focus:outline-none focus:ring-2 focus:ring-[#24796C] transition"
          />
        </div>

        {/* 2. Description (Multilingual support note) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-[#19364A] uppercase tracking-wider">
              2. Describe the Problem <span className="text-[#C85C55]">*</span>
            </label>
            <span className="text-[11px] text-[#24796C] font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>English / தமிழ் / Tanglish Accepted</span>
            </span>
          </div>

          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what is broken, hazardous, or overflowing. (You may write in English, Tamil, or Tanglish like 'Road romba damaged ah iruku, street light velicham illa')."
            className="w-full text-sm px-4 py-3 rounded-xl border border-[#DDE5DF] bg-white text-[#19364A] placeholder-[#63736F]/60 focus:outline-none focus:ring-2 focus:ring-[#24796C] transition leading-relaxed"
          />
          <p className="text-[11px] text-[#63736F]">
            Gemini will interpret your description, generate a standardized municipal summary, and preserve your original statement verbatim.
          </p>
        </div>

        {/* 3. Category Dropdown */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#19364A] uppercase tracking-wider">
            3. Issue Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CivicCategory)}
            className="w-full text-sm px-4 py-3 rounded-xl border border-[#DDE5DF] bg-white text-[#19364A] focus:outline-none focus:ring-2 focus:ring-[#24796C] transition"
          >
            {CIVIC_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat} {cat === 'Other / Not Sure' && '— (Let Gemini AI Recommend)'}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-[#63736F]">
            Select "Other / Not Sure" if you are uncertain—our AI will classify it accurately.
          </p>
        </div>

        {/* 4. Upload Photograph */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-[#19364A] uppercase tracking-wider">
              4. Upload Photograph (Supporting Evidence)
            </label>
            <span className="text-[11px] text-[#63736F]">
              Optional — Text-only reports welcome
            </span>
          </div>

          {imageError && (
            <div className="text-xs text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{imageError}</span>
            </div>
          )}

          {authLoading ? (
            <div className="p-6 rounded-xl border border-[#DDE5DF] bg-[#F7F8F4] flex items-center justify-center gap-3 text-xs text-[#63736F]">
              <div className="w-4 h-4 border-2 border-[#24796C] border-t-transparent rounded-full animate-spin" />
              <span>Checking citizen authentication status...</span>
            </div>
          ) : !user ? (
            <div className="rounded-xl border border-[#DDE5DF] bg-[#F7F8F4] p-5 sm:p-6 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-[#19364A] text-sm">
                    Citizen Sign-In Recommended for Photographic Evidence
                  </h4>
                  <p className="text-[#63736F] leading-relaxed">
                    To maintain municipal integrity and prevent abusive submissions, photographic evidence is stored securely in Cloudinary and tied to a verified citizen identity.
                  </p>
                  <p className="text-[#63736F] leading-relaxed">
                    You can still submit this grievance <strong>without a photograph</strong>, or quickly sign in below:
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  disabled={isDemoSigningIn}
                  onClick={handleQuickCitizenDemo}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#24796C] hover:bg-[#19364A] text-white font-semibold text-xs transition shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {isDemoSigningIn ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating with Firebase...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>One-Click Citizen Sign In (Priya Raman)</span>
                    </>
                  )}
                </button>

                <NextLink
                  href="/login"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#DDE5DF] bg-white hover:bg-slate-50 text-[#19364A] font-semibold text-xs transition shadow-2xs"
                >
                  <span>Sign In with Password</span>
                </NextLink>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs px-3.5 py-2 rounded-xl bg-[#E7F0EA]/80 border border-[#24796C]/30 text-[#19364A]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#24796C]" />
                  <span>
                    Authenticated Citizen: <strong>{user.displayName}</strong>{' '}
                    <span className="text-[#63736F]">({user.email})</span>
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold text-[#24796C] bg-white px-2 py-0.5 rounded-md border border-[#24796C]/30">
                  Verified
                </span>
              </div>

              {imagePreview ? (
                <div className="relative rounded-xl overflow-hidden border border-[#DDE5DF] bg-slate-50 max-h-72 flex items-center justify-center">
                  <img
                    src={imagePreview}
                    alt="Complaint Evidence Preview"
                    className="max-h-72 w-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => handleImageChange(null)}
                    className="absolute top-3 right-3 bg-[#19364A]/80 hover:bg-[#C85C55] text-white p-1.5 rounded-full transition shadow-md cursor-pointer"
                    title="Remove photograph"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-[#DDE5DF] hover:border-[#24796C] rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition bg-[#F7F8F4] group">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleImageChange(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="w-12 h-12 rounded-full bg-[#E7F0EA] flex items-center justify-center text-[#24796C] group-hover:scale-110 transition-transform mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-[#19364A]">
                    Click or drag & drop to upload a photo
                  </span>
                  <span className="text-[11px] text-[#63736F] mt-1">
                    JPEG, PNG, or WebP up to 5 MB (Cloudinary secure storage)
                  </span>
                </label>
              )}
            </div>
          )}
        </div>

        {/* 5. Location */}
        <div className="space-y-2 border-t border-[#DDE5DF] pt-6">
          <label className="block text-xs font-bold text-[#19364A] uppercase tracking-wider">
            5. Incident Location
          </label>
          <LocationPicker
            locality={locality}
            streetOrLandmark={streetOrLandmark}
            latitude={latitude}
            longitude={longitude}
            onLocalityChange={setLocality}
            onStreetChange={setStreetOrLandmark}
            onCoordinatesChange={({ lat, lng }) => {
              setLatitude(lat);
              setLongitude(lng);
            }}
          />
        </div>

        {/* 6. Privacy & Community Sharing */}
        <div className="border-t border-[#DDE5DF] pt-6 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={sharePublicly}
              onChange={(e) => setSharePublicly(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-[#24796C] focus:ring-[#24796C]"
            />
            <div className="text-xs space-y-1">
              <span className="font-semibold text-[#19364A] block">
                Share a privacy-safe summary in Neighbourhood Pulse
              </span>
              <p className="text-[#63736F] leading-relaxed">
                Allows nearby residents to view this civic issue and support it.
                Your email, phone, and private personal identity are <strong>never</strong> displayed publicly.
              </p>
            </div>
          </label>
        </div>

        {/* Submit Action */}
        <div className="pt-4 border-t border-[#DDE5DF]">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-xl bg-[#24796C] hover:bg-[#19364A] text-white font-bold text-sm sm:text-base transition-all shadow-md disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Sparkles className="w-5 h-5 animate-spin" />
                <span>Analyzing with Gemini AI & Submitting...</span>
              </>
            ) : (
              <>
                <span>Submit Complaint</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ReportIssuePage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-3 border-[#24796C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#63736F] mt-2">Loading reporting form...</p>
        </div>
      }
    >
      <ReportIssueContent />
    </Suspense>
  );
}
