// Generate direct links to Cardmarket product pages

/**
 * Generate Cardmarket search URL for a specific card
 * Users can click this link to check current Cardmarket prices
 */
export function generateCardmarketUrl(
  cardName: string,
  setName: string,
  language: string = 'en'
): string {
  // Cardmarket search URL structure
  const baseUrl = `https://www.cardmarket.com/${language}/Pokemon/Products/Search`;
  
  // Clean and encode card name
  const cleanName = cardName
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special chars
    .trim()
    .replace(/\s+/g, '+'); // Spaces to +
  
  const cleanSet = setName
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '+');
  
  // Build search query
  const searchQuery = `${cleanName}+${cleanSet}`;
  
  return `${baseUrl}?searchString=${encodeURIComponent(searchQuery)}`;
}

/**
 * Generate Cardmarket expansion/set URL
 */
export function generateCardmarketSetUrl(
  setName: string,
  language: string = 'en'
): string {
  const baseUrl = `https://www.cardmarket.com/${language}/Pokemon/Products/Singles`;
  const cleanSet = setName
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  
  return `${baseUrl}/${cleanSet}`;
}
