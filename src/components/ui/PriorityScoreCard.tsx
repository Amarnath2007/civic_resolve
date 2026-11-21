import React from 'react';
import { ScoreBreakdown, PriorityLevel } from '@/types';
import { PriorityBadge } from './PriorityBadge';
import { ShieldCheck, Info } from 'lucide-react';

interface PriorityScoreCardProps {
  score: number;
  priorityLevel: PriorityLevel;
  breakdown: ScoreBreakdown;
  justification?: string;
  showFormula?: boolean;
}

export const PriorityScoreCard: React.FC<PriorityScoreCardProps> = ({
  score,
  priorityLevel,
  breakdown,
  justification,
  showFormula = true,
}) => {
  const factors = [
    {
      name: 'Problem Severity',
      weight: '30%',
      val: breakdown.severity,
      desc: 'Physical hazard and infrastructural breakdown scale',
    },
    {
      name: 'Public Impact',
      weight: '25%',
      val: breakdown.publicImpact,
      desc: 'Commuter volume and affected daily footfall',
    },
    {
      name: 'Accessibility Risk',
      weight: '20%',
      val: breakdown.accessibilityRisk,
      desc: 'Disruption to sidewalks, ramps, mobility access',
    },
    {
      name: 'Vulnerable Locations',
      weight: '15%',
      val: breakdown.vulnerableLocationImpact,
      desc: 'Proximity to schools, hospitals, transit, clinics',
    },
    {
      name: 'Issue Persistence',
      weight: '10%',
      val: breakdown.persistence,
      desc: 'Chronicity and recurrence duration',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-[#DDE5DF] p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DDE5DF] pb-3">
        <div>
          <span className="text-xs font-semibold tracking-wider text-[#63736F] uppercase">
            Evidence-Based Priority Assessment
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold text-[#19364A]">{score}</span>
            <span className="text-sm text-[#63736F]">/ 100</span>
            <PriorityBadge priority={priorityLevel} />
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[#24796C] bg-[#E7F0EA] px-2.5 py-1 rounded-md">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Formula-Validated</span>
        </div>
      </div>

      {justification && (
        <p className="text-sm text-[#19364A] leading-relaxed bg-[#F7F8F4] p-3 rounded-lg border border-[#DDE5DF]">
          {justification}
        </p>
      )}

      {/* 5-Factor Score Matrix */}
      <div className="space-y-3 pt-1">
        <div className="text-xs font-medium text-[#63736F] flex items-center justify-between">
          <span>Weighted Evaluation Matrix</span>
          <span>Score (0–10)</span>
        </div>

        {factors.map((f, i) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-[#19364A]">
                {f.name}{' '}
                <span className="text-[#63736F] font-normal">({f.weight})</span>
              </span>
              <span className="font-mono font-semibold text-[#19364A]">{f.val}/10</span>
            </div>
            <div className="w-full bg-[#E7F0EA] h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  f.val >= 8
                    ? 'bg-[#C85C55]'
                    : f.val >= 6
                    ? 'bg-[#D99A42]'
                    : 'bg-[#24796C]'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, f.val * 10))}%` }}
              />
            </div>
            <p className="text-[11px] text-[#63736F]">{f.desc}</p>
          </div>
        ))}
      </div>

      {showFormula && (
        <div className="text-[11px] text-[#63736F] border-t border-[#DDE5DF] pt-3 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#24796C]" />
          <span>
            Scoring: 0–24 Low | 25–49 Medium | 50–74 High | 75–100 Critical.
            Scores are computed algorithmically without arbitrary labels.
          </span>
        </div>
      )}
    </div>
  );
};
