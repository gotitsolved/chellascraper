"use client";

import { useState, useMemo } from "react";
import { LeadsTable } from "@/components/leads-table";
import { LeadFiltersBar, type LeadFilters } from "@/components/lead-filters-bar";
import { LeadDetailDrawer } from "@/components/lead-detail-drawer";
import { LeadsMap } from "@/components/leads-map";
import { Button } from "@/components/ui/button";
import { Map, TableIcon } from "lucide-react";
import type { Lead } from "@/lib/types";

interface LeadsViewProps {
  leads: Lead[];
}

const DEFAULT_FILTERS: LeadFilters = {
  minScore: 0,
  minRating: 0,
  hasEmail: false,
  hasWebsite: false,
  icpMatch: undefined,
};

export function LeadsView({ leads }: LeadsViewProps) {
  const [filters, setFilters] = useState<LeadFilters>(DEFAULT_FILTERS);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (l.leadScore < filters.minScore) return false;
      if (filters.minRating > 0 && (l.rating ?? 0) < filters.minRating)
        return false;
      if (filters.hasEmail && !l.email) return false;
      if (filters.hasWebsite && !l.websiteUrl) return false;
      if (filters.icpMatch !== undefined && l.icpMatch !== filters.icpMatch)
        return false;
      return true;
    });
  }, [leads, filters]);

  function handleLeadClick(lead: Lead) {
    setSelectedLead(lead);
    setDrawerOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <LeadFiltersBar
          filters={filters}
          onChange={setFilters}
          total={leads.length}
          filtered={filteredLeads.length}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowMap((p) => !p)}
          className="gap-1.5 border-border text-foreground hover:bg-accent ml-auto"
        >
          {showMap ? (
            <>
              <TableIcon className="h-3.5 w-3.5" />
              Table
            </>
          ) : (
            <>
              <Map className="h-3.5 w-3.5" />
              Map
            </>
          )}
        </Button>
      </div>

      {showMap && (
        <LeadsMap
          leads={filteredLeads}
          selectedLeadId={selectedLead?.id}
          onSelectLead={(id) => {
            const lead = leads.find((l) => l.id === id);
            if (lead) handleLeadClick(lead);
          }}
        />
      )}

      <LeadsTable
        leads={filteredLeads}
        onLeadClick={handleLeadClick}
        selectedLeadId={selectedLead?.id}
      />

      <LeadDetailDrawer
        lead={selectedLead}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
