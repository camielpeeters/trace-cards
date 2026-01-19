// Payment provider factory pattern

import { MollieProvider } from './mollie';
import { StripeProvider } from './stripe';

export type PaymentProviderType = 'MOLLIE' | 'STRIPE';

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  redirectUrl?: string;
  error?: string;
}

export interface PaymentStatus {
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  paymentId: string;
  amount: number;
  currency: string;
  metadata?: any;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  error?: string;
}

export interface IPaymentProvider {
  createPayment(amount: number, metadata: any): Promise<PaymentResult>;
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>;
  createRefund(paymentId: string, amount?: number): Promise<RefundResult>;
}

export class PaymentFactory {
  static create(provider: PaymentProviderType): IPaymentProvider {
    switch (provider) {
      case 'MOLLIE':
        return new MollieProvider();
      case 'STRIPE':
        return new StripeProvider();
      default:
        throw new Error(`Unknown payment provider: ${provider}`);
    }
  }
}
