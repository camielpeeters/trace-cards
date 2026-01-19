// Seed script om test kaarten toe te voegen

import { getPrisma } from '../app/lib/prisma';

const prisma = getPrisma();

async function main() {
  console.log('🌱 Seeding test cards...');

  // Verwijder oude test data
  await prisma.cardPricing.deleteMany({});
  await prisma.card.deleteMany({});

  // Voeg test kaarten toe
  const testCards = [
    {
      pokemonTcgId: 'base1-4',
      name: 'Charizard',
      setName: 'Base Set',
      setCode: 'base1',
      number: '4',
      rarity: 'Rare Holo',
      imageUrl: 'https://images.pokemontcg.io/base1/4_hires.png',
    },
    {
      pokemonTcgId: 'base1-58',
      name: 'Pikachu',
      setName: 'Base Set',
      setCode: 'base1',
      number: '58',
      rarity: 'Common',
      imageUrl: 'https://images.pokemontcg.io/base1/58_hires.png',
    },
    {
      pokemonTcgId: 'xy1-1',
      name: 'Venusaur-EX',
      setName: 'XY',
      setCode: 'xy1',
      number: '1',
      rarity: 'Rare Holo EX',
      imageUrl: 'https://images.pokemontcg.io/xy1/1_hires.png',
    },
  ];

  for (const cardData of testCards) {
    const card = await prisma.card.create({
      data: cardData,
    });
    
    console.log(`✓ Created card: ${card.name}`);
  }

  console.log('🎉 Seeding complete!');
  console.log(`Created ${testCards.length} test cards`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
