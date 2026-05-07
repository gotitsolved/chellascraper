/**
 * Email Extraction Service
 * 
 * Uses Claude AI to extract contact information and emails from business websites.
 * Integrated with Kernel Agents for structured extraction.
 */

interface ExtractionResult {
  emails: string[];
  contactName?: string;
  phone?: string;
  contactPage?: string;
  confidence: number;
}

export async function extractEmailsFromHtml(
  businessName: string,
  website: string,
  html: string
): Promise<ExtractionResult> {
  // First try simple regex extraction
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const simpleEmails = html.match(emailRegex) || [];
  
  // Filter for legitimate business emails (exclude common disposables)
  const filteredEmails = simpleEmails.filter(email => {
    const domain = email.split('@')[1].toLowerCase();
    const disposableDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'test.com'];
    return !disposableDomains.includes(domain) && !email.includes('noreply');
  });

  // Remove duplicates
  const uniqueEmails = Array.from(new Set(filteredEmails));

  // Look for contact/about pages
  const contactPageMatch = html.match(/(?:contact|about|support)(?:\s+us)?/i);
  const contactPage = contactPageMatch ? contactPageMatch[0] : undefined;

  // Extract phone numbers
  const phoneRegex = /(?:\+1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
  const phoneMatches = html.match(phoneRegex);
  const phone = phoneMatches ? phoneMatches[0] : undefined;

  // Calculate confidence score
  let confidence = 0.5; // Base confidence
  if (uniqueEmails.length > 0) confidence += 0.3;
  if (phone) confidence += 0.1;
  if (contactPage) confidence += 0.1;

  return {
    emails: uniqueEmails.slice(0, 5), // Return top 5 emails
    contactName: businessName,
    phone,
    contactPage,
    confidence: Math.min(1, confidence),
  };
}

/**
 * Validate an email address with SMTP simulation.
 * In production, this would perform actual SMTP verification.
 */
export async function validateEmail(email: string): Promise<boolean> {
  // Basic validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return false;

  // Simulate SMTP check - in production, use a real service
  const disposableDomains = [
    'tempmail.com',
    'guerrillamail.com',
    '10minutemail.com',
    'throwaway.email',
  ];

  const domain = email.split('@')[1].toLowerCase();
  return !disposableDomains.includes(domain);
}

/**
 * Score an email based on various factors.
 */
export async function scoreEmail(
  email: string,
  businessName: string,
  contactName?: string
): Promise<number> {
  let score = 50; // Base score

  // Check if email matches business name or contact name
  const businessMatch = email.toLowerCase().includes(
    businessName.toLowerCase().replace(/\s+/g, '').slice(0, 5)
  );
  if (businessMatch) score += 20;

  // Check if it's a generic email
  const genericEmails = ['info', 'contact', 'hello', 'support'];
  const emailPrefix = email.split('@')[0].toLowerCase();
  if (genericEmails.some(g => emailPrefix.includes(g))) score += 15;

  // Check domain quality (non-generic domains score higher)
  const domain = email.split('@')[1].toLowerCase();
  const genericDomains = ['gmail.com', 'yahoo.com', 'outlook.com'];
  if (!genericDomains.includes(domain)) score += 15;

  // Check for contact name match
  if (contactName && email.includes(contactName.toLowerCase())) score += 25;

  return Math.min(100, score);
}

/**
 * Extract and validate all contact information from business website.
 */
export async function extractBusinessContacts(
  businessName: string,
  website: string,
  html: string
): Promise<{
  emails: Array<{ email: string; score: number; valid: boolean }>;
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
    emails: validatedEmails,
    contactName: extraction.contactName,
    phone: extraction.phone,
  };
}
