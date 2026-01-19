import { NextResponse } from 'next/server';
import { requireAuth } from '../../../lib/auth';
import { getPrisma } from '../../../lib/prisma';

// Force dynamic rendering (uses request.headers via requireAuth)
export const dynamic = 'force-dynamic';

// Get user's shop cards
export async function GET(request) {
  try {
    const user = await requireAuth(request);
    
    // Get Prisma client instance
    const prisma = getPrisma();
    
    const cards = await prisma.shopCard.findMany({
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
    console.error('Error fetching shop cards:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Add shop card
export async function POST(request) {
  try {
    const user = await requireAuth(request);
    const { setId, setName, cardId, cardName, cardNumber, images, price, stock } = await request.json();
    
    const card = await prisma.shopCard.create({
      data: {
        userId: user.id,
        setId,
        setName,
        cardId,
        cardName,
        cardNumber,
        images: JSON.stringify(images),
        price: parseFloat(price) || 0,
        stock: parseInt(stock) || 1
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
    console.error('Error adding shop card:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Delete shop card
export async function DELETE(request) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get('id');
    
    await prisma.shopCard.delete({
      where: {
        id: cardId,
        userId: user.id
      }
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error deleting shop card:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
