'use client';

import React, { useState } from 'react';
import { MapPin, Navigation, Compass, AlertCircle, Check } from 'lucide-react';

interface LocationPickerProps {
  locality: string;
  streetOrLandmark: string;
  latitude?: number;
  longitude?: number;
  onLocalityChange: (val: string) => void;
  onStreetChange: (val: string) => void;
  onCoordinatesChange: (coords: { lat: number; lng: number }) => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  locality,
  streetOrLandmark,
  latitude,
  longitude,
  onLocalityChange,
  onStreetChange,
  onCoordinatesChange,
}) => {
  const [geoState, setGeoState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [geoError, setGeoError] = useState<string | null>(null);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      setGeoState('error');
      return;
    }

    setGeoState('loading');
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        onCoordinatesChange({ lat, lng });
        setGeoState('success');

        // If locality was empty, provide a clean default
        if (!locality) {
          onLocalityChange('Local Area');
        }
      },
      (err) => {
        console.warn('Geolocation permission denied or timed out:', err);
        setGeoState('error');
        setGeoError(
          err.code === 1
            ? 'Location permission was denied. You can enter the street and area manually below.'
            : 'Could not retrieve precise location. Please enter area name manually.'
        );
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const hasCoords = typeof latitude === 'number' && typeof longitude === 'number';

  return (
    <div className="space-y-4">
      {/* Geolocation trigger */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#E7F0EA]/70 p-3 rounded-lg border border-[#DDE5DF]">
        <div className="flex items-center gap-2 text-xs text-[#19364A]">
          <MapPin className="w-4 h-4 text-[#24796C] shrink-0" />
          <span>Need exact coordinates? Use your device GPS or enter address manually.</span>
        </div>

        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={geoState === 'loading'}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#24796C] hover:bg-[#19364A] rounded-md transition-colors shadow-sm disabled:opacity-60 cursor-pointer"
        >
          {geoState === 'loading' ? (
            <>
              <Compass className="w-3.5 h-3.5 animate-spin" />
              <span>Locating...</span>
            </>
          ) : geoState === 'success' ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Location Captured</span>
            </>
          ) : (
            <>
              <Navigation className="w-3.5 h-3.5" />
              <span>Use My Current Location</span>
            </>
          )}
        </button>
      </div>

      {geoError && (
        <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 p-2.5 rounded border border-amber-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{geoError}</span>
        </div>
      )}

      {/* Manual Input Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[#19364A] mb-1">
            Locality / Area <span className="text-[#C85C55]">*</span>
          </label>
          <input
            type="text"
            required
            value={locality}
            onChange={(e) => onLocalityChange(e.target.value)}
            placeholder="e.g. Gandhipuram, RS Puram, Peelamedu"
            className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-[#DDE5DF] bg-white text-[#19364A] placeholder-[#63736F]/60 focus:outline-none focus:ring-2 focus:ring-[#24796C] focus:border-transparent transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#19364A] mb-1">
            Street or Nearby Landmark
          </label>
          <input
            type="text"
            value={streetOrLandmark}
            onChange={(e) => onStreetChange(e.target.value)}
            placeholder="e.g. Near GP Signal, opposite bus stop"
            className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-[#DDE5DF] bg-white text-[#19364A] placeholder-[#63736F]/60 focus:outline-none focus:ring-2 focus:ring-[#24796C] focus:border-transparent transition"
          />
        </div>
      </div>

      {/* Coordinate & OpenStreetMap preview */}
      {hasCoords && (
        <div className="border border-[#DDE5DF] rounded-lg overflow-hidden bg-white text-xs">
          <div className="bg-[#F7F8F4] px-3 py-2 border-b border-[#DDE5DF] flex items-center justify-between text-[#63736F]">
            <span className="font-semibold text-[#19364A]">GPS Coordinates Verified</span>
            <span className="font-mono">
              {latitude?.toFixed(4)}° N, {longitude?.toFixed(4)}° E
            </span>
          </div>

          <div className="relative h-32 bg-slate-100 flex items-center justify-center text-[#63736F] p-4 text-center">
            {/* OpenStreetMap iframe or static representation */}
            <iframe
              title="OpenStreetMap Location"
              width="100%"
              height="100%"
              className="border-0 pointer-events-none opacity-80"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${longitude! - 0.005}%2C${latitude! - 0.005}%2C${longitude! + 0.005}%2C${latitude! + 0.005}&layer=mapnik&marker=${latitude}%2C${longitude}`}
            />
            <div className="absolute bottom-1 right-2 text-[10px] bg-white/90 px-1 rounded text-[#63736F]">
              © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline">OpenStreetMap</a> contributors
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
