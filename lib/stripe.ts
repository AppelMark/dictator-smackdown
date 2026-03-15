import type { CheckoutSession } from '../types/shop';

export async function createCheckoutSession(
  productId: string,
  playerId: string
): Promise<CheckoutSession> {
  const response = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, playerId }),
  });

  if (!response.ok) {
    throw new Error('Failed to create checkout session');
  }

  const data = await response.json();
  return data as CheckoutSession;
}
