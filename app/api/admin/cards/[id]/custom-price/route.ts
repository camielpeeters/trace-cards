// Update custom pricing for a card

import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '../../../../../lib/prisma';

// Force dynamic rendering to avoid build-time Prisma issues
export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { getCurrentUser } = await import('../../../../../lib/auth');
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { id } = await params;
    const body = await request.json();
    const { customPriceEUR, useCustomPrice } = body;
    
    const prisma = getPrisma();
    
    // Update or create pricing
    const pricing = await prisma.cardPricing.upsert({
      where: { cardId: id },
      create: {
        cardId: id,
        customPriceEUR: customPriceEUR ? parseFloat(customPriceEUR) : null,
        useCustomPrice: useCustomPrice || false,
      },
      update: {
        customPriceEUR: customPriceEUR !== undefined ? (customPriceEUR ? parseFloat(customPriceEUR) : null) : undefined,
        useCustomPrice: useCustomPrice !== undefined ? useCustomPrice : undefined,
        updatedAt: new Date(),
      }
    });
    
    return NextResponse.json({
      success: true,
      pricing
    });
    
  } catch (error: any) {
    console.error('Custom price update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update custom price' },
      { status: 500 }
    );
  }
}
