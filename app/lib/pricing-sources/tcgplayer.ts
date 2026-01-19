// Simple TCGPlayer API integration

interface TCGPlayerSearchResult {
  productId: number;
  name: string;
  cleanName: string;
  imageUrl: string;
  categoryId: number;
  groupId: number;
  url: string;
  modifiedOn: string;
  extendedData: Array<{
    name: string;
    displayName: string;
    value: string;
  }>;
}

interface TCGPlayerPrice {
  productId: number;
  lowPrice: number | null;
  midPrice: number | null;
  highPrice: number | null;
  marketPrice: number | null;
  directLowPrice: number | null;
  subTypeName: string;
}

/**
 * Search for a Pokemon card on TCGPlayer
 */
export async function searchTCGPlayerCard(
  cardName: string,
  setName: string
): Promise<TCGPlayerSearchResult | null> {
  try {
    // TCGPlayer public search endpoint
    // Note: For better results, sign up for free API access at:
    // https://docs.tcgplayer.com/docs/getting-started
    
    const searchQuery = encodeURIComponent(`${cardName} ${setName}`);
    const url = `https://api.tcgplayer.com/catalog/categories/3/search?q=${searchQuery}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        // Add API key if you have one (optional for basic search)
        ...(process.env.TCGPLAYER_API_KEY && {
          'Authorization': `Bearer ${process.env.TCGPLAYER_API_KEY}`
        })
      }
    });
    
    if (!response.ok) {
      console.error('TCGPlayer search failed:', response.statusText);
      return null;
    }
    
    const data = await response.json();
    
    // Return first match (most relevant)
    return data.results?.[0] || null;
    
  } catch (error) {
    console.error('TCGPlayer API error:', error);
    return null;
  }
}

/**
 * Get price data for a specific TCGPlayer product
 */
export async function getTCGPlayerPrice(
  productId: number
): Promise<TCGPlayerPrice | null> {
  try {
    const url = `https://api.tcgplayer.com/pricing/product/${productId}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        ...(process.env.TCGPLAYER_API_KEY && {
          'Authorization': `Bearer ${process.env.TCGPLAYER_API_KEY}`
        })
      }
    });
    
    if (!response.ok) {
      console.error('TCGPlayer pricing failed:', response.statusText);
      return null;
    }
    
    const data = await response.json();
    return data.results?.[0] || null;
    
  } catch (error) {
    console.error('TCGPlayer pricing error:', error);
    return null;
  }
}

/**
 * Convert USD to EUR using free exchange rate API
 */
export async function getUSDtoEURRate(): Promise<number> {
  try {
    const response = await fetch(
      'https://api.exchangerate-api.com/v4/latest/USD'
    );
    
    const data = await response.json();
    return data.rates.EUR || 0.92; // Fallback to approximate rate
    
  } catch (error) {
    console.error('Exchange rate API error:', error);
    return 0.92; // Fallback rate
  }
}
