// Admin API - Bulk pricing operations

import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '../../../../lib/prisma';
import { getCurrentUser } from '../../../../lib/auth';

// Force dynamic rendering to avoid build-time Prisma issues
export const dynamic = 'force-dynamic';

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
      // Use CardPricing model (not cardPrice)
      // Get a sample rate for USD conversion (default to 0.92 if not available)
      const samplePricing = await prisma.cardPricing.findFirst({
        where: { usdToEurRate: { not: null } },
        select: { usdToEurRate: true },
      });
      const usdToEurRate = samplePricing?.usdToEurRate || 0.92;
      
      const pricingRecords = await prisma.cardPricing.findMany({
        select: { cardId: true },
        where: {
          OR: [
            {
              customPriceEUR: {
                gte: filters.priceRange.min,
                lte: filters.priceRange.max,
              },
            },
            {
              AND: [
                { tcgplayerPriceUSD: { not: null } },
                {
                  tcgplayerPriceUSD: {
                    gte: filters.priceRange.min / usdToEurRate,
                    lte: filters.priceRange.max / usdToEurRate,
                  },
                },
              ],
            },
          ],
        },
      });
      if (pricingRecords.length > 0) {
        where.id = { in: pricingRecords.map(p => p.cardId) };
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
        pricing: true,
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
          // Calculate from market price (use TCGPlayer price converted to EUR)
          const marketPrice = card.pricing?.tcgplayerPriceUSD 
            ? (card.pricing.tcgplayerPriceUSD * (card.pricing.usdToEurRate || 1))
            : 0;
          
          if (marketPrice > 0) {
            finalPrice = marketPrice * (1 + parseFloat(margin) / 100);
          }
        } else if (action === 'use-market') {
          // Remove custom price (set useCustomPrice to false)
          if (card.pricing) {
            await prisma.cardPricing.update({
              where: { cardId: card.id },
              data: {
                useCustomPrice: false,
                updatedAt: new Date(),
              },
            });
          }
          updated++;
          continue;
        }

        if (finalPrice !== null) {
          await prisma.cardPricing.upsert({
            where: { cardId: card.id },
            update: {
              customPriceEUR: finalPrice,
              useCustomPrice: useCustomPrice !== undefined ? Boolean(useCustomPrice) : true,
              updatedAt: new Date(),
            },
            create: {
              cardId: card.id,
              customPriceEUR: finalPrice,
              useCustomPrice: useCustomPrice !== undefined ? Boolean(useCustomPrice) : true,
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
