// Orders API - Create and manage orders

import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '../../lib/prisma';
import { getCurrentUser } from '../../lib/auth';
import { getPriceDisplay } from '../../lib/pricing';

// GET - Get user orders
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const prisma = getPrisma();
    const where: any = { userId: user.id };
    if (status) {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            card: {
              include: {
                prices: true,
                customPrice: true,
              },
            },
          },
        },
        transactions: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST - Create new order
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { items, shippingAddress } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Order items are required' },
        { status: 400 }
      );
    }

    const prisma = getPrisma();

    // Get user wallet
    let wallet = await prisma.userWallet.findUnique({
      where: { userId: user.id },
    });

    if (!wallet) {
      wallet = await prisma.userWallet.create({
        data: {
          userId: user.id,
          balance: 0.00,
          currency: 'EUR',
        },
      });
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const { cardId, quantity = 1 } = item;

      // Get card with pricing
      const card = await prisma.card.findUnique({
        where: { id: cardId },
        include: {
          prices: true,
          customPrice: true,
        },
      });

      if (!card) {
        return NextResponse.json(
          { error: `Card ${cardId} not found` },
          { status: 404 }
        );
      }

      // Get price
      const pricing = getPriceDisplay(
        card.prices,
        card.customPrice?.customPrice,
        card.customPrice?.useCustomPrice,
        card.customPrice?.showMarketPrice
      );

      const pricePerUnit = pricing.displayPrice;
      const total = pricePerUnit * quantity;

      subtotal += total;

      orderItems.push({
        cardId,
        quantity,
        pricePerUnit,
        total,
      });
    }

    const tax = subtotal * 0.21; // 21% VAT (NL)
    const total = subtotal + tax;

    // Check wallet balance
    if (wallet.balance < total) {
      return NextResponse.json(
        { error: 'Insufficient wallet balance' },
        { status: 400 }
      );
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order with items
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        subtotal,
        tax,
        total,
        status: 'PENDING_PAYMENT',
        shippingAddress: shippingAddress ? JSON.stringify(shippingAddress) : null,
        items: {
          create: orderItems.map(item => ({
            cardId: item.cardId,
            quantity: item.quantity,
            pricePerUnit: item.pricePerUnit,
            total: item.total,
          })),
        },
      },
      include: {
        items: {
          include: {
            card: true,
          },
        },
      },
    });

    // Create transaction and deduct from wallet
    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: 'PURCHASE',
        amount: total,
        currency: 'EUR',
        status: 'PENDING',
        provider: 'MANUAL',
        description: `Order ${orderNumber}`,
        orderId: order.id,
      },
    });

    // Deduct from wallet and update order status
    await prisma.userWallet.update({
      where: { userId: user.id },
      data: {
        balance: {
          decrement: total,
        },
      },
    });

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'COMPLETED',
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'PAID',
      },
    });

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        transaction,
      },
    });
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order', details: error.message },
      { status: 500 }
    );
  }
}
