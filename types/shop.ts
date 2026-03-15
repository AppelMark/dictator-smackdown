export enum ProductType {
  DLCArchetype = 'DLCArchetype',
  SeasonPass = 'SeasonPass',
  CosmeticSkin = 'CosmeticSkin',
  CommentaryPack = 'CommentaryPack',
  FounderBundle = 'FounderBundle',
}

export interface ShopItem {
  id: string;
  productType: ProductType;
  name: string;
  description: string;
  price: number;
  revenueCatProductId: string;
  stripeProductId: string;
  imageKey: string;
  isAvailable: boolean;
  isFeatured: boolean;
}

export interface Purchase {
  id: string;
  playerId: string;
  productId: string;
  purchasedAt: Date;
  platform: 'ios' | 'android' | 'web';
  amountCents: number;
}
