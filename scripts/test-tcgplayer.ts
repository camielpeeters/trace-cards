// Test TCGPlayer API integratie

import { searchTCGPlayerCard, getTCGPlayerPrice, getUSDtoEURRate } from '../app/lib/pricing-sources/tcgplayer';

async function main() {
  console.log('🧪 Testing TCGPlayer API...\n');

  // Test 1: Search for a card
  console.log('Test 1: Searching for Charizard Base Set...');
  const searchResult = await searchTCGPlayerCard('Charizard', 'Base Set');
  
  if (searchResult) {
    console.log('✓ Found:', searchResult.name);
    console.log('  Product ID:', searchResult.productId);
    console.log('  URL:', searchResult.url);
  } else {
    console.log('✗ No results found');
  }

  console.log('\n---\n');

  // Test 2: Get price (if we found a card)
  if (searchResult) {
    console.log('Test 2: Getting price data...');
    const priceData = await getTCGPlayerPrice(searchResult.productId);
    
    if (priceData) {
      console.log('✓ Price data:');
      console.log('  Market Price:', priceData.marketPrice ? `$${priceData.marketPrice}` : 'N/A');
      console.log('  Low Price:', priceData.lowPrice ? `$${priceData.lowPrice}` : 'N/A');
      console.log('  Mid Price:', priceData.midPrice ? `$${priceData.midPrice}` : 'N/A');
      console.log('  High Price:', priceData.highPrice ? `$${priceData.highPrice}` : 'N/A');
    } else {
      console.log('✗ No price data available');
    }
  }

  console.log('\n---\n');

  // Test 3: Exchange rate
  console.log('Test 3: Getting USD to EUR exchange rate...');
  const rate = await getUSDtoEURRate();
  console.log('✓ Current rate:', rate);
  
  if (searchResult) {
    const priceData = await getTCGPlayerPrice(searchResult.productId);
    if (priceData && priceData.marketPrice) {
      const priceEUR = priceData.marketPrice * rate;
      console.log(`  Example: $${priceData.marketPrice} = €${priceEUR.toFixed(2)}`);
    }
  }

  console.log('\n🎉 All tests complete!');
}

main()
  .catch((e) => {
    console.error('❌ Test failed:', e);
    process.exit(1);
  });
