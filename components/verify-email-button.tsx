"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { EmailVerificationBadge } from "@/components/email-verification-badge";
import { CheckCircle2, Mail } from "lucide-react";
import type { Lead } from "@/lib/types";

interface VerifyEmailButtonProps {
  lead: Lead;
  email: string;
}

export function VerifyEmailButton({ lead, email }: VerifyEmailButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const hasVerification = lead.verificationStatus && lead.verificationStatus !== "unverified";

  const handleVerify = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!email || isLoading) return;

    setIsLoading(true);
    try {
      await fetch("/api/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          leadId: lead.id,
          jobId: lead.jobId,
        }),
      });
    } catch (err) {
      console.error("[v0] Email verification error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (hasVerification) {
    return (
      <EmailVerificationBadge
        status={lead.verificationStatus as any}
        confidence={lead.verificationConfidence}
        reason={lead.verificationReason}
      />
    );
  }

  return (
    <Button
      onClick={handleVerify}
      disabled={isLoading}
      size="sm"
      variant="ghost"
      className="h-6 px-2 text-xs"
      title="Verify this email address"
    >
      {isLoading ? (
        <Spinner className="h-3 w-3" />
      ) : (
        <Mail className="h-3 w-3" />
      )}
    </Button>
  );
}
