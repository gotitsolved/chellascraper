"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Loader2, MapPin } from "lucide-react";
import type { JobQuery } from "@/lib/types";

interface JobCreateFormProps {
  onSubmit?: (payload: { name: string; query: JobQuery }) => Promise<void> | void;
}

const BEAUTY_BUSINESS_TYPES: { category: string; types: string[] }[] = [
  {
    category: "Brows & Lashes",
    types: ["brow bar", "lash studio", "lash extensions", "brow lamination", "microblading studio", "brow threading"],
  },
  {
    category: "Hair",
    types: ["hair salon", "hair cutting", "barber shop", "blowout bar", "hair extensions", "keratin treatment", "color salon", "natural hair salon"],
  },
  {
    category: "Nails",
    types: ["nail salon", "nail bar", "gel nails", "acrylic nails", "nail art studio"],
  },
  {
    category: "Skin Care",
    types: ["skin care studio", "facial spa", "medical spa", "acne clinic", "dermaplaning", "microneedling", "chemical peel", "esthetician"],
  },
  {
    category: "Body & Waxing",
    types: ["waxing studio", "sugaring studio", "body waxing", "brazilian wax", "threading studio"],
  },
  {
    category: "Wellness & Spa",
    types: ["day spa", "massage spa", "wellness center", "holistic spa", "float spa", "lymphatic drainage"],
  },
  {
    category: "Makeup",
    types: ["makeup studio", "makeup artist", "bridal makeup", "permanent makeup", "airbrush studio"],
  },
  {
    category: "Tanning & Body",
    types: ["spray tan studio", "tanning salon", "body contouring", "cryotherapy", "infrared sauna"],
  },
];


export function JobCreateForm({ onSubmit }: JobCreateFormProps) {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [radiusKm, setRadiusKm] = useState(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Flatten all beauty business types
  const allBusinessTypes = BEAUTY_BUSINESS_TYPES.flatMap((g) => g.types);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!location.trim()) return setError("Location is required.");

    // Auto-generate job name from location and timestamp
    const name = `${location.trim()} — ${new Date().toLocaleDateString("en-US", { year: "2-digit", month: "short" })}`;

    const payload = {
      name,
      query: {
        businessTypes: allBusinessTypes,
        locationText: location.trim(),
        radiusKm,
        filters: {},
      },
    };

    setLoading(true);
    try {
      if (onSubmit) {
        await onSubmit(payload);
      } else {
        // Create the job
        const res = await fetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to create job.");
        const job = await res.json();

        // Immediately start running the job
        await fetch(`/api/jobs/${job.id}/run`, { method: "POST" });

        router.push(`/jobs/${job.id}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Location */}
      <div className="space-y-1.5">
        <Label htmlFor="location" className="text-sm text-foreground/80">
          Location
        </Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="location"
            placeholder="e.g. Los Angeles, CA"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="pl-9 bg-muted border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Radius */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm text-foreground/80">Search Radius</Label>
          <span className="text-sm font-mono text-primary">{radiusKm} km</span>
        </div>
        <Slider
          min={1}
          max={100}
          step={1}
          value={[radiusKm]}
          onValueChange={([v]) => setRadiusKm(v)}
          className="w-full"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive-foreground bg-destructive/20 border border-destructive/30 rounded px-3 py-2">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating job...
          </>
        ) : (
          "Run Search"
        )}
      </Button>
    </form>
  );
}
