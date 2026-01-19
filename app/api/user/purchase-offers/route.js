import { NextResponse } from 'next/server';
import { requireAuth } from '../../../lib/auth';
import prisma from '../../../lib/prisma';

// Get user's purchase offers
export async function GET(request) {
  try {
    const user = await requireAuth(request);
    
    const offers = await prisma.purchaseOffer.findMany({
      where: {
        userId: user.id
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Parse JSON cards
    const offersWithCards = offers.map(offer => ({
      ...offer,
      cards: JSON.parse(offer.cards)
    }));
    
    return NextResponse.json({ offers: offersWithCards });
    
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching purchase offers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create purchase offer
export async function POST(request) {
  try {
    const user = await requireAuth(request);
    const { visitorName, visitorEmail, visitorPhone, cards, totalExpected, notes } = await request.json();
    
    const offer = await prisma.purchaseOffer.create({
      data: {
        userId: user.id,
        visitorName,
        visitorEmail,
        visitorPhone,
        cards: JSON.stringify(cards),
        totalExpected: totalExpected ? parseFloat(totalExpected) : null,
        notes: notes || null
      }
    });
    
    return NextResponse.json({
      success: true,
      offer: {
        ...offer,
        cards: JSON.parse(offer.cards)
      }
    });
    
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error creating purchase offer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
