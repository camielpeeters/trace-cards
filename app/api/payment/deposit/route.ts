// Payment deposit endpoint - Add money to wallet

import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '../../../lib/prisma';
import { getCurrentUser } from '../../../lib/auth';
import { PaymentFactory } from '../../../lib/payment/payment-factory';

// POST - Create deposit payment
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, provider = 'MOLLIE' } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    const prisma = getPrisma();

    // Get or create wallet
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

    // Create payment using provider
    const paymentProvider = PaymentFactory.create(provider);
    const paymentResult = await paymentProvider.createPayment(amount, {
      userId: user.id,
      type: 'DEPOSIT',
      description: `Wallet deposit - €${amount.toFixed(2)}`,
    });

    if (!paymentResult.success || !paymentResult.paymentId) {
      return NextResponse.json(
        { error: paymentResult.error || 'Failed to create payment' },
        { status: 500 }
      );
    }

    // Create pending transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: 'DEPOSIT',
        amount: parseFloat(amount),
        currency: 'EUR',
        status: 'PENDING',
        provider: provider as any,
        providerId: paymentResult.paymentId,
        description: `Wallet deposit - €${amount.toFixed(2)}`,
      },
    });

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      paymentId: paymentResult.paymentId,
      redirectUrl: paymentResult.redirectUrl,
    });
  } catch (error: any) {
    console.error('Error creating deposit:', error);
    return NextResponse.json(
      { error: 'Failed to create deposit', details: error.message },
      { status: 500 }
    );
  }
}
