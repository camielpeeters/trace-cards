// Admin API - Card pricing management

import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '../../../../../lib/prisma';
import { getCurrentUser } from '../../../../../lib/auth';

// GET - Get pricing for a specific card
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: cardId } = await params;
    const prisma = getPrisma();

    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        prices: true,
        customPrice: true,
      },
    });

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    return NextResponse.json({ card });
  } catch (error: any) {
    console.error('Error fetching card pricing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch card pricing' },
      { status: 500 }
    );
  }
}

// POST/PUT - Update custom pricing for a card
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: cardId } = await params;
    const body = await request.json();
    const { customPrice, useCustomPrice, showMarketPrice } = body;

    if (customPrice === undefined || useCustomPrice === undefined) {
      return NextResponse.json(
        { error: 'customPrice and useCustomPrice are required' },
        { status: 400 }
      );
    }

    const prisma = getPrisma();

    // Verify card exists
    const card = await prisma.card.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // Upsert custom price
    const customPriceRecord = await prisma.customCardPrice.upsert({
      where: { cardId },
      update: {
        customPrice: parseFloat(customPrice),
        useCustomPrice: Boolean(useCustomPrice),
        showMarketPrice: showMarketPrice !== undefined ? Boolean(showMarketPrice) : true,
        updatedAt: new Date(),
      },
      create: {
        cardId,
        customPrice: parseFloat(customPrice),
        useCustomPrice: Boolean(useCustomPrice),
        showMarketPrice: showMarketPrice !== undefined ? Boolean(showMarketPrice) : true,
      },
    });

    return NextResponse.json({ success: true, customPrice: customPriceRecord });
  } catch (error: any) {
    console.error('Error updating card pricing:', error);
    return NextResponse.json(
      { error: 'Failed to update card pricing', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove custom pricing (revert to market price)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: cardId } = await params;
    const prisma = getPrisma();

    await prisma.customCardPrice.delete({
      where: { cardId },
    }).catch(() => {
      // Ignore if doesn't exist
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting custom pricing:', error);
    return NextResponse.json(
      { error: 'Failed to delete custom pricing' },
      { status: 500 }
    );
  }
}
