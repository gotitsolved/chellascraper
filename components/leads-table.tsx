"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Mail, Globe, Star, CheckCircle2, XCircle } from "lucide-react";
import type { Lead } from "@/lib/types";

interface LeadsTableProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  selectedLeadId?: string;
}

function ScoreBadge({ score }: { score: number }) {
  let className = "";
  if (score >= 80) {
    className =
      "bg-[oklch(0.62_0.16_145/0.15)] text-[oklch(0.62_0.16_145)] border-[oklch(0.62_0.16_145/0.3)]";
  } else if (score >= 55) {
    className =
      "bg-[oklch(0.76_0.15_55/0.15)] text-[oklch(0.76_0.15_55)] border-[oklch(0.76_0.15_55/0.3)]";
  } else {
    className =
      "bg-[oklch(0.55_0.22_27/0.15)] text-[oklch(0.55_0.22_27)] border-[oklch(0.55_0.22_27/0.3)]";
  }
  return (
    <Badge
      variant="outline"
      className={`font-mono text-xs border tabular-nums ${className}`}
    >
      {score}
    </Badge>
  );
}

export function LeadsTable({ leads, onLeadClick, selectedLeadId }: LeadsTableProps) {
  if (leads.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No leads match the current filters.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-muted-foreground font-medium">
              Business
            </TableHead>
            <TableHead className="text-muted-foreground font-medium">
              Category
            </TableHead>
            <TableHead className="text-muted-foreground font-medium">
              Location
            </TableHead>
            <TableHead className="text-muted-foreground font-medium text-right">
              Rating
            </TableHead>
            <TableHead className="text-muted-foreground font-medium text-right">
              Reviews
            </TableHead>
            <TableHead className="text-muted-foreground font-medium text-center">
              Score
            </TableHead>
            <TableHead className="text-muted-foreground font-medium text-center">
              ICP
            </TableHead>
            <TableHead className="text-muted-foreground font-medium text-center">
              Contacts
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow
              key={lead.id}
              onClick={() => onLeadClick(lead)}
              className={`border-border cursor-pointer transition-colors ${
                selectedLeadId === lead.id
                  ? "bg-accent"
                  : "hover:bg-accent/40"
              }`}
            >
              <TableCell className="font-medium text-foreground max-w-[200px] truncate">
                {lead.name}
              </TableCell>
              <TableCell>
                <span className="text-xs text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                  {lead.category}
                </span>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {lead.city}
                {lead.region ? `, ${lead.region}` : ""}
              </TableCell>
              <TableCell className="text-right">
                {lead.rating != null ? (
                  <span className="flex items-center justify-end gap-1 text-sm text-foreground">
                    <Star className="h-3 w-3 text-primary fill-primary" />
                    {lead.rating.toFixed(1)}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </TableCell>
              <TableCell className="text-right font-mono text-sm text-muted-foreground">
                {lead.reviewCount ?? "—"}
              </TableCell>
              <TableCell className="text-center">
                <ScoreBadge score={lead.leadScore} />
              </TableCell>
              <TableCell className="text-center">
                {lead.icpMatch ? (
                  <CheckCircle2 className="h-4 w-4 text-[oklch(0.62_0.16_145)] mx-auto" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-1.5">
                  {lead.email && (
                    <Mail className="h-3.5 w-3.5 text-primary" aria-label="Has email" />
                  )}
                  {lead.websiteUrl && (
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" aria-label="Has website" />
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
