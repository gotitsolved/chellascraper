"use client";

import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ScoringRule, ScoringWeights } from "@/lib/types";

interface ScoringRuleEditorProps {
  scoringRule: ScoringRule;
  onChange: (rule: ScoringRule) => void;
}

const WEIGHT_LABELS: { key: keyof ScoringWeights; label: string; description: string }[] = [
  { key: "rating", label: "Google Rating", description: "Weight given to star rating (0–5)" },
  { key: "reviewCount", label: "Review Count", description: "Weight given to volume of reviews" },
  { key: "distance", label: "Distance", description: "Proximity to search center" },
  { key: "emailPresent", label: "Email Present", description: "Business has a discoverable email" },
  { key: "phonePresent", label: "Phone Present", description: "Business has a discoverable phone" },
  { key: "keywordMatch", label: "Keyword Match", description: "ICP keyword match in about/services" },
];

export function ScoringRuleEditor({ scoringRule, onChange }: ScoringRuleEditorProps) {
  const totalWeight = Object.values(scoringRule.weights).reduce((s, v) => s + v, 0);

  function updateWeight(key: keyof ScoringWeights, value: number) {
    onChange({
      ...scoringRule,
      weights: { ...scoringRule.weights, [key]: value },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm text-foreground/80">Rule Name</Label>
          <Input
            value={scoringRule.name}
            onChange={(e) =>
              onChange({ ...scoringRule, name: e.target.value })
            }
            className="mt-1 bg-muted border-border text-foreground w-64"
          />
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Total weight</p>
          <p
            className={`text-lg font-mono font-semibold ${
              totalWeight === 100
                ? "text-[oklch(0.62_0.16_145)]"
                : totalWeight > 100
                ? "text-destructive-foreground"
                : "text-[oklch(0.76_0.15_55)]"
            }`}
          >
            {totalWeight}
          </p>
          {totalWeight !== 100 && (
            <p className="text-xs text-muted-foreground">
              {totalWeight < 100
                ? `${100 - totalWeight} pts unused`
                : `${totalWeight - 100} pts over budget`}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-5">
        {WEIGHT_LABELS.map(({ key, label, description }) => (
          <div key={key} className="space-y-1.5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={scoringRule.weights[key]}
                  onChange={(e) =>
                    updateWeight(key, Math.max(0, Math.min(100, Number(e.target.value))))
                  }
                  className="w-16 h-7 text-center font-mono text-sm bg-muted border-border text-foreground"
                />
                <span className="text-xs text-muted-foreground">pts</span>
              </div>
            </div>
            <Slider
              min={0}
              max={50}
              step={1}
              value={[scoringRule.weights[key]]}
              onValueChange={([v]) => updateWeight(key, v)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
