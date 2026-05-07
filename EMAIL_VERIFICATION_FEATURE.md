# Email Verification Feature

## Overview
A comprehensive, layered email verification system built into Chella Lead Finder with adapter pattern for extensibility.

## Architecture

### Types & Interfaces (`lib/types.ts`)
- **Lead interface**: Added 10 new verification fields to track status, confidence, and verification details
- **EmailVerificationResult**: Interface for verification results
- **EmailVerifierAdapter**: Interface for pluggable verification adapters

### Adapters Layer

#### Mock Email Verifier (`lib/adapters/mock-email-verifier.ts`)
Implements 6-layer verification strategy:
1. **Syntax validation** - RFC 5322 simplified regex
2. **Domain validation** - TLD and format checks
3. **MX record simulation** - Checks for valid domain records
4. **Disposable email detection** - 10+ known disposable domains
5. **Role-based detection** - Detects info@, support@, sales@, etc.
6. **SMTP simulation** - Mocked SMTP checks with realistic results

Results: valid | invalid | risky | unknown

### Service Layer (`lib/services/email-verification-service.ts`)
- **Zod validation**: Input validation for single and batch verification
- **Email updating**: Automatically updates lead records with verification results
- **Status helpers**: Color and label generation for UI
- Adapter-agnostic design for future integration swapping

### API Routes

#### POST `/api/verify-email`
Single email verification with optional lead update.
```json
{
  "email": "contact@example.com",
  "leadId": "lead-123",
  "jobId": "job-456"
}
```

#### POST `/api/verify-emails`
Batch email verification for bulk operations.
```json
{
  "emails": ["contact@example.com", "info@example.com"],
  "leadIds": ["lead-123", "lead-124"],
  "jobId": "job-456"
}
```

### UI Components

#### EmailVerificationBadge (`components/email-verification-badge.tsx`)
- Status-specific icons and colors
- Tooltip with full verification details (confidence, MX, SMTP, flags)
- Four status colors: green (valid), red (invalid), amber (risky), gray (unknown)

#### EmailVerificationCard (`components/email-verification-card.tsx`)
- Appears in lead detail drawer
- Shows full verification status with reason and metadata
- "Verify Email" button with loading state
- Displays flags: disposable email, role-based email

#### VerifyEmailButton (`components/verify-email-button.tsx`)
- Inline verify button in leads table
- Shows verification status badge if already verified
- Click-to-verify UX with loading spinner
- Small icon button that doesn't obstruct table layout

### UI Integration

1. **Lead Detail Drawer**: EmailVerificationCard appears between email and phone
2. **Leads Table**: VerifyEmailButton in the "Contacts" column

## Verification Status States

| Status | Color | Meaning |
|--------|-------|---------|
| `valid` | Green | Email appears valid and likely deliverable |
| `invalid` | Red | Email format or domain issues detected |
| `risky` | Amber | Valid but flagged (role-based, SMTP inconclusive) |
| `unknown` | Gray | Cannot determine (SMTP failed to confirm) |

## Verification Fields on Lead

```typescript
verificationStatus?: "unverified" | "valid" | "invalid" | "risky" | "unknown"
verificationReason?: string
verificationConfidence?: number (0-1)
verifiedAt?: string (ISO timestamp)
isDisposable?: boolean
isRoleBased?: boolean
hasMxRecords?: boolean
smtpCheckAttempted?: boolean
smtpCheckResult?: "passed" | "failed" | "unknown"
```

## Future Extensibility

The implementation uses the adapter pattern, making it easy to swap:
- Mock verifier → Real internal verification service
- Mock SMTP → Actual SMTP connection
- Mock MX lookup → Real DNS MX record checks

TODO comments indicate where real integrations should connect:
- `lib/services/email-verification-service.ts` line 45-46
- Replace `mockEmailVerifier` with settings-driven adapter selection
- Add real email verification provider integration

## Design Decisions

1. **Server-side only**: All verification happens on the server; no secrets exposed to client
2. **No regex-only verification**: Syntax validation is just the first layer
3. **Realistic mock data**: 70% pass rate, 30% attempt rate for SMTP to simulate real-world behavior
4. **Zod validation**: All API inputs validated with clear error messages
5. **Adapter pattern**: Easy to replace verifier without changing UI/service layer
6. **Tooltips over clutter**: Badge shows status with tooltip for details
7. **Automatic persistence**: Verification results auto-save to leads store

## Testing the Feature

1. Open a job and navigate to the Leads tab
2. Click the mail icon in any row's "Contacts" column to verify that email
3. Click on a lead to open the detail drawer
4. Click "Verify Email" button in the Email Verification section
5. See status badge update with confidence, MX, SMTP, and flags
6. Refresh to see persisted verification status (in mock store)
