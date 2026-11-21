import React from 'react';
import { CivicCategory, CivicDepartment, PriorityLevel } from '@/types';
import { Sparkles, Bot, AlertTriangle, CheckCircle2, Eye, Building2, Tag } from 'lucide-react';
import { PriorityBadge } from './PriorityBadge';

interface AiAssessmentCardProps {
  summary: string;
  reason: string;
  suggestedCategory: CivicCategory;
  suggestedDepartment: CivicDepartment;
  priorityLevel: PriorityLevel;
  priorityScore: number;
  confidence: number;
  imageObservations?: string[];
  recommendedAction?: string;
  triageMethod?: 'gemini' | 'fallback';
  tags?: string[];
  detectedLanguage?: string;
}

export const AiAssessmentCard: React.FC<AiAssessmentCardProps> = ({
  summary,
  reason,
  suggestedCategory,
  suggestedDepartment,
  priorityLevel,
  priorityScore,
  confidence,
  imageObservations = [],
  recommendedAction,
  triageMethod = 'gemini',
  tags = [],
  detectedLanguage,
}) => {
  const isFallback = triageMethod === 'fallback';

  return (
    <div className="bg-white rounded-xl border border-[#DDE5DF] p-5 shadow-sm space-y-4">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DDE5DF] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#E7F0EA] flex items-center justify-center text-[#24796C]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#19364A] flex items-center gap-2">
              AI Triage Assessment
              <span className="text-[11px] font-normal text-[#63736F] bg-[#F7F8F4] px-2 py-0.5 rounded border border-[#DDE5DF]">
                Advisory Support
              </span>
            </h3>
            <p className="text-xs text-[#63736F]">
              Powered by Google Gemini AI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isFallback ? (
            <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-md flex items-center gap-1 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              Fallback Mode
            </span>
          ) : (
            <span className="text-xs bg-[#E7F0EA] text-[#24796C] border border-[#24796C]/20 px-2.5 py-1 rounded-md flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Confidence: {Math.round(confidence * 100)}%
            </span>
          )}
        </div>
      </div>

      {/* Summary Box */}
      <div className="bg-[#F7F8F4] p-3.5 rounded-lg border border-[#DDE5DF] space-y-1.5">
        <div className="flex items-center justify-between text-xs text-[#63736F]">
          <span className="font-semibold text-[#19364A]">Executive Assessment</span>
          {detectedLanguage && <span>Language: {detectedLanguage}</span>}
        </div>
        <p className="text-sm text-[#19364A] font-medium leading-relaxed">
          {summary}
        </p>
      </div>

      {/* Suggested Taxonomy */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="border border-[#DDE5DF] rounded-lg p-3 bg-white">
          <span className="text-[11px] font-semibold text-[#63736F] uppercase tracking-wider block mb-1">
            Suggested Category
          </span>
          <div className="flex items-center gap-2 text-sm font-semibold text-[#19364A]">
            <Tag className="w-4 h-4 text-[#24796C]" />
            <span>{suggestedCategory}</span>
          </div>
        </div>

        <div className="border border-[#DDE5DF] rounded-lg p-3 bg-white">
          <span className="text-[11px] font-semibold text-[#63736F] uppercase tracking-wider block mb-1">
            Responsible Department
          </span>
          <div className="flex items-center gap-2 text-sm font-semibold text-[#19364A]">
            <Building2 className="w-4 h-4 text-[#24796C]" />
            <span>{suggestedDepartment}</span>
          </div>
        </div>
      </div>

      {/* Justification */}
      <div className="space-y-1">
        <span className="text-xs font-semibold text-[#19364A]">Triage Rationale</span>
        <p className="text-xs text-[#63736F] leading-relaxed">{reason}</p>
      </div>

      {/* Recommended Action */}
      {recommendedAction && (
        <div className="border-l-2 border-[#24796C] pl-3 py-0.5 space-y-0.5">
          <span className="text-xs font-semibold text-[#19364A]">Action Recommendation</span>
          <p className="text-xs text-[#63736F]">{recommendedAction}</p>
        </div>
      )}

      {/* Image Observations */}
      {imageObservations.length > 0 && (
        <div className="space-y-1.5 border-t border-[#DDE5DF] pt-3">
          <span className="text-xs font-semibold text-[#19364A] flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-[#24796C]" />
            Visible Photographic Evidence
          </span>
          <ul className="text-xs text-[#63736F] list-disc list-inside space-y-1">
            {imageObservations.map((obs, idx) => (
              <li key={idx}>{obs}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Mandatory Civic Platform Disclaimer */}
      <div className="text-[11px] text-[#63736F] bg-slate-50 border border-slate-200 rounded p-2.5">
        <strong>Important:</strong> Gemini provides decision support for municipal administrators.
        All department routing, priority grading, and remediation schedules are approved by human
        civic officials.
      </div>
    </div>
  );
};
