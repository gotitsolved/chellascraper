"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Loader2, MapPin } from "lucide-react";
import type { JobQuery } from "@/lib/types";

interface JobCreateFormProps {
  onSubmit?: (payload: { name: string; query: JobQuery }) => Promise<void> | void;
}

const SUGGESTED_BUSINESS_TYPES = [
  "brow bar",
  "lash studio",
  "beauty salon",
  "waxing studio",
  "threading studio",
  "day spa",
  "nail salon",
];

export function JobCreateForm({ onSubmit }: JobCreateFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [radiusKm, setRadiusKm] = useState(25);
  const [businessTypes, setBusinessTypes] = useState<string[]>(["brow bar"]);
  const [typeInput, setTypeInput] = useState("");
  const [hasWebsite, setHasWebsite] = useState(false);
  const [minRating, setMinRating] = useState(3.5);
  const [excludeChains, setExcludeChains] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addType(type: string) {
    const trimmed = type.trim().toLowerCase();
    if (trimmed && !businessTypes.includes(trimmed)) {
      setBusinessTypes((prev) => [...prev, trimmed]);
    }
    setTypeInput("");
  }

  function removeType(type: string) {
    setBusinessTypes((prev) => prev.filter((t) => t !== type));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Job name is required.");
    if (!location.trim()) return setError("Location is required.");
    if (businessTypes.length === 0) return setError("Add at least one business type.");

    const payload = {
      name: name.trim(),
      query: {
        businessTypes,
        locationText: location.trim(),
        radiusKm,
        filters: {
          hasWebsite: hasWebsite || undefined,
          minRating,
          excludeChains: excludeChains || undefined,
        },
      },
    };

    setLoading(true);
    try {
      if (onSubmit) {
        await onSubmit(payload);
      } else {
        const res = await fetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to create job.");
        const job = await res.json();
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
      {/* Job name */}
      <div className="space-y-1.5">
        <Label htmlFor="job-name" className="text-sm text-foreground/80">
          Job Name
        </Label>
        <Input
          id="job-name"
          placeholder="e.g. LA Brow Bars — Q2 2025"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>

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

      {/* Business types */}
      <div className="space-y-2">
        <Label className="text-sm text-foreground/80">Business Types</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {businessTypes.map((t) => (
            <Badge
              key={t}
              variant="secondary"
              className="gap-1.5 py-1 pl-2.5 pr-1.5 bg-muted text-foreground border border-border"
            >
              {t}
              <button
                type="button"
                onClick={() => removeType(t)}
                className="rounded-full hover:bg-border p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Add business type..."
            value={typeInput}
            onChange={(e) => setTypeInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addType(typeInput);
              }
            }}
            className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => addType(typeInput)}
            className="border-border shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {SUGGESTED_BUSINESS_TYPES.filter((s) => !businessTypes.includes(s)).map(
            (s) => (
              <button
                key={s}
                type="button"
                onClick={() => addType(s)}
                className="text-xs text-muted-foreground hover:text-primary border border-border rounded px-2 py-0.5 hover:border-primary transition-colors"
              >
                + {s}
              </button>
            )
          )}
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

      {/* Min rating */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm text-foreground/80">Minimum Rating</Label>
          <span className="text-sm font-mono text-primary">{minRating.toFixed(1)} ★</span>
        </div>
        <Slider
          min={0}
          max={5}
          step={0.5}
          value={[minRating]}
          onValueChange={([v]) => setMinRating(v)}
          className="w-full"
        />
      </div>

      {/* Toggles */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <Label className="text-sm text-foreground/80">Must have website</Label>
          <Switch checked={hasWebsite} onCheckedChange={setHasWebsite} />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-sm text-foreground/80">Exclude chains</Label>
          <Switch checked={excludeChains} onCheckedChange={setExcludeChains} />
        </div>
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
