export const dynamic = 'force-dynamic';

import { JobCreateForm } from "@/components/job-create-form";
import { JobsTableClient } from "@/components/jobs-table-client";
import { Crosshair, Sparkles, Users, Globe } from "lucide-react";

export default function HomePage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Hero */}
      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center">
            <Crosshair className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground text-balance">
              Chella Lead Finder
            </h1>
            <p className="text-sm text-muted-foreground">
              Discover beauty-industry businesses, enrich with contact data, and export qualified leads.
            </p>
          </div>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 pt-1">
          {[
            { icon: <Sparkles className="h-3.5 w-3.5" />, label: "Google Places discovery" },
            { icon: <Globe className="h-3.5 w-3.5" />, label: "Website scraping & enrichment" },
            { icon: <Users className="h-3.5 w-3.5" />, label: "ICP scoring & tagging" },
          ].map(({ icon, label }) => (
            <span
              key={label}
              className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted border border-border rounded-full px-2.5 py-1"
            >
              {icon}
              {label}
            </span>
          ))}
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-5">
        {/* Create job form */}
        <div className="md:col-span-2">
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">
              Create New Job
            </h2>
            <JobCreateForm />
          </div>
        </div>

        {/* Recent jobs */}
        <div className="md:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Recent Jobs
            </h2>
            <a
              href="/jobs"
              className="text-xs text-primary hover:underline"
            >
              View all jobs
            </a>
          </div>
          <JobsTableClient />
        </div>
      </div>
    </div>
  );
}
