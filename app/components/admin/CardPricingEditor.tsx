'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, DollarSign, ExternalLink } from 'lucide-react';

interface CardPricingEditorProps {
  cardId: string;
  cardName: string;
  currentPricing?: any;
  onUpdate?: () => void;
}

export function CardPricingEditor({
  cardId,
  cardName,
  currentPricing,
  onUpdate
}: CardPricingEditorProps) {
  const [customPrice, setCustomPrice] = useState(
    currentPricing?.customPriceEUR?.toString() || ''
  );
  const [useCustom, setUseCustom] = useState(
    currentPricing?.useCustomPrice || false
  );
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pricing, setPricing] = useState(currentPricing);
  
  // Load pricing on mount
  useEffect(() => {
    async function loadPricing() {
      try {
        const response = await fetch(`/api/admin/cards/${cardId}/sync-pricing`, {
          method: 'GET'
        });
        if (response.ok) {
          const data = await response.json();
          if (data.pricing) {
            setPricing(data.pricing);
            setCustomPrice(data.pricing.customPriceEUR?.toString() || '');
            setUseCustom(data.pricing.useCustomPrice || false);
          }
        }
      } catch (error) {
        console.error('Error loading pricing:', error);
      }
    }
    
    if (!currentPricing) {
      loadPricing();
    }
  }, [cardId, currentPricing]);
  
  async function handleSyncTCGPlayer() {
    setSyncing(true);
    try {
      const response = await fetch(`/api/admin/cards/${cardId}/sync-pricing`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        setPricing(data.pricing);
        alert('TCGPlayer prijs gesynchroniseerd!');
        onUpdate?.();
      } else {
        const error = await response.json();
        alert(`Sync mislukt: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Sync error:', error);
      alert('Sync error');
    } finally {
      setSyncing(false);
    }
  }
  
  async function handleSaveCustomPrice() {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/cards/${cardId}/custom-price`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customPriceEUR: customPrice ? parseFloat(customPrice) : null,
          useCustomPrice: useCustom
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setPricing(data.pricing);
        alert('Eigen prijs opgeslagen!');
        onUpdate?.();
      } else {
        const error = await response.json();
        alert(`Opslaan mislukt: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Save error');
    } finally {
      setSaving(false);
    }
  }
  
  const currentPricingData = pricing || currentPricing;
  
  return (
    <div className="glass-strong rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 space-y-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
        Prijsbeheer: {cardName}
      </h3>
      
      {/* TCGPlayer Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">
              TCGPlayer Prijs
            </h4>
            {currentPricingData?.tcgplayerPriceUSD && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ${currentPricingData.tcgplayerPriceUSD.toFixed(2)} USD
                {currentPricingData.usdToEurRate && (
                  <span className="ml-2">
                    ≈ €{(currentPricingData.tcgplayerPriceUSD * currentPricingData.usdToEurRate).toFixed(2)} EUR
                  </span>
                )}
              </p>
            )}
            {currentPricingData?.tcgplayerUpdated && (
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Laatste update: {new Date(currentPricingData.tcgplayerUpdated).toLocaleString('nl-NL')}
              </p>
            )}
          </div>
          
          <button
            onClick={handleSyncTCGPlayer}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync TCGPlayer'}
          </button>
        </div>
      </div>
      
      {/* Custom Price Section */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-6">
        <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Eigen Prijs
        </h4>
        
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="useCustom"
            checked={useCustom}
            onChange={(e) => setUseCustom(e.target.checked)}
            className="w-4 h-4 text-purple-600 rounded"
          />
          <label htmlFor="useCustom" className="text-sm text-gray-700 dark:text-gray-300">
            Gebruik eigen prijs (i.p.v. TCGPlayer)
          </label>
        </div>
        
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              disabled={!useCustom}
              className="w-full px-4 py-2 glass rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 text-gray-900 dark:text-white"
            />
          </div>
          
          <button
            onClick={handleSaveCustomPrice}
            disabled={saving || !useCustom}
            className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-colors disabled:opacity-50"
          >
            {saving ? 'Opslaan...' : 'Opslaan'}
          </button>
        </div>
      </div>
      
      {/* Cardmarket Link */}
      {currentPricingData?.cardmarketUrl && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <a
            href={currentPricingData.cardmarketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 glass rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-white/10 dark:hover:bg-gray-800/50 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Bekijk op Cardmarket
          </a>
        </div>
      )}
    </div>
  );
}
