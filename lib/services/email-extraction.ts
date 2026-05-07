/**
 * Email Extraction Service
 * 
 * EMAIL-FIRST EXTRACTION: Prioritizes finding business email addresses above all else.
 * Extracts contact information and emails from business websites.
 */

interface ExtractionResult {
  emails: string[];
  primaryEmail?: string;
  emailCount: number;
  hasEmail: boolean;
  contactName?: string;
  phone?: string;
  contactPage?: string;
  confidence: number;
}

// Business email prefixes to prioritize
const BUSINESS_EMAIL_PREFIXES = [
  'info',
  'hello',
  'contact',
  'support',
  'sales',
  'orders',
  'wholesale',
  'inquiries',
  'booking',
  'appointments',
  'reservations',
  'partnership',
  'stockist',
];

const DISPOSABLE_DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
  'tempmail.com', 'guerrillamail.com', '10minutemail.com',
  'throwaway.email', 'test.com', 'example.com', 'aol.com'
];

export async function extractEmailsFromHtml(
  businessName: string,
  website: string,
  html: string
): Promise<ExtractionResult> {
  // Step 1: Find ALL emails using regex
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const allEmails = html.match(emailRegex) || [];
  
  // Step 2: Filter out disposable/personal emails
  const businessEmails = allEmails.filter(email => {
    const domain = email.split('@')[1].toLowerCase();
    const isNotDisposable = !DISPOSABLE_DOMAINS.includes(domain);
    const isNotNoreply = !email.toLowerCase().includes('noreply');
    return isNotDisposable && isNotNoreply;
  });
  
  // Step 3: Remove duplicates
  const uniqueEmails = Array.from(new Set(businessEmails));
  
  // Step 4: Prioritize emails with business prefixes
  const prioritizedEmails = uniqueEmails.sort((a, b) => {
    const aPrefix = a.split('@')[0].toLowerCase();
    const bPrefix = b.split('@')[0].toLowerCase();
    const aPriority = BUSINESS_EMAIL_PREFIXES.some(p => aPrefix.includes(p)) ? 0 : 1;
    const bPriority = BUSINESS_EMAIL_PREFIXES.some(p => bPrefix.includes(p)) ? 0 : 1;
    return aPriority - bPriority;
  });
  
  // Step 5: Select primary email (first business email, or first if none match pattern)
  const primaryEmail = prioritizedEmails[0];
  
  // Look for contact/about pages
  const contactPageMatch = html.match(/(?:contact|about|support)(?:\s+us)?/i);
  const contactPage = contactPageMatch ? contactPageMatch[0] : undefined;
  
  // Extract phone numbers
  const phoneRegex = /(?:\+1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
  const phoneMatches = html.match(phoneRegex);
  const phone = phoneMatches ? phoneMatches[0] : undefined;
  
  // Calculate confidence score (email presence is primary indicator)
  let confidence = 0.3; // Base confidence
  if (primaryEmail) confidence += 0.4; // Email found = +40%
  if (phone) confidence += 0.1; // Phone = +10%
  if (contactPage) confidence += 0.1; // Contact page = +10%
  if (uniqueEmails.length > 1) confidence += 0.1; // Multiple emails = +10%
  
  return {
    emails: prioritizedEmails.slice(0, 5), // Return top 5 emails
    primaryEmail,
    emailCount: prioritizedEmails.length,
    hasEmail: prioritizedEmails.length > 0,
    contactName: businessName,
    phone,
    contactPage,
    confidence: Math.min(1, confidence),
  };
}

/**
 * Validate an email address
 */
export async function validateEmail(email: string): Promise<boolean> {
  // Basic validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return false;
  
  // Check for disposable domains
  const domain = email.split('@')[1].toLowerCase();
  return !DISPOSABLE_DOMAINS.includes(domain);
}

/**
 * Score an email based on business relevance
 */
export async function scoreEmail(
  email: string,
  businessName: string,
  contactName?: string
): Promise<number> {
  let score = 50; // Base score
  
  const emailLower = email.toLowerCase();
  const businessNameLower = businessName.toLowerCase();
  
  // High priority: matches business name
  if (businessNameLower.length > 0) {
    const businessPrefix = businessNameLower.replace(/\s+/g, '').slice(0, 5);
    if (emailLower.includes(businessPrefix)) score += 25;
  }
  
  // Priority: business email prefixes
  const emailPrefix = email.split('@')[0].toLowerCase();
  if (BUSINESS_EMAIL_PREFIXES.some(p => emailPrefix.includes(p))) score += 20;
  
  // Domain quality (non-generic)
  const domain = email.split('@')[1].toLowerCase();
  if (!DISPOSABLE_DOMAINS.includes(domain)) score += 10;
  
  // Contact name match
  if (contactName && emailLower.includes(contactName.toLowerCase())) score += 15;
  
  return Math.min(100, score);
}

/**
 * Extract and validate all contact information from business website
 * PRIMARY FOCUS: Email extraction and qualification
 */
export async function extractBusinessContacts(
  businessName: string,
  website: string,
  html: string
): Promise<{
  primaryEmail?: string;
  emails: Array<{ email: string; score: number; valid: boolean }>;
  emailCount: number;
  hasEmail: boolean;
  contactName?: string;
  phone?: string;
}> {
  const extraction = await extractEmailsFromHtml(businessName, website, html);
  
  // Validate and score each email
  const validatedEmails = await Promise.all(
    extraction.emails.map(async (email) => ({
      email,
      valid: await validateEmail(email),
      score: await scoreEmail(email, businessName, extraction.contactName),
    }))
  );
  
  // Sort by score descending
  validatedEmails.sort((a, b) => b.score - a.score);
  
  return {
    primaryEmail: extraction.primaryEmail,
    emails: validatedEmails,
    emailCount: extraction.emailCount,
    hasEmail: extraction.hasEmail,
    contactName: extraction.contactName,
    phone: extraction.phone,
  };
}

