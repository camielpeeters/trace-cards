import { NextResponse } from 'next/server';
import { requireAuth } from '../../../lib/auth';
import prisma from '../../../lib/prisma';

// Get user's purchase cards
export async function GET(request) {
  try {
    const user = await requireAuth(request);
    
    const cards = await prisma.purchaseCard.findMany({
      where: {
        userId: user.id,
        isActive: true
      },
      orderBy: { addedAt: 'desc' }
    });
    
    // Parse JSON images
    const cardsWithImages = cards.map(card => ({
      ...card,
      images: JSON.parse(card.images)
    }));
    
    return NextResponse.json({ cards: cardsWithImages });
    
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching cards:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Add purchase card
export async function POST(request) {
  try {
    const user = await requireAuth(request);
    const { setId, setName, cardId, cardName, cardNumber, images } = await request.json();
    
    const card = await prisma.purchaseCard.create({
      data: {
        userId: user.id,
        setId,
        setName,
        cardId,
        cardName,
        cardNumber,
        images: JSON.stringify(images)
      }
    });
    
    return NextResponse.json({
      success: true,
      card: {
        ...card,
        images: JSON.parse(card.images)
      }
    });
    
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error adding card:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Delete purchase card
export async function DELETE(request) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get('id');
    
    await prisma.purchaseCard.delete({
      where: {
        id: cardId,
        userId: user.id // Ensure user owns this card
      }
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error deleting card:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
