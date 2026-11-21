import React from 'react';
import { ComplaintStatus, ComplaintUpdate } from '@/types';
import { CheckCircle2, Clock, Wrench, FileCheck } from 'lucide-react';

interface TimelineViewProps {
  currentStatus: ComplaintStatus;
  updates: ComplaintUpdate[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({ currentStatus, updates }) => {
  const steps: Array<{
    status: ComplaintStatus;
    title: string;
    description: string;
    icon: React.ReactNode;
  }> = [
    {
      status: 'Reported',
      title: '01 – Report Submitted',
      description: 'Complaint received and queued for review.',
      icon: <FileCheck className="w-4 h-4" />,
    },
    {
      status: 'Under Review',
      title: '02 – Under Administrative Review',
      description: 'Officer verifying details and routing to field unit.',
      icon: <Clock className="w-4 h-4" />,
    },
    {
      status: 'In Progress',
      title: '03 – Remediation In Progress',
      description: 'Field crew assigned and working on site.',
      icon: <Wrench className="w-4 h-4" />,
    },
    {
      status: 'Resolved',
      title: '04 – Resolved & Closed',
      description: 'Work verified and completed.',
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
  ];

  const getStepState = (stepStatus: ComplaintStatus) => {
    const order: ComplaintStatus[] = ['Reported', 'Under Review', 'In Progress', 'Resolved'];
    const currentIndex = order.indexOf(currentStatus);
    const stepIndex = order.indexOf(stepStatus);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="bg-white rounded-xl border border-[#DDE5DF] p-6 shadow-sm space-y-6">
      <h3 className="text-sm font-bold text-[#19364A] uppercase tracking-wider">
        Resolution Progress Timeline
      </h3>

      {/* Progress Stepper */}
      <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#DDE5DF]">
        {steps.map((step, idx) => {
          const state = getStepState(step.status);

          // Find relevant update note if any
          const matchingUpdates = updates.filter((u) => u.status === step.status);
          const latestNote = matchingUpdates.length > 0 ? matchingUpdates[matchingUpdates.length - 1] : null;

          return (
            <div key={idx} className="relative group">
              {/* Dot Icon */}
              <div
                className={`absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-white transition-all ${
                  state === 'completed'
                    ? 'bg-[#24796C]'
                    : state === 'current'
                    ? 'bg-[#19364A] ring-4 ring-[#E7F0EA]'
                    : 'bg-[#DDE5DF] text-[#63736F]'
                }`}
              >
                {step.icon}
              </div>

              {/* Step Info */}
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4
                    className={`text-sm font-semibold ${
                      state === 'upcoming' ? 'text-[#63736F]' : 'text-[#19364A]'
                    }`}
                  >
                    {step.title}
                  </h4>

                  {latestNote && (
                    <span className="text-xs text-[#63736F]">
                      {new Date(latestNote.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#63736F]">{step.description}</p>

                {/* Public update notes */}
                {matchingUpdates.map((upd, uIdx) => (
                  <div
                    key={uIdx}
                    className="mt-2 text-xs bg-[#F7F8F4] p-3 rounded-lg border border-[#DDE5DF] text-[#19364A] space-y-1"
                  >
                    <div className="flex justify-between items-center text-[11px] text-[#63736F]">
                      <span className="font-semibold text-[#24796C]">
                        {upd.createdByRole === 'admin' ? 'Official Municipal Note' : 'System Update'}
                      </span>
                      <span>{new Date(upd.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="leading-relaxed">{upd.note}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
