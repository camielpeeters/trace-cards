// Admin API - Bulk pricing operations

import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '../../../../lib/prisma';
import { getCurrentUser } from '../../../../lib/auth';

// POST - Apply bulk pricing actions
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      filters,
      action,
      customPrice,
      margin,
      useCustomPrice,
      showMarketPrice,
    } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    const prisma = getPrisma();

    // Build where clause based on filters
    const where: any = {};
    
    if (filters?.set) {
      where.setName = filters.set;
    }
    
    if (filters?.priceRange) {
      const prices = await prisma.cardPrice.findMany({
        select: { cardId: true },
        where: {
          averagePrice: {
            gte: filters.priceRange.min,
            lte: filters.priceRange.max,
          },
        },
      });
      if (prices.length > 0) {
        where.id = { in: prices.map(p => p.cardId) };
      } else {
        // No cards match price range
        return NextResponse.json({
          success: true,
          updated: 0,
          message: 'No cards match the specified filters',
        });
      }
    }

    // Get cards matching filters
    const cards = await prisma.card.findMany({
      where,
      include: {
        prices: true,
        customPrice: true,
      },
    });

    let updated = 0;
    const errors: any[] = [];

    for (const card of cards) {
      try {
        let finalPrice: number | null = null;

        if (action === 'set-custom' && customPrice !== undefined) {
          finalPrice = parseFloat(customPrice);
        } else if (action === 'apply-margin' && margin !== undefined) {
          // Calculate from market price
          const marketPrice = card.prices.length > 0
            ? card.prices.reduce((sum, p) => sum + p.averagePrice, 0) / card.prices.length
            : 0;
          
          if (marketPrice > 0) {
            finalPrice = marketPrice * (1 + parseFloat(margin) / 100);
          }
        } else if (action === 'use-market') {
          // Remove custom price
          await prisma.customCardPrice.delete({
            where: { cardId: card.id },
          }).catch(() => {});
          updated++;
          continue;
        }

        if (finalPrice !== null) {
          await prisma.customCardPrice.upsert({
            where: { cardId: card.id },
            update: {
              customPrice: finalPrice,
              useCustomPrice: useCustomPrice !== undefined ? Boolean(useCustomPrice) : true,
              showMarketPrice: showMarketPrice !== undefined ? Boolean(showMarketPrice) : true,
              updatedAt: new Date(),
            },
            create: {
              cardId: card.id,
              customPrice: finalPrice,
              useCustomPrice: useCustomPrice !== undefined ? Boolean(useCustomPrice) : true,
              showMarketPrice: showMarketPrice !== undefined ? Boolean(showMarketPrice) : true,
            },
          });
          updated++;
        }
      } catch (error: any) {
        errors.push({ cardId: card.id, error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      updated,
      total: cards.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Error in bulk pricing:', error);
    return NextResponse.json(
      { error: 'Failed to apply bulk pricing', details: error.message },
      { status: 500 }
    );
  }
}
