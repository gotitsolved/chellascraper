/**
 * Beauty Industry Qualification Module
 * 
 * Classifies businesses as beauty-related based on category, signals, and descriptions.
 * Provides ICP matching and scoring for beauty/makeup/skincare/wellness businesses.
 */

export type BeautySegment = 
  | 'beauty-service'
  | 'beauty-retail'
  | 'beauty-brand'
  | 'skincare'
  | 'cosmetics'
  | 'salon'
  | 'spa'
  | 'medspa'
  | 'aesthetics'
  | 'dermatology'
  | 'cosmetic-clinic'
  | 'wellness-beauty'
  | 'health-beauty-retail'
  | 'pharmacy-beauty'
  | 'general-retailer-with-beauty-products';

const BEAUTY_SERVICE_KEYWORDS = [
  'salon', 'spa', 'hair', 'nail', 'lash', 'brow', 'facial', 'wax',
  'massage', 'esthetic', 'aesthetics', 'med spa', 'medical spa',
  'dermatolog', 'cosmetic', 'injectable', 'botox', 'filler',
  'skincare treatment', 'beauty service', 'hair styling',
];

const BEAUTY_PRODUCT_KEYWORDS = [
  'skincare', 'makeup', 'cosmetics', 'beauty product', 'fragrance',
  'perfume', 'beauty supply', 'beauty retail', 'haircare', 'body care',
  'personal care', 'cosmetic', 'serum', 'moisturizer', 'cleanser',
  'foundation', 'lipstick', 'eyeshadow', 'mascara', 'concealer',
];

const HEALTHCARE_BEAUTY_KEYWORDS = [
  'dermatolog', 'medical spa', 'med spa', 'aesthetic medicine',
  'cosmetic surgery', 'plastic surgery', 'injectable', 'botox',
  'dermatology clinic', 'aesthetic clinic', 'cosmetic clinic',
];

const WELLNESS_BEAUTY_KEYWORDS = [
  'wellness', 'holistic', 'natural beauty', 'organic skincare',
  'eco-friendly', 'apothecary', 'herbal', 'natural cosmetics',
];

/**
 * Extract beauty-related keywords from text
 */
export function extractBeautySignals(text: string): string[] {
  if (!text) return [];
  
  const lowerText = text.toLowerCase();
  const signals = new Set<string>();
  
  const allKeywords = [
    ...BEAUTY_SERVICE_KEYWORDS,
    ...BEAUTY_PRODUCT_KEYWORDS,
    ...HEALTHCARE_BEAUTY_KEYWORDS,
    ...WELLNESS_BEAUTY_KEYWORDS,
  ];
  
  for (const keyword of allKeywords) {
    if (lowerText.includes(keyword)) {
      signals.add(keyword);
    }
  }
  
  return Array.from(signals);
}

/**
 * Classify a business into beauty segments
 */
