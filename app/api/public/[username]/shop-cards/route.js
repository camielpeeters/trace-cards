import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function GET(request, { params }) {
  try {
    const { username } = await params;
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get user's active shop cards
    const cards = await prisma.shopCard.findMany({
      where: {
        userId: user.id,
        isActive: true,
        stock: { gt: 0 } // Only show cards with stock > 0
      },
      orderBy: { addedAt: 'desc' }
    });
    
    const cardsWithImages = cards.map(card => ({
      ...card,
      images: JSON.parse(card.images)
    }));
    
    return NextResponse.json({
      user: {
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl
      },
      cards: cardsWithImages
    });
    
  } catch (error) {
    console.error('Error fetching public shop cards:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
