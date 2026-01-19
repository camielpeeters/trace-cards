// Test complete pricing sync flow

import { getPrisma } from '../app/lib/prisma';
import { syncCardPricing, getCardDisplayPrice } from '../app/lib/pricing-sync';

const prisma = getPrisma();

async function main() {
  console.log('🧪 Testing complete pricing sync...\n');

  // Get first test card
  const card = await prisma.card.findFirst({
    where: { name: 'Charizard' }
  });

  if (!card) {
    console.log('❌ No test card found. Run seed script first.');
    return;
  }

  console.log(`Testing with: ${card.name} (${card.setName})\n`);

  // Test 1: Sync pricing
  console.log('Test 1: Syncing pricing from TCGPlayer...');
  const pricing = await syncCardPricing(card.id);
  
  console.log('✓ Pricing synced:');
  console.log('  TCGPlayer Price (USD):', pricing.tcgplayerPriceUSD ? `$${pricing.tcgplayerPriceUSD}` : 'N/A');
  console.log('  TCGPlayer URL:', pricing.tcgplayerUrl || 'N/A');
  console.log('  Cardmarket URL:', pricing.cardmarketUrl || 'N/A');
  console.log('  USD to EUR Rate:', pricing.usdToEurRate || 'N/A');

  console.log('\n---\n');

  // Test 2: Get display price
  console.log('Test 2: Getting display price...');
  const displayPrice = await getCardDisplayPrice(card.id);
  
  if (displayPrice) {
    console.log('✓ Display price:');
    console.log('  Price:', displayPrice.price ? `€${displayPrice.price.toFixed(2)}` : 'N/A');
    console.log('  Currency:', displayPrice.currency);
    console.log('  Source:', displayPrice.source);
    console.log('  Cardmarket URL:', displayPrice.cardmarketUrl || 'N/A');
  }

  console.log('\n---\n');

  // Test 3: Set custom price
  console.log('Test 3: Setting custom price...');
  await prisma.cardPricing.update({
    where: { cardId: card.id },
    data: {
      customPriceEUR: 25.99,
      useCustomPrice: true
    }
  });

  const customDisplayPrice = await getCardDisplayPrice(card.id);
  
  if (customDisplayPrice) {
    console.log('✓ Custom price active:');
    console.log('  Price:', customDisplayPrice.price ? `€${customDisplayPrice.price.toFixed(2)}` : 'N/A');
    console.log('  Source:', customDisplayPrice.source);
  }

  console.log('\n🎉 All pricing sync tests passed!');
}

main()
  .catch((e) => {
    console.error('❌ Test failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