export function classifyBeautySegments(
  category: string | undefined,
  description: string | undefined,
  hasServices: boolean,
  hasRetail: boolean
): BeautySegment[] {
  const segments = new Set<BeautySegment>();
  const combinedText = `${category || ''} ${description || ''}`.toLowerCase();
  
  if (!combinedText) return [];
  
  // Service-based classifications
  if (combinedText.includes('salon') || combinedText.includes('hair')) {
    segments.add('salon');
    segments.add('beauty-service');
  }
  if (combinedText.includes('spa') && !combinedText.includes('med spa')) {
    segments.add('spa');
    segments.add('beauty-service');
  }
  if (combinedText.includes('med spa') || combinedText.includes('medical spa')) {
    segments.add('medspa');
    segments.add('aesthetics');
    segments.add('beauty-service');
  }
  if (combinedText.includes('nail')) {
    segments.add('salon');
    segments.add('beauty-service');
  }
  if (combinedText.includes('lash') || combinedText.includes('brow')) {
    segments.add('salon');
    segments.add('beauty-service');
  }
  if (combinedText.includes('barber') && combinedText.includes('grooming')) {
    segments.add('salon');
    segments.add('beauty-service');
  }
  if (combinedText.includes('esthetic') || combinedText.includes('aesthetic')) {
    segments.add('aesthetics');
    segments.add('beauty-service');
  }
  if (combinedText.includes('dermatolog')) {
    segments.add('dermatology');
  }
  if (combinedText.includes('cosmetic') && combinedText.includes('surgeon')) {
    segments.add('cosmetic-clinic');
  }
  
  // Product-based classifications
  if (combinedText.includes('skincare') || combinedText.includes('skin care')) {
    segments.add('skincare');
    segments.add('beauty-retail');
  }
  if (combinedText.includes('makeup') || combinedText.includes('cosmetics')) {
    segments.add('cosmetics');
    segments.add('beauty-retail');
  }
  if (combinedText.includes('fragrance') || combinedText.includes('perfume')) {
    segments.add('beauty-retail');
    segments.add('beauty-brand');
  }
  if (combinedText.includes('haircare') || combinedText.includes('hair care')) {
    segments.add('beauty-retail');
  }
  if (combinedText.includes('beauty supply') || combinedText.includes('beauty store')) {
    segments.add('beauty-retail');
  }
  if (combinedText.includes('health and beauty')) {
    segments.add('health-beauty-retail');
  }
  if (combinedText.includes('pharmacy') && combinedText.includes('beauty')) {
    segments.add('pharmacy-beauty');
  }
  if (combinedText.includes('boutique') && combinedText.includes('beauty')) {
    segments.add('general-retailer-with-beauty-products');
  }
  
  // Healthcare-beauty overlap
  if (combinedText.includes('dermatolog') || combinedText.includes('medical spa')) {
    segments.add('wellness-beauty');
  }
  if (combinedText.includes('injectable') || combinedText.includes('botox')) {
    segments.add('cosmetic-clinic');
    segments.add('wellness-beauty');
  }
  
  // Wellness-beauty
  if (combinedText.includes('wellness') && combinedText.includes('beauty')) {
    segments.add('wellness-beauty');
  }
  if (combinedText.includes('organic') && combinedText.includes('beauty')) {
    segments.add('wellness-beauty');
  }
  
  return Array.from(segments);
}

/**
 * Determine if a business sells beauty products
 */
export function determineSellsBeautyProducts(
  category: string | undefined,
  description: string | undefined
): boolean {
  const text = `${category || ''} ${description || ''}`.toLowerCase();
  return BEAUTY_PRODUCT_KEYWORDS.some(keyword => text.includes(keyword));
}

/**
 * Determine if a business offers beauty services
 */
export function determineOffersBeautyServices(
  category: string | undefined,
  description: string | undefined
): boolean {
  const text = `${category || ''} ${description || ''}`.toLowerCase();
  return BEAUTY_SERVICE_KEYWORDS.some(keyword => text.includes(keyword));
}

/**
 * Determine if a business has healthcare-beauty overlap
 */
export function determineHealthcareBeautyOverlap(
  category: string | undefined,
  description: string | undefined
): boolean {
  const text = `${category || ''} ${description || ''}`.toLowerCase();
  return HEALTHCARE_BEAUTY_KEYWORDS.some(keyword => text.includes(keyword));
}

/**
 * Calculate beauty relevance score (0-100)
 */
export function calculateBeautyRelevanceScore(
  category: string | undefined,
  description: string | undefined,
  beautySignals: string[] | undefined,
  sellsBeautyProducts: boolean | undefined,
  offersBeautyServices: boolean | undefined,
  healthcareBeautyOverlap: boolean | undefined
): number {
  let score = 0;
  
  // Beauty signals contribute 10 points each (max 40)
  const signalBonus = Math.min(40, (beautySignals?.length || 0) * 10);
  score += signalBonus;
  
  // Service/product/healthcare flags
  if (offersBeautyServices) score += 20;
  if (sellsBeautyProducts) score += 20;
  if (healthcareBeautyOverlap) score += 15;
  
  // Category keywords bonus
  const categoryText = `${category || ''}`.toLowerCase();
  const categorySignals = extractBeautySignals(categoryText);
  if (categorySignals.length > 0) score += 5;
  
  return Math.min(100, score);
}

/**
 * Determine ICP match for beauty businesses
 */
export function isBeautyIcpMatch(
  category: string | undefined,
  beautyRelevanceScore: number | undefined,
  icpSegments: string[] | undefined
): boolean {
  // ICP match if beauty score is significant or has beauty segments
  const beautyScore = beautyRelevanceScore || 0;
  const hasBeautySegments = (icpSegments || []).length > 0;
  
  return beautyScore >= 30 || hasBeautySegments;
}
