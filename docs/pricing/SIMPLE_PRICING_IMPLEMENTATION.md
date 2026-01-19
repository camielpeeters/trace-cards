# ✅ Simple Pricing Implementation - Complete

## 🎯 Wat is geïmplementeerd

### 1. Database Schema ✅
- ✅ Vereenvoudigd `CardPricing` model toegevoegd
- ✅ Oude complexe `CardPrice` en `CustomCardPrice` modellen verwijderd
- ✅ Nieuwe velden: `tcgplayerPriceUSD`, `customPriceEUR`, `cardmarketUrl`, `usdToEurRate`
- ✅ Prisma client gegenereerd

### 2. Backend Services ✅

#### TCGPlayer Integration
- ✅ `/app/lib/pricing-sources/tcgplayer.ts`
  - `searchTCGPlayerCard()` - Zoek kaart op naam/set
  - `getTCGPlayerPrice()` - Haal prijs op
  - `getUSDtoEURRate()` - Wisselkoers API

#### Cardmarket Links
- ✅ `/app/lib/cardmarket-links.ts`
  - `generateCardmarketUrl()` - Genereer search URL
  - `generateCardmarketSetUrl()` - Genereer set URL

#### Pricing Sync
- ✅ `/app/lib/pricing-sync.ts`
  - `syncCardPricing()` - Sync prijs voor een kaart
  - `getCardDisplayPrice()` - Haal display prijs op

### 3. API Routes ✅

- ✅ `/api/admin/cards/[id]/sync-pricing` - POST - Sync TCGPlayer prijs
- ✅ `/api/admin/cards/[id]/custom-price` - PUT - Update eigen prijs
- ✅ `/api/cards/[id]/price` - GET - Haal display prijs op

### 4. Frontend Components ✅

- ✅ `/app/components/cards/CardPrice.tsx` - Display component voor prijzen
- ✅ `/app/components/admin/CardPricingEditor.tsx` - Admin editor voor prijsbeheer

## 📋 Database Migration Status

⚠️ **Database migration vereist:** De schema changes moeten nog worden toegepast.

### Optie 1: Force Reset (alle data wordt verwijderd)
```bash
npx prisma db push --force-reset
```

### Optie 2: Preserve Data (handmatige update vereist)
1. Manueel `updatedAt` toevoegen aan bestaande User records
2. Run: `npx prisma db push`

## 🔧 Environment Variables

Add to `.env`:

```bash
# TCGPlayer (optional - works without key for basic features)
TCGPLAYER_API_KEY=""

# Exchange Rate API (free, no key needed)
# Uses: https://api.exchangerate-api.com/v4/latest/USD

# Existing vars...
DATABASE_URL="file:./dev.db"
POKEMON_TCG_API_KEY="your-key"
```

## 🚀 Usage Examples

### 1. Sync Pricing (Admin)

```bash
curl -X POST http://localhost:3000/api/admin/cards/CARD_ID/sync-pricing \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Set Custom Price (Admin)

```bash
curl -X PUT http://localhost:3000/api/admin/cards/CARD_ID/custom-price \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "customPriceEUR": 25.99,
    "useCustomPrice": true
  }'
```

### 3. Get Card Price (Public)

```bash
curl http://localhost:3000/api/cards/CARD_ID/price
```

Response:
```json
{
  "price": 15.50,
  "currency": "EUR",
  "source": "tcgplayer",
  "tcgPriceUSD": 16.50,
  "cardmarketUrl": "https://www.cardmarket.com/..."
}
```

## 🎨 Component Usage

### CardPrice Component

```tsx
import { CardPrice } from '@/app/components/cards/CardPrice';

<CardPrice 
  cardId="card-uuid-here" 
  showCardmarketLink={true}
/>
```

### CardPricingEditor Component (Admin)

```tsx
import { CardPricingEditor } from '@/app/components/admin/CardPricingEditor';

<CardPricingEditor
  cardId="card-uuid-here"
  cardName="Pikachu VMAX"
  currentPricing={pricingData}
  onUpdate={() => {
    // Refresh pricing data
  }}
/>
```

## ✅ Next Steps

### Immediate:
1. **Run database migration** (see above)
2. Test TCGPlayer sync with a few cards
3. Test custom pricing
4. Integrate `CardPrice` component in card displays

### Future Enhancements:
- Bulk sync functionality
- Price history tracking
- Price alerts
- CSV import support
- Additional price sources

## 📝 Notes

- TCGPlayer API works without API key (basic search)
- For better results, sign up at: https://docs.tcgplayer.com/docs/getting-started
- Exchange rate updates automatically from free API
- Cardmarket links are search URLs (no API required)
- Custom pricing takes precedence over TCGPlayer prices

## 🎯 Success Criteria

- [x] Database schema simplified
- [x] TCGPlayer integration implemented
- [x] Cardmarket links generated
- [x] Pricing sync service created
- [x] API routes implemented
- [x] Frontend components created
- [ ] Database migration executed (pending user approval)
- [ ] Components integrated in existing UI
- [ ] Tested with real cards

---

**Implementation Status: ✅ COMPLETE**

All code is ready. Database migration is the final step.
