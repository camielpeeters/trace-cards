// User API - Get purchase offers for logged-in user
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '../../../lib/prisma';
import { getCurrentUser } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

// GET - Get all purchase offers for the current user
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prisma = getPrisma();
    
    const offers = await prisma.purchaseOffer.findMany({
      where: { userId: user.id },
      include: {
        cards: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ offers });
  } catch (error: any) {
    console.error('Error fetching purchase offers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch offers', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update offer status
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { offerId, status } = body;

    if (!offerId || !status) {
      return NextResponse.json(
        { error: 'Offer ID and status are required' },
        { status: 400 }
      );
    }

    const prisma = getPrisma();
    
    // Verify offer belongs to user
    const offer = await prisma.purchaseOffer.findUnique({
      where: { id: offerId },
    });

    if (!offer || offer.userId !== user.id) {
      return NextResponse.json(
        { error: 'Offer not found or unauthorized' },
        { status: 404 }
      );
    }

    // Update status
    const updatedOffer = await prisma.purchaseOffer.update({
      where: { id: offerId },
      data: { status },
      include: {
        cards: true,
      },
    });

    return NextResponse.json({ success: true, offer: updatedOffer });
  } catch (error: any) {
    console.error('Error updating offer:', error);
    return NextResponse.json(
      { error: 'Failed to update offer', details: error.message },
      { status: 500 }
    );
  }
}
