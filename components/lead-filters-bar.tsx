"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SlidersHorizontal, X } from "lucide-react";

export interface LeadFilters {
  minScore: number;
  minRating: number;
  hasEmail: boolean;
  hasWebsite: boolean;
  icpMatch: boolean | undefined;
}

interface LeadFiltersBarProps {
  filters: LeadFilters;
  onChange: (filters: LeadFilters) => void;
  total: number;
  filtered: number;
}

function countActive(f: LeadFilters): number {
  let n = 0;
  if (f.minScore > 0) n++;
  if (f.minRating > 0) n++;
  if (f.hasEmail) n++;
  if (f.hasWebsite) n++;
  if (f.icpMatch !== undefined) n++;
  return n;
}

export function LeadFiltersBar({
  filters,
  onChange,
  total,
  filtered,
}: LeadFiltersBarProps) {
  const activeCount = countActive(filters);

  function reset() {
    onChange({
      minScore: 0,
      minRating: 0,
      hasEmail: false,
      hasWebsite: false,
      icpMatch: undefined,
    });
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-border text-foreground hover:bg-accent"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {activeCount > 0 && (
              <Badge
                variant="secondary"
                className="h-4 min-w-4 px-1 text-xs font-mono bg-primary text-primary-foreground rounded-full"
              >
                {activeCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-72 p-4 bg-card border-border space-y-4"
          align="start"
        >
          <p className="text-sm font-medium text-foreground">Filter Leads</p>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                Min. Lead Score
              </Label>
              <span className="text-xs font-mono text-primary">
                {filters.minScore}+
              </span>
            </div>
            <Slider
              min={0}
              max={100}
              step={5}
              value={[filters.minScore]}
              onValueChange={([v]) =>
                onChange({ ...filters, minScore: v })
              }
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                Min. Rating
              </Label>
              <span className="text-xs font-mono text-primary">
                {filters.minRating > 0
                  ? `${filters.minRating.toFixed(1)} ★`
                  : "Any"}
              </span>
            </div>
            <Slider
              min={0}
              max={5}
              step={0.5}
              value={[filters.minRating]}
              onValueChange={([v]) =>
                onChange({ ...filters, minRating: v })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Has email</Label>
            <Switch
              checked={filters.hasEmail}
              onCheckedChange={(v) => onChange({ ...filters, hasEmail: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Has website</Label>
            <Switch
              checked={filters.hasWebsite}
              onCheckedChange={(v) => onChange({ ...filters, hasWebsite: v })}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">ICP Match</Label>
            <div className="flex gap-2">
              {(
                [
                  { label: "Any", value: undefined },
                  { label: "Match", value: true },
                  { label: "No match", value: false },
                ] as const
              ).map(({ label, value }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => onChange({ ...filters, icpMatch: value })}
                  className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                    filters.icpMatch === value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {activeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              className="w-full text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5 mr-1.5" />
              Clear filters
            </Button>
          )}
        </PopoverContent>
      </Popover>

      <span className="text-xs text-muted-foreground">
        Showing{" "}
        <span className="text-foreground font-mono">{filtered}</span>
        {filtered !== total && (
          <>
            {" "}of{" "}
            <span className="text-foreground font-mono">{total}</span>
          </>
        )}{" "}
        leads
      </span>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={reset}
          className="text-xs text-muted-foreground hover:text-destructive-foreground transition-colors flex items-center gap-1"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      )}
    </div>
  );
}
