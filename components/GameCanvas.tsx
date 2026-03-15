'use client';

import { useEffect } from 'react';
import { GAME_WIDTH, GAME_HEIGHT } from '@/game/constants';

const containerStyle: React.CSSProperties = {
  width: '100vw',
  height: '100dvh',
  margin: 0,
  padding: 0,
  overflow: 'hidden',
  backgroundColor: 'black',
};

export default function GameCanvas(): React.JSX.Element {
  useEffect(() => {
    let game: Phaser.Game | undefined;

    const initPhaser = async (): Promise<void> => {
      const Phaser = await import('phaser');
      const { BattleScene } = await import('@/game/scenes/BattleScene');

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        backgroundColor: '#000000',
        parent: 'phaser-container',
        physics: {
          default: 'matter',
          matter: {
            gravity: { x: 0, y: 400 },
          },
        },
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        scene: [BattleScene],
      };

      game = new Phaser.Game(config);
    };

    initPhaser();

    return () => {
      if (game) {
        game.destroy(true);
      }
    };
  }, []);

  return <div id="phaser-container" style={containerStyle} />;
}
