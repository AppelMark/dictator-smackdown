'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const GameCanvas = dynamic(() => import('@/components/GameCanvas'), {
  ssr: false,
});

export default function BattlePage(): React.JSX.Element {
  return (
    <main style={{ backgroundColor: 'black', width: '100%', height: '100dvh' }}>
      <Suspense
        fallback={
          <div
            style={{
              width: '100%',
              height: '100dvh',
              backgroundColor: 'black',
            }}
          />
        }
      >
        <GameCanvas />
      </Suspense>
    </main>
  );
}
