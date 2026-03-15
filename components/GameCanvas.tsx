'use client';

import { useEffect, useRef } from 'react';

export default function GameCanvas(): React.JSX.Element {
  const gameContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let game: Phaser.Game | undefined;

    const initPhaser = async (): Promise<void> => {
      const Phaser = await import('phaser');

      if (!gameContainerRef.current) return;

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: gameContainerRef.current,
        width: 390,
        height: 844,
        backgroundColor: '#1a1a2e',
        physics: {
          default: 'matter',
          matter: {
            gravity: { x: 0, y: 1 },
            debug: false,
          },
        },
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        scene: [],
      };

      game = new Phaser.Game(config);

      const canvas = gameContainerRef.current.querySelector('canvas');
      if (canvas) {
        canvas.style.touchAction = 'none';
        canvas.style.userSelect = 'none';
      }
    };

    initPhaser();

    return () => {
      game?.destroy(true);
    };
  }, []);

  return (
    <div
      ref={gameContainerRef}
      className="mx-auto h-full w-full max-w-[390px]"
    />
  );
}
