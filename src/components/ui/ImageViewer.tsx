'use client';

import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  Image as ImageIcon,
  AlertTriangle,
  Download,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface ImageViewerProps {
  src?: string | null;
  alt?: string;
  observations?: string[];
  caption?: string;
  className?: string;
  isAuthorized?: boolean;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  src,
  alt = 'Civic complaint photographic evidence',
  observations = [],
  caption,
  className = '',
  isAuthorized = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  if (!src) {
    return (
      <div className={`rounded-xl border border-dashed border-[#DDE5DF] bg-[#F7F8F4] p-6 text-center space-y-2 ${className}`}>
        <div className="w-10 h-10 rounded-full bg-[#E7F0EA] text-[#24796C] mx-auto flex items-center justify-center">
          <ImageIcon className="w-5 h-5" />
        </div>
        <p className="text-xs font-semibold text-[#19364A]">No photographic evidence attached</p>
        <p className="text-[11px] text-[#63736F]">The citizen filed a text-only grievance without a photo.</p>
      </div>
    );
  }

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((prev) => Math.max(prev - 0.5, 1));
  };

  const handleResetZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(1);
  };

  return (
    <>
      {/* Thumbnail Card with interactive hover overlay */}
      <div className={`group relative rounded-xl overflow-hidden border border-[#DDE5DF] bg-slate-900 shadow-xs ${className}`}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#F7F8F4] z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-[#24796C] border-t-transparent rounded-full animate-spin" />
              <span className="text-[11px] text-[#63736F]">Loading authorized evidence...</span>
            </div>
          </div>
        )}

        {hasError ? (
          <div className="p-6 text-center space-y-2 bg-rose-50 border border-rose-200 text-rose-800">
            <AlertTriangle className="w-6 h-6 text-rose-600 mx-auto" />
            <p className="text-xs font-bold">Failed to load photograph evidence</p>
            <p className="text-[11px] text-rose-700">The temporary signed URL may have expired or is unavailable.</p>
          </div>
        ) : (
          <div
            className="cursor-pointer relative overflow-hidden flex items-center justify-center min-h-[200px] max-h-[340px] bg-slate-950"
            onClick={() => setIsOpen(true)}
          >
            <img
              src={src}
              alt={alt}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
              className="w-full h-auto max-h-[340px] object-contain transition-transform duration-300 group-hover:scale-[1.02]"
            />

            {/* Hover overlay hint */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-semibold pointer-events-none">
              <Maximize2 className="w-4 h-4" />
              <span>Click to enlarge & inspect</span>
            </div>

            {/* Authorized signed delivery badge */}
            {isAuthorized && (
              <div className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-1 rounded-md flex items-center gap-1 border border-white/20">
                <ShieldCheck className="w-3 h-3 text-[#24796C]" />
                <span>Cloudinary Signed Asset</span>
              </div>
            )}
          </div>
        )}

        {/* Observations snippet if provided */}
        {observations && observations.length > 0 && (
          <div className="p-3 bg-white border-t border-[#DDE5DF] text-xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#24796C]">
              AI Visual Observations:
            </span>
            <ul className="text-[11px] text-[#63736F] list-disc list-inside space-y-0.5">
              {observations.map((obs, idx) => (
                <li key={idx} className="line-clamp-1">{obs}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Full-Screen Lightbox Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => {
            setIsOpen(false);
            setZoomLevel(1);
          }}
        >
          {/* Top Bar */}
          <div
            className="flex items-center justify-between text-white max-w-6xl w-full mx-auto pb-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-0.5">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#24796C]" />
                <span>Photographic Evidence Inspection</span>
              </h3>
              <p className="text-xs text-white/70">
                {caption || alt}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center bg-white/10 rounded-lg p-1 border border-white/10">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 1}
                  className="p-1.5 hover:bg-white/20 rounded text-white disabled:opacity-40 transition"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono px-2 text-white">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 3}
                  className="p-1.5 hover:bg-white/20 rounded text-white disabled:opacity-40 transition"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              <a
                href={src}
                target="_blank"
                rel="noreferrer"
                className="p-2 hover:bg-white/20 rounded-lg text-white transition border border-white/10 flex items-center gap-1.5 text-xs font-semibold"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Original</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setZoomLevel(1);
                }}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition cursor-pointer"
                title="Close modal (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Enlarged Image Canvas */}
          <div
            className="flex-1 flex items-center justify-center overflow-auto p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="transition-transform duration-200 cursor-zoom-in"
              style={{ transform: `scale(${zoomLevel})` }}
              onClick={(e) => {
                if (zoomLevel === 1) handleZoomIn(e);
                else handleResetZoom(e);
              }}
            >
              <img
                src={src}
                alt={alt}
                className="max-h-[75vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
              />
            </div>
          </div>

          {/* Bottom Bar: AI Observations details */}
          {observations && observations.length > 0 && (
            <div
              className="max-w-4xl w-full mx-auto bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-white text-xs mt-3"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="font-bold text-[#24796C] brightness-125 block mb-1">
                AI Visual Verification Observations:
              </span>
              <div className="flex flex-wrap gap-2">
                {observations.map((obs, idx) => (
                  <span
                    key={idx}
                    className="bg-black/40 px-2.5 py-1 rounded-md text-[11px] text-white/90 border border-white/10"
                  >
                    • {obs}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
