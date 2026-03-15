'use client';

import type { ShopItem as ShopItemType } from '@/types/shop';

interface ShopItemProps {
  item: ShopItemType;
  onPurchase: (item: ShopItemType) => void;
}

export default function ShopItem({
  item,
  onPurchase,
}: ShopItemProps): React.JSX.Element {
  const priceFormatted = (item.price / 100).toFixed(2);

  return (
    <div className="rounded-xl border border-gray-700 p-4">
      <h3 className="font-[family-name:var(--font-bebas-neue)] text-xl">
        {item.name}
      </h3>
      <p className="mt-1 text-sm text-gray-400">{item.description}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-lg font-bold">€{priceFormatted}</span>
        <button
          onClick={() => onPurchase(item)}
          disabled={!item.isAvailable}
          className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-bold text-black disabled:opacity-50"
        >
          Buy
        </button>
      </div>
    </div>
  );
}
