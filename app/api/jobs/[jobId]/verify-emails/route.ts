import { NextRequest, NextResponse } from 'next/server';
import { LeadsService } from '@/lib/services/leads-service';
import { EmailVerificationService } from '@/lib/services/email-verification-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const body = await request.json();
    const { leadIds } = body;

    // Get leads with emails for this job
    let leadsToVerify;
    if (leadIds && leadIds.length > 0) {
      // Verify specific leads
      const allLeads = await LeadsService.getLeadsWithEmails(jobId);
      leadsToVerify = allLeads.filter(l => leadIds.includes(l.id));
    } else {
      // Verify all leads with emails
      leadsToVerify = await LeadsService.getLeadsWithEmails(jobId);
    }

    if (leadsToVerify.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No leads with emails to verify',
        verified: 0,
      });
    }

    // Extract emails for verification
    const emailsToVerify = leadsToVerify
      .filter(l => l.email)
      .map(l => ({ leadId: l.id, email: l.email! }));

    // Verify emails in batch
    const results = await EmailVerificationService.verifyEmails(
      emailsToVerify.map(e => e.email)
    );

    // Update each lead with verification results
    let verified = 0;
    for (let i = 0; i < emailsToVerify.length; i++) {
      const { leadId } = emailsToVerify[i];
      const result = results[i];
      
      if (result) {
        await LeadsService.updateVerificationStatus(leadId, {
          verificationStatus: result.status,
          verificationReason: result.reason,
          verificationConfidence: result.confidence,
          isDisposable: result.isDisposable,
          isRoleBased: result.isRoleBased,
          hasMxRecords: result.hasMxRecords,
          smtpCheckAttempted: result.smtpCheckAttempted,
          smtpCheckResult: result.smtpCheckResult,
        });
        verified++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Verified ${verified} email addresses`,
      verified,
      results: results.map((r, i) => ({
        leadId: emailsToVerify[i].leadId,
        email: emailsToVerify[i].email,
        status: r.status,
        reason: r.reason,
      })),
    });
  } catch (error) {
    console.error('[v0] Email verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify emails' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    
    // Get verification stats for this job
    const leads = await LeadsService.getLeadsWithEmails(jobId);
    
    const stats = {
      total: leads.length,
      verified: leads.filter(l => l.verificationStatus && l.verificationStatus !== 'unverified').length,
      valid: leads.filter(l => l.verificationStatus === 'valid').length,
      invalid: leads.filter(l => l.verificationStatus === 'invalid').length,
      risky: leads.filter(l => l.verificationStatus === 'risky').length,
      unknown: leads.filter(l => l.verificationStatus === 'unknown').length,
      unverified: leads.filter(l => !l.verificationStatus || l.verificationStatus === 'unverified').length,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('[v0] Error getting verification stats:', error);
    return NextResponse.json(
      { error: 'Failed to get verification stats' },
      { status: 500 }
    );
  }
}
