'use client';

import { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';

interface CardPriceProps {
  cardId: string;
  showCardmarketLink?: boolean;
}

export function CardPrice({ cardId, showCardmarketLink = true }: CardPriceProps) {
  const [priceData, setPriceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchPrice() {
      try {
        const response = await fetch(`/api/cards/${cardId}/price`);
        if (response.ok) {
          const data = await response.json();
          setPriceData(data);
        }
      } catch (error) {
        console.error('Failed to fetch price:', error);
      } finally {
        setLoading(false);
      }
    }
    
    if (cardId) {
      fetchPrice();
    }
  }, [cardId]);
  
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }
  
  if (!priceData || priceData.price === null) {
    return (
      <div className="text-gray-500 dark:text-gray-400">
        Prijs niet beschikbaar
        {showCardmarketLink && priceData?.cardmarketUrl && (
          <a
            href={priceData.cardmarketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-blue-500 hover:text-blue-600 inline-flex items-center gap-1"
          >
            Check Cardmarket
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {/* Main Price */}
      <div className="text-2xl font-bold text-gray-900 dark:text-white">
        €{priceData.price.toFixed(2)}
        {priceData.source === 'custom' && (
          <span className="ml-2 text-sm font-normal text-purple-600 dark:text-purple-400">
            (Eigen prijs)
          </span>
        )}
        {priceData.source === 'tcgplayer' && priceData.tcgPriceUSD && (
          <span className="ml-2 text-sm font-normal text-blue-600 dark:text-blue-400">
            (TCGPlayer: ${priceData.tcgPriceUSD.toFixed(2)})
          </span>
        )}
      </div>
      
      {/* Cardmarket Link */}
      {showCardmarketLink && priceData.cardmarketUrl && (
        <a
          href={priceData.cardmarketUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
        >
          Vergelijk op Cardmarket
          <ExternalLink className="w-4 h-4" />
        </a>
      )}
    </div>
  );
}
