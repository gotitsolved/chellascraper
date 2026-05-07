"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { ScoringRuleEditor } from "@/components/scoring-rule-editor";
import { Eye, EyeOff, Save, CheckCircle, Loader2 } from "lucide-react";
import type { Settings, ScoringRule } from "@/lib/types";

interface SettingsPageClientProps {
  settings: Settings;
}

function MaskedInput({
  label,
  description,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  description?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-foreground/80">{label}</Label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      <div className="relative">
        <Input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "Enter API key..."}
          className="pr-10 bg-muted border-border text-foreground placeholder:text-muted-foreground font-mono text-sm"
        />
        <button
          type="button"
          onClick={() => setShow((p) => !p)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={show ? "Hide key" : "Show key"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export function SettingsPageClient({ settings: initial }: SettingsPageClientProps) {
  const [settings, setSettings] = useState<Settings>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* API Keys */}
      <section className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">API Keys</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Store integration credentials. Keys are masked and stored in-memory (mock mode).
          </p>
        </div>
        <MaskedInput
          label="Google Places API Key"
          description="Used for business discovery via the Places Text Search API."
          value={settings.googlePlacesApiKey ?? ""}
          onChange={(v) =>
            setSettings((s) => ({ ...s, googlePlacesApiKey: v }))
          }
          placeholder="AIzaSy..."
        />
        <MaskedInput
          label="Scraper API Key"
          description="Used for website crawling and HTML extraction."
          value={settings.scraperApiKey ?? ""}
          onChange={(v) =>
            setSettings((s) => ({ ...s, scraperApiKey: v }))
          }
          placeholder="sk-scraper-..."
        />
        <MaskedInput
          label="AI API Key"
          description="Used for AI-powered email and contact extraction from HTML."
          value={settings.aiApiKey ?? ""}
          onChange={(v) => setSettings((s) => ({ ...s, aiApiKey: v }))}
          placeholder="sk-..."
        />
      </section>

      {/* Scraping options */}
      <section className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Scraping Options
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Control how aggressively websites are crawled.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-foreground/80">
              Max Pages per Domain
            </Label>
            <span className="font-mono text-sm text-primary">
              {settings.scrapeMaxPages}
            </span>
          </div>
          <Slider
            min={1}
            max={20}
            step={1}
            value={[settings.scrapeMaxPages]}
            onValueChange={([v]) =>
              setSettings((s) => ({ ...s, scrapeMaxPages: v }))
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm text-foreground/80">Crawl Depth</Label>
          <div className="flex gap-2">
            {(["home-only", "shallow", "deep"] as const).map((depth) => (
              <button
                key={depth}
                type="button"
                onClick={() =>
                  setSettings((s) => ({ ...s, scrapeDepth: depth }))
                }
                className={`text-sm px-3 py-1.5 rounded border transition-colors capitalize ${
                  settings.scrapeDepth === depth
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
                }`}
              >
                {depth.replace("-", " ")}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {settings.scrapeDepth === "home-only" &&
              "Only scrape the homepage."}
            {settings.scrapeDepth === "shallow" &&
              "Scrape homepage + contact page."}
            {settings.scrapeDepth === "deep" &&
              "Follow links up to max pages."}
          </p>
        </div>
      </section>

      {/* Scoring rule */}
      <section className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Scoring Rule
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Adjust the weight of each signal used to score leads against the Chella ICP.
            Weights should total 100.
          </p>
        </div>
        <ScoringRuleEditor
          scoringRule={settings.scoringRule}
          onChange={(rule: ScoringRule) =>
            setSettings((s) => ({ ...s, scoringRule: rule }))
          }
        />
      </section>

      <Separator className="border-border" />

      <div className="flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
        {saved && (
          <span className="text-sm text-[oklch(0.62_0.16_145)] flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4" />
            Settings saved.
          </span>
        )}
      </div>
    </div>
  );
}
