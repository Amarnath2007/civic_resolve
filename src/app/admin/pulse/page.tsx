'use client';

import React, { useEffect, useState } from 'react';
import NextLink from 'next/link';
import { Report } from '@/types';
import { findNearbyRelatedReports } from '@/lib/geo';
import { Layers, MapPin, Sparkles, ArrowRight, Eye, RefreshCw } from 'lucide-react';

export default function AdminPulseClustersPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports', { credentials: 'omit' });
      if (res.ok) {
        const d = await res.json();
        setReports(d.reports || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const clusters = reports
    .filter((r) => r.status !== 'Resolved')
    .map((r) => {
      const nearby = findNearbyRelatedReports(
        {
          id: r.id,
          category: r.finalCategory,
          latitude: r.location?.latitude,
          longitude: r.location?.longitude,
        },
        reports,
        150
      );
      return { report: r, nearby };
    })
    .filter((item) => item.nearby.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DDE5DF] pb-4">
        <div>
          <span className="text-xs font-semibold text-[#24796C] uppercase tracking-wider block">
            Spatial Intelligence
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#19364A]">
            Neighbourhood Proximity Clusters (150m Radius)
          </h1>
          <p className="text-xs text-[#63736F] mt-1">
            Algorithmic detection of concurrent unresolved grievances within a 150-metre radius sharing the same civic category.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchReports}
          className="p-2 text-[#63736F] hover:text-[#19364A] bg-white border border-[#DDE5DF] rounded-xl transition shadow-2xs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-[#E7F0EA]/70 p-5 rounded-2xl border border-[#24796C]/20 space-y-2 text-xs">
        <h3 className="font-bold text-[#19364A] flex items-center gap-1.5 text-sm">
          <Sparkles className="w-4 h-4 text-[#24796C]" />
          <span>Operational Benefit of Cluster Detection:</span>
        </h3>
        <p className="text-[#63736F] leading-relaxed">
          Rather than dispatching multiple independent inspection units to the same street block, municipal coordinators can group related complaints into a unified work order for field engineers, saving fuel, labor, and municipal budget.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 py-16 text-center text-xs text-[#63736F]">
            Scanning spatial coordinates for recurring complaint clusters...
          </div>
        ) : clusters.length === 0 ? (
          <div className="col-span-2 py-16 text-center text-xs text-[#63736F] bg-white rounded-2xl border border-[#DDE5DF]">
            No concurrent proximity clusters detected within 150 metres in the current unresolved complaints queue.
          </div>
        ) : (
          clusters.map(({ report: r, nearby }) => (
            <div
              key={r.id}
              className="bg-white rounded-2xl border-2 border-amber-300 p-6 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                  Recurring Cluster Detected
                </span>
                <span className="text-[#63736F] font-semibold">
                  {nearby.length} Related Issue(s) within 150m
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#19364A]">{r.title}</h3>
                <p className="text-xs text-[#63736F] mt-1">
                  <strong>Anchor Location:</strong> {r.location?.locality} ({r.finalCategory})
                </p>
              </div>

              <div className="bg-[#F7F8F4] p-3.5 rounded-xl border border-[#DDE5DF] space-y-2">
                <span className="text-[11px] font-bold text-[#19364A] uppercase tracking-wider block">
                  Nearby Related Complaints:
                </span>
                <ul className="text-xs space-y-2">
                  {nearby.map((m, idx) => (
                    <li
                      key={idx}
                      className="flex justify-between items-center text-[#63736F] border-b border-[#DDE5DF]/60 pb-1.5 last:border-0 last:pb-0"
                    >
                      <div className="truncate pr-2">
                        <span className="font-mono font-bold text-[#19364A] mr-2">
                          {m.report.trackingCode}
                        </span>
                        <span className="text-[#63736F]">{m.report.title}</span>
                      </div>
                      <span className="font-mono font-bold text-[#24796C] shrink-0 text-xs">
                        ~{m.distanceMetres}m away
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <NextLink
                href={`/admin/complaints/${r.id}`}
                className="w-full py-2.5 bg-[#19364A] hover:bg-[#24796C] text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Inspect Cluster Anchor Dossier</span>
              </NextLink>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
