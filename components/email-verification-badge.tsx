"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { EmailVerificationService } from "@/lib/services/email-verification-service";

interface EmailVerificationBadgeProps {
  status?: "valid" | "invalid" | "risky" | "unknown";
  confidence?: number;
  reason?: string;
  isDisposable?: boolean;
  isRoleBased?: boolean;
  hasMxRecords?: boolean;
  smtpCheckResult?: "passed" | "failed" | "unknown";
}

export function EmailVerificationBadge({
  status = "unknown",
  confidence,
  reason,
  isDisposable,
  isRoleBased,
  hasMxRecords,
  smtpCheckResult,
}: EmailVerificationBadgeProps) {
  const statusLabel = EmailVerificationService.getStatusLabel(status);
  const bgColor = EmailVerificationService.getStatusColor(status);

  const getIcon = () => {
    switch (status) {
      case "valid":
        return <CheckCircle2 className="h-3.5 w-3.5" />;
      case "invalid":
        return <XCircle className="h-3.5 w-3.5" />;
      case "risky":
        return <AlertCircle className="h-3.5 w-3.5" />;
      case "unknown":
        return <HelpCircle className="h-3.5 w-3.5" />;
    }
  };

  const details = [
    reason && `Reason: ${reason}`,
    confidence !== undefined && `Confidence: ${(confidence * 100).toFixed(0)}%`,
    isDisposable && "⚠️ Disposable email",
    isRoleBased && "📨 Role-based email",
    hasMxRecords !== undefined &&
      `MX Records: ${hasMxRecords ? "Found" : "Not found"}`,
    smtpCheckResult && `SMTP: ${smtpCheckResult}`,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`${bgColor} text-white border-0 gap-1 cursor-help`}
          >
            {getIcon()}
            {statusLabel}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-xs">{details}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
