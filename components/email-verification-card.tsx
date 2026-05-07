"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { EmailVerificationBadge } from "@/components/email-verification-badge";
import { AlertCircle, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import type { Lead } from "@/lib/types";

interface EmailVerificationCardProps {
  email: string;
  lead: Lead;
}

export function EmailVerificationCard({
  email,
  lead,
}: EmailVerificationCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!email) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          leadId: lead.id,
          jobId: lead.jobId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Verification failed");
      }

      const result = await response.json();
      console.log("[v0] Email verification result:", result);
      // Note: In a real app, you'd update the lead in the parent component
      // For now, the service updates it in the store automatically
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const hasVerification = lead.verificationStatus && lead.verificationStatus !== "unverified";

  return (
    <div className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-foreground">Email Verification</h4>
        {hasVerification && (
          <EmailVerificationBadge
            status={lead.verificationStatus as any}
            confidence={lead.verificationConfidence}
            reason={lead.verificationReason}
            isDisposable={lead.isDisposable}
            isRoleBased={lead.isRoleBased}
            hasMxRecords={lead.hasMxRecords}
            smtpCheckResult={lead.smtpCheckResult}
          />
        )}
      </div>

      {hasVerification && (
        <div className="space-y-2 text-xs">
          {lead.verificationReason && (
            <p className="text-muted-foreground">{lead.verificationReason}</p>
          )}
          {lead.verificationConfidence !== undefined && (
            <p className="text-muted-foreground">
              Confidence: {(lead.verificationConfidence * 100).toFixed(0)}%
            </p>
          )}
          {lead.isDisposable && (
            <p className="flex items-center gap-1 text-amber-600">
              <AlertCircle className="h-3 w-3" /> Disposable/temporary email
            </p>
          )}
          {lead.isRoleBased && (
            <p className="flex items-center gap-1 text-blue-600">
              <AlertCircle className="h-3 w-3" /> Role-based email address
            </p>
          )}
          {lead.verifiedAt && (
            <p className="text-muted-foreground">
              Verified: {new Date(lead.verifiedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <XCircle className="h-3 w-3" /> {error}
        </p>
      )}

      <Button
        onClick={handleVerify}
        disabled={isLoading || !email}
        size="sm"
        variant="outline"
        className="w-full text-xs h-8"
      >
        {isLoading ? (
          <>
            <Spinner className="h-3 w-3 mr-1" /> Verifying...
          </>
        ) : hasVerification ? (
          <>
            <CheckCircle2 className="h-3 w-3 mr-1" /> Re-verify
          </>
        ) : (
          "Verify Email"
        )}
      </Button>
    </div>
  );
}
