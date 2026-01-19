import { NextResponse } from 'next/server';
import { getPrisma } from '../../../lib/prisma';
import { requireAuth } from '../../../lib/auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Sync cards from localStorage to database
export async function POST(request) {
  try {
    const user = await requireAuth(request);
    const prisma = getPrisma();
    
    const { purchaseCards, shopCards } = await request.json();
    
    let syncedPurchase = 0;
    let syncedShop = 0;
    let errors = [];
    
    // Sync purchase cards
    if (purchaseCards && Array.isArray(purchaseCards)) {
      for (const card of purchaseCards) {
        try {
          // Check if card already exists
          const existing = await prisma.purchaseCard.findUnique({
            where: {
              userId_setId_cardId: {
                userId: user.id,
                setId: card.setId || card.set?.id,
                cardId: card.cardId || card.id
              }
            }
          });
          
          if (!existing) {
            // Create new card
            await prisma.purchaseCard.create({
              data: {
                userId: user.id,
                setId: card.setId || card.set?.id,
                setName: card.setName || card.set?.name || 'Unknown',
                cardId: card.cardId || card.id,
                cardName: card.cardName || card.name || 'Unknown',
                cardNumber: card.cardNumber || card.number || '',
                images: JSON.stringify(card.images || []),
                isActive: true
              }
            });
            syncedPurchase++;
          } else {
            // Always update existing card to ensure it's active and has latest data
            await prisma.purchaseCard.update({
              where: { id: existing.id },
              data: {
                isActive: true,
                setName: card.setName || card.set?.name || existing.setName || 'Unknown',
                cardName: card.cardName || card.name || existing.cardName || 'Unknown',
                cardNumber: card.cardNumber || card.number || existing.cardNumber || '',
                images: JSON.stringify(card.images || JSON.parse(existing.images || '[]'))
              }
            });
            syncedPurchase++;
          }
        } catch (error) {
          console.error('Error syncing purchase card:', error);
          errors.push(`Purchase card ${card.cardId || card.id}: ${error.message}`);
        }
      }
    }
    
    // Sync shop cards
    if (shopCards && Array.isArray(shopCards)) {
      for (const card of shopCards) {
        try {
          // Check if card already exists
          const existing = await prisma.shopCard.findUnique({
            where: {
              userId_setId_cardId: {
                userId: user.id,
                setId: card.setId || card.set?.id,
                cardId: card.cardId || card.id
              }
            }
          });
          
          if (!existing) {
            // Create new card
            await prisma.shopCard.create({
              data: {
                userId: user.id,
                setId: card.setId || card.set?.id,
                setName: card.setName || card.set?.name || 'Unknown',
                cardId: card.cardId || card.id,
                cardName: card.cardName || card.name || 'Unknown',
                cardNumber: card.cardNumber || card.number || '',
                images: JSON.stringify(card.images || []),
                price: parseFloat(card.price) || 0,
                stock: parseInt(card.stock) || 1,
                isActive: true
              }
            });
            syncedShop++;
          } else {
            // Always update existing card to ensure it's active and has latest data
            await prisma.shopCard.update({
              where: { id: existing.id },
              data: { 
                isActive: true,
                setName: card.setName || card.set?.name || existing.setName || 'Unknown',
                cardName: card.cardName || card.name || existing.cardName || 'Unknown',
                cardNumber: card.cardNumber || card.number || existing.cardNumber || '',
                images: JSON.stringify(card.images || JSON.parse(existing.images || '[]')),
                price: parseFloat(card.price) || existing.price || 0,
                stock: Math.max(existing.stock, parseInt(card.stock) || 1)
              }
            });
            syncedShop++;
          }
        } catch (error) {
          console.error('Error syncing shop card:', error);
          errors.push(`Shop card ${card.cardId || card.id}: ${error.message}`);
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      syncedPurchase,
      syncedShop,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('Error syncing cards:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to sync cards', details: error.message },
      { status: 500 }
    );
  }
}
