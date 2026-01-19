// Mollie webhook handler

import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '../../../../lib/prisma';
import { PaymentFactory } from '../../../../lib/payment/payment-factory';

// Force dynamic rendering (webhook routes are always dynamic)
export const dynamic = 'force-dynamic';

// POST - Handle Mollie webhook
export async function POST(request: NextRequest) {
  try {
    // TODO: Verify webhook signature when Mollie is implemented
    // const signature = request.headers.get('x-mollie-signature');
    // if (!verifyMollieSignature(signature, body)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    const body = await request.json();
    const paymentId = body.id || body.paymentId;

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID required' },
        { status: 400 }
      );
    }

    const prisma = getPrisma();
    const paymentProvider = PaymentFactory.create('MOLLIE');

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
    let updatedTransaction = await prisma.transaction.update({
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
    console.error('Mollie webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error.message },
      { status: 500 }
    );
  }
}
