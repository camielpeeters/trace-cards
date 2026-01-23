// User API - Get shop orders for logged-in user
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '../../../lib/prisma';
import { getCurrentUser } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

// GET - Get all shop orders for the current user
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prisma = getPrisma();
    
    const orders = await prisma.shopOrder.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    // Parse cards JSON
    const ordersWithParsedCards = orders.map(order => ({
      ...order,
      cards: JSON.parse(order.cards),
    }));

    return NextResponse.json({ orders: ordersWithParsedCards });
  } catch (error: any) {
    console.error('Error fetching shop orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update order status
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Order ID and status are required' },
        { status: 400 }
      );
    }

    const prisma = getPrisma();
    
    // Verify order belongs to user
    const order = await prisma.shopOrder.findUnique({
      where: { id: orderId },
    });

    if (!order || order.userId !== user.id) {
      return NextResponse.json(
        { error: 'Order not found or unauthorized' },
        { status: 404 }
      );
    }

    // Update status
    const updatedOrder = await prisma.shopOrder.update({
      where: { id: orderId },
      data: { status },
    });

    return NextResponse.json({ 
      success: true, 
      order: {
        ...updatedOrder,
        cards: JSON.parse(updatedOrder.cards),
      }
    });
  } catch (error: any) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order', details: error.message },
      { status: 500 }
    );
  }
}
