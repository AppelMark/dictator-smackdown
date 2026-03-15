export type ProductType = 'dlc' | 'season_pass' | 'cosmetic' | 'bundle';

export type PaymentPlatform = 'ios' | 'android' | 'web';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: ProductType;
  priceEurCents: number;
  revenueCatId: string;
  stripeProductId: string;
  available: boolean;
  imageUrl: string;
  limitedTimeDays?: number;
}

export interface Purchase {
  id: string;
  playerId: string;
  productId: string;
  platform: PaymentPlatform;
  amountCents: number;
  currency: string;
  purchasedAt: string;
  receiptId?: string;
}

export interface CheckoutSession {
  sessionId: string;
  url: string;
}

export interface PurchaseVerification {
  valid: boolean;
  productId: string;
  platform: PaymentPlatform;
  expiresAt?: string;
}
