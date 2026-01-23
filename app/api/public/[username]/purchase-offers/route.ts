// Public API - Purchase Offers (for visitors to make offers on cards)
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    const body = await request.json();
    
    const { name, email, phone, message, cards, negotiate, totalPrice } = body;

    // Validation
    if (!name || !email || !cards || !Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json(
        { error: 'Name, email, and cards are required' },
        { status: 400 }
      );
    }

    // Find the target user (shop owner)
    const prisma = getPrisma();
    const targetUser = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create purchase offer
    const offer = await prisma.purchaseOffer.create({
      data: {
        userId: targetUser.id,
        customerName: name,
        customerEmail: email,
        customerPhone: phone || null,
        message: message || null,
        negotiate: negotiate || false,
        totalPrice: negotiate ? null : (totalPrice || 0),
        status: 'PENDING',
        cards: {
          create: cards.map((card: any) => ({
            cardId: card.cardId,
            cardName: card.cardName,
            cardNumber: card.cardNumber,
            setId: card.setId,
            setName: card.setName,
            variant: card.variant || 'nonHolo',
            condition: card.condition || 'NM',
            price: negotiate ? null : (card.price || 0),
            imageUrl: card.images?.small || card.images?.large || null,
          })),
        },
      },
      include: {
        cards: true,
      },
    });

    return NextResponse.json({
      success: true,
      offer: {
        id: offer.id,
        offerNumber: offer.offerNumber,
        status: offer.status,
        createdAt: offer.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error creating purchase offer:', error);
    return NextResponse.json(
      { error: 'Failed to create offer', details: error.message },
      { status: 500 }
    );
  }
}
