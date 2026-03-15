import type { ShopItem } from '../types/shop';
import { ProductType } from '../types/shop';

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'dictator_season_q1_499',
    productType: ProductType.SeasonPass,
    name: 'Season Pass Q1',
    description: 'Access all seasonal content for this quarter.',
    price: 499,
    revenueCatProductId: 'dictator_season_q1_499',
    stripeProductId: 'price_dictator_season_q1_499',
    imageKey: 'season_pass_thumb',
    isAvailable: true,
    isFeatured: false,
  },
  {
    id: 'dictator_founder_799',
    productType: ProductType.FounderBundle,
    name: 'Founding Dictator Bundle',
    description: 'Exclusive bundle with all current DLC and cosmetics. Limited time!',
    price: 799,
    revenueCatProductId: 'dictator_founder_799',
    stripeProductId: 'price_dictator_founder_799',
    imageKey: 'founder_bundle_thumb',
    isAvailable: true,
    isFeatured: true,
  },
  {
    id: 'dictator_cosmetic_golden_gloves_99',
    productType: ProductType.CosmeticSkin,
    name: 'Golden Gloves',
    description: 'Shiny golden boxing gloves for your fighter.',
    price: 99,
    revenueCatProductId: 'dictator_cosmetic_golden_gloves_99',
    stripeProductId: 'price_dictator_cosmetic_golden_gloves_99',
    imageKey: 'golden_gloves_thumb',
    isAvailable: true,
    isFeatured: false,
  },
];
