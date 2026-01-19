// Stripe webhook handler

import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '../../../../lib/prisma';
import { PaymentFactory } from '../../../../lib/payment/payment-factory';

// Force dynamic rendering (webhook routes are always dynamic)
export const dynamic = 'force-dynamic';

// POST - Handle Stripe webhook
export async function POST(request: NextRequest) {
  try {
    // TODO: Verify webhook signature when Stripe is implemented
    // const signature = request.headers.get('stripe-signature');
    // const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    // const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    const body = await request.json();
    const eventType = body.type || body.event?.type;
    const paymentId = body.data?.object?.id || body.payment_intent;

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID required' },
        { status: 400 }
      );
    }

    const prisma = getPrisma();
    const paymentProvider = PaymentFactory.create('STRIPE');

    // Get payment status
    const paymentStatus = await paymentProvider.getPaymentStatus(paymentId);

    // Find transaction by provider ID
    const transaction = await prisma.transaction.findFirst({
      where: { providerId: paymentId },
      include: { user: true },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Update transaction status
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: paymentStatus.status as any,
        metadata: JSON.stringify(paymentStatus.metadata || {}),
        updatedAt: new Date(),
      },
    });

    // If payment completed, update wallet for deposits
    if (
      paymentStatus.status === 'COMPLETED' &&
      transaction.type === 'DEPOSIT' &&
      transaction.status !== 'COMPLETED'
    ) {
      // Update wallet balance
      await prisma.userWallet.update({
        where: { userId: transaction.userId },
        data: {
          balance: {
            increment: transaction.amount,
          },
        },
      });
    }

    return NextResponse.json({ success: true, status: paymentStatus.status });
  } catch (error: any) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error.message },
      { status: 500 }
    );
  }
}
