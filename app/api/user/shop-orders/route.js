import { NextResponse } from 'next/server';
import { requireAuth } from '../../../lib/auth';
import { getPrisma } from '../../../lib/prisma';

// Force dynamic rendering (uses request.headers via requireAuth)
export const dynamic = 'force-dynamic';

// Get user's shop orders
export async function GET(request) {
  try {
    const user = await requireAuth(request);
    
    // Get Prisma client instance
    const prisma = getPrisma();
    
    const orders = await prisma.shopOrder.findMany({
      where: {
        userId: user.id
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Parse JSON cards
    const ordersWithCards = orders.map(order => ({
      ...order,
      cards: JSON.parse(order.cards)
    }));
    
    return NextResponse.json({ orders: ordersWithCards });
    
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching shop orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create shop order
export async function POST(request) {
  try {
    const user = await requireAuth(request);
    const { customerName, customerEmail, customerPhone, cards, totalPrice, notes } = await request.json();
    
    const order = await prisma.shopOrder.create({
      data: {
        userId: user.id,
        customerName,
        customerEmail,
        customerPhone,
        cards: JSON.stringify(cards),
        totalPrice: parseFloat(totalPrice) || 0,
        notes: notes || null
      }
    });
    
    return NextResponse.json({
      success: true,
      order: {
        ...order,
        cards: JSON.parse(order.cards)
      }
    });
    
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error creating shop order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
