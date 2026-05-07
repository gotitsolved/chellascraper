"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Lead } from "@/lib/types";
import {
  Mail,
  Phone,
  Globe,
  Instagram,
  Facebook,
  Video,
  Star,
  MapPin,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from "lucide-react";

interface LeadDetailDrawerProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ScoreBar({ score }: { score: number }) {
  let color = "bg-[oklch(0.55_0.22_27)]";
  if (score >= 80) color = "bg-[oklch(0.62_0.16_145)]";
  else if (score >= 55) color = "bg-[oklch(0.76_0.15_55)]";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Lead Score</span>
        <span className="font-mono text-foreground font-semibold">{score}/100</span>
      </div>
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function ContactRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline flex items-center gap-1 truncate"
          >
            {value}
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        ) : (
          <p className="text-sm text-foreground truncate">{value}</p>
        )}
      </div>
    </div>
  );
}

export function LeadDetailDrawer({
  lead,
  open,
  onOpenChange,
}: LeadDetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-card border-border overflow-y-auto"
      >
        {lead ? (
          <>
            <SheetHeader className="pb-4">
              <SheetTitle className="text-foreground text-lg leading-snug text-balance">
                {lead.name}
              </SheetTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs bg-muted text-muted-foreground rounded px-2 py-0.5">
                  {lead.category}
                </span>
                {lead.icpMatch ? (
                  <span className="flex items-center gap-1 text-xs text-[oklch(0.62_0.16_145)]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    ICP Match
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <XCircle className="h-3.5 w-3.5" />
                    No ICP Match
                  </span>
                )}
              </div>
            </SheetHeader>

            <div className="space-y-5">
              {/* Score */}
              <ScoreBar score={lead.leadScore} />

              {lead.icpExplanation && (
                <p className="text-xs text-muted-foreground bg-muted/50 border border-border rounded p-2.5 leading-relaxed">
                  {lead.icpExplanation}
                </p>
              )}

              <Separator className="border-border" />

              {/* Location */}
              {lead.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-foreground">{lead.address}</p>
                    <p className="text-xs text-muted-foreground">
                      {[lead.city, lead.region, lead.country]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                </div>
              )}

              {/* Rating */}
              {lead.rating != null && (
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary fill-primary shrink-0" />
                  <span className="text-sm text-foreground">
                    {lead.rating.toFixed(1)} stars
                  </span>
                  {lead.reviewCount != null && (
                    <span className="text-xs text-muted-foreground">
                      ({lead.reviewCount} reviews)
                    </span>
                  )}
                </div>
              )}

              <Separator className="border-border" />

              {/* Contact info */}
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Contact Information
                </p>
                {lead.email && (
                  <ContactRow
                    icon={<Mail className="h-4 w-4" />}
                    label="Email"
                    value={lead.email}
                    href={`mailto:${lead.email}`}
                  />
                )}
                {lead.phone && (
                  <ContactRow
                    icon={<Phone className="h-4 w-4" />}
                    label="Phone"
                    value={lead.phone}
                    href={`tel:${lead.phone}`}
                  />
                )}
                {lead.websiteUrl && (
                  <ContactRow
                    icon={<Globe className="h-4 w-4" />}
                    label="Website"
                    value={lead.websiteUrl.replace(/^https?:\/\//, "")}
                    href={lead.websiteUrl}
                  />
                )}
                {lead.instagram && (
                  <ContactRow
                    icon={<Instagram className="h-4 w-4" />}
                    label="Instagram"
                    value={lead.instagram.replace("https://instagram.com/", "@")}
                    href={lead.instagram}
                  />
                )}
                {lead.facebook && (
                  <ContactRow
                    icon={<Facebook className="h-4 w-4" />}
                    label="Facebook"
                    value={lead.facebook.replace("https://facebook.com/", "")}
                    href={lead.facebook}
                  />
                )}
                {lead.tiktok && (
                  <ContactRow
                    icon={<Video className="h-4 w-4" />}
                    label="TikTok"
                    value={lead.tiktok.replace("https://tiktok.com/", "")}
                    href={lead.tiktok}
                  />
                )}
                {lead.googleUrl && (
                  <ContactRow
                    icon={<MapPin className="h-4 w-4" />}
                    label="Google Maps"
                    value="View on Google Maps"
                    href={lead.googleUrl}
                  />
                )}
              </div>

              {lead.aboutExcerpt && (
                <>
                  <Separator className="border-border" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                      About
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {lead.aboutExcerpt}
                    </p>
                  </div>
                </>
              )}

              {lead.servicesTags && lead.servicesTags.length > 0 && (
                <>
                  <Separator className="border-border" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                      Services
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {lead.servicesTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="bg-muted text-muted-foreground border border-border text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator className="border-border" />
              <p className="text-xs text-muted-foreground">
                Jurisdiction: {lead.jurisdiction ?? "Unknown"} &bull; Emails
                shown here are public business contacts. Always follow
                applicable email and privacy laws.
              </p>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a lead to view details.
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
