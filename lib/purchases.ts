type PaymentPlatform = 'ios' | 'android' | 'web';

export function getPlatform(): PaymentPlatform {
  if (typeof window === 'undefined') return 'web';
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'web';
}

export async function checkEntitlement(productId: string): Promise<boolean> {
  const platform = getPlatform();

  if (platform === 'web') {
    // Check via Stripe
    return false;
  }

  // Check via RevenueCat
  return false;

  void productId;
}

export async function restorePurchases(): Promise<string[]> {
  const platform = getPlatform();

  if (platform === 'web') {
    return [];
  }

  // RevenueCat restore
  return [];
}
