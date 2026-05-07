"use client";

import { useMemo } from "react";
import type { Lead } from "@/lib/types";
import { MapPin } from "lucide-react";

/**
 * LeadsMap — a simplified SVG-based scatter plot of lead coordinates.
 *
 * TODO: Replace this placeholder with a real map provider, e.g.:
 *   - Mapbox GL JS (@mapbox/mapbox-gl-react)
 *   - Leaflet (react-leaflet)
 *   - Google Maps API (@vis.gl/react-google-maps)
 *
 * The component API (leads, selectedLeadId, onSelectLead) is production-ready
 * and won't need to change when swapping in the real map.
 */

interface LeadsMapProps {
  leads: Lead[];
  selectedLeadId?: string;
  onSelectLead?: (id: string) => void;
}

export function LeadsMap({ leads, selectedLeadId, onSelectLead }: LeadsMapProps) {
  const leadsWithCoords = leads.filter(
    (l) => l.lat != null && l.lng != null
  );

  const { minLat, maxLat, minLng, maxLng } = useMemo(() => {
    if (leadsWithCoords.length === 0) {
      return { minLat: 33, maxLat: 35, minLng: -119, maxLng: -117 };
    }
    return {
      minLat: Math.min(...leadsWithCoords.map((l) => l.lat!)) - 0.05,
      maxLat: Math.max(...leadsWithCoords.map((l) => l.lat!)) + 0.05,
      minLng: Math.min(...leadsWithCoords.map((l) => l.lng!)) - 0.05,
      maxLng: Math.max(...leadsWithCoords.map((l) => l.lng!)) + 0.05,
    };
  }, [leadsWithCoords]);

  const W = 600;
  const H = 300;

  function project(lat: number, lng: number): [number, number] {
    const x = ((lng - minLng) / (maxLng - minLng)) * W;
    const y = H - ((lat - minLat) / (maxLat - minLat)) * H;
    return [x, y];
  }

  if (leadsWithCoords.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
        <MapPin className="h-8 w-8 opacity-30" />
        <p className="text-sm">No leads with coordinates to display.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Lead Map</span>
        <span className="text-xs text-muted-foreground bg-muted rounded px-2 py-0.5">
          Placeholder — replace with Mapbox / Leaflet
        </span>
      </div>
      <div className="relative bg-[oklch(0.14_0.006_260)]">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          className="block"
          aria-label="Lead location map"
          role="img"
        >
          {/* Grid lines */}
          {Array.from({ length: 6 }).map((_, i) => (
            <line
              key={`h-${i}`}
              x1={0}
              y1={(i / 5) * H}
              x2={W}
              y2={(i / 5) * H}
              stroke="oklch(0.24 0.008 260)"
              strokeWidth={0.5}
            />
          ))}
          {Array.from({ length: 11 }).map((_, i) => (
            <line
              key={`v-${i}`}
              x1={(i / 10) * W}
              y1={0}
              x2={(i / 10) * W}
              y2={H}
              stroke="oklch(0.24 0.008 260)"
              strokeWidth={0.5}
            />
          ))}

          {/* Lead dots */}
          {leadsWithCoords.map((lead) => {
            const [x, y] = project(lead.lat!, lead.lng!);
            const isSelected = selectedLeadId === lead.id;
            const isIcp = lead.icpMatch;
            return (
              <g
                key={lead.id}
                onClick={() => onSelectLead?.(lead.id)}
                style={{ cursor: "pointer" }}
              >
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 8 : 5}
                  fill={
                    isSelected
                      ? "oklch(0.76 0.15 55)"
                      : isIcp
                      ? "oklch(0.62 0.16 145)"
                      : "oklch(0.40 0.01 260)"
                  }
                  stroke={
                    isSelected ? "oklch(0.93 0.005 260)" : "transparent"
                  }
                  strokeWidth={1.5}
                  opacity={isSelected ? 1 : 0.85}
                />
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-2 right-3 flex items-center gap-3 text-xs text-muted-foreground bg-card/80 backdrop-blur rounded px-2 py-1.5 border border-border">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[oklch(0.62_0.16_145)]" />
            ICP match
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[oklch(0.40_0.01_260)]" />
            Other
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[oklch(0.76_0.15_55)]" />
            Selected
          </span>
        </div>
      </div>
    </div>
  );
}
