import { CharacterArchetype } from '../../types/character';
import type { BattleResult } from '../../types/battle';
import { CHARACTERS } from '../../data/characters';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

const ACCENT_COLORS: Record<CharacterArchetype, number> = {
  [CharacterArchetype.DerGroszer]: 0xFF4444,
  [CharacterArchetype.TheDon]: 0xFF8C00,
  [CharacterArchetype.TheNationalist]: 0x00BFFF,
  [CharacterArchetype.TheChairman]: 0xFF2222,
  [CharacterArchetype.TheAyatollah]: 0x22CC44,
  [CharacterArchetype.TheGeneralissimo]: 0x9933FF,
  [CharacterArchetype.TheOligarch]: 0xFFD700,
  [CharacterArchetype.TheTechMessiah]: 0x00FFCC,
};

const DEFEAT_TAUNTS: Record<CharacterArchetype, string[]> = {
  [CharacterArchetype.DerGroszer]: [
    'Pathetic. Even my bear hits harder.',
    'Come back when you can actually punch.',
    'In Russia, you would not last one round.',
  ],
  [CharacterArchetype.TheDon]: [
    'You lost. Big time. Nobody loses bigger than you.',
    'That was a disaster, believe me.',
    'Sad! Very sad performance.',
  ],
  [CharacterArchetype.TheNationalist]: [
    'Too slow. The fatherland is disappointed.',
    'You could not keep up. Nobody can.',
    'My grandmother dodges faster than you punch.',
  ],
  [CharacterArchetype.TheChairman]: [
    'The party has decided: you are unworthy.',
    'Your performance has been reviewed. It was lacking.',
    'My five-year plan did not include losing to you.',
  ],
  [CharacterArchetype.TheAyatollah]: [
    'I read your every move before you made it.',
    'Predictable. Utterly predictable.',
    'Patience always defeats desperation.',
  ],
  [CharacterArchetype.TheGeneralissimo]: [
    'I have toppled governments stronger than you.',
    'You dare challenge the supreme commander?',
    'My medals are heavier than your strongest punch.',
  ],
  [CharacterArchetype.TheOligarch]: [
    'You cannot afford to beat me.',
    'Money always wins in the end.',
    'I will buy your defeat and frame it.',
  ],
  [CharacterArchetype.TheTechMessiah]: [
    'My algorithm predicted this outcome.',
    'You have been disrupted. Permanently.',
    'Innovation beats tradition. Every time.',
  ],
};

const TIPS: Record<CharacterArchetype, string> = {
  [CharacterArchetype.DerGroszer]: 'Tip: Dodge his Uppercut — watch for the red glow (450ms wind-up).',
  [CharacterArchetype.TheDon]: 'Tip: His attacks are random — don\'t try to predict them, just react.',
  [CharacterArchetype.TheNationalist]: 'Tip: Block often — he attacks fast but individually weak.',
  [CharacterArchetype.TheChairman]: 'Tip: His defense blocks most attacks — spam Uppercuts to break through.',
  [CharacterArchetype.TheAyatollah]: 'Tip: Vary your attacks — he counters repeated patterns.',
  [CharacterArchetype.TheGeneralissimo]: 'Tip: He is slow — combo aggressively between his attacks.',
  [CharacterArchetype.TheOligarch]: 'Tip: Watch for his power moves and dodge early.',
  [CharacterArchetype.TheTechMessiah]: 'Tip: He is fast but fragile — land combos when you can.',
};

export class DefeatScene extends Phaser.Scene {
  private archetype: CharacterArchetype = CharacterArchetype.DerGroszer;
  private result?: BattleResult;

  constructor() {
    super({ key: 'DefeatScene' });
  }

  init(data: Record<string, unknown>): void {
    this.archetype = (data.archetype as CharacterArchetype) ?? CharacterArchetype.DerGroszer;
    this.result = data.result as BattleResult | undefined;
  }

  create(): void {
    const accentColor = ACCENT_COLORS[this.archetype] ?? 0xFF4444;
    const char = CHARACTERS.find((c) => c.archetype === this.archetype);
    const charName = char?.name ?? this.archetype;

    // --- Dark background with red tint ---
    this.cameras.main.setBackgroundColor('#1a0a0a');

    // Gradient overlay
    const overlay = this.add.graphics().setDepth(0);
    overlay.fillStyle(accentColor, 0.08);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // --- AI name ---
    this.add
      .text(GAME_WIDTH / 2, 60, charName.toUpperCase(), {
        fontSize: '36px',
        color: '#' + accentColor.toString(16).padStart(6, '0'),
        fontFamily: 'Arial',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.add
      .text(GAME_WIDTH / 2, 96, 'WINS', {
        fontSize: '16px',
        color: '#888888',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5)
      .setDepth(10);

    // --- AI victory pose (placeholder rectangle) ---
    this.add
      .rectangle(GAME_WIDTH / 2, 220, 90, 180, accentColor)
      .setDepth(5);

    // --- Speech bubble with defeat taunt ---
    const taunts = DEFEAT_TAUNTS[this.archetype] ?? ['...'];
    const taunt = taunts[Math.floor(Math.random() * taunts.length)];

    // Bubble background
    const bubbleX = GAME_WIDTH / 2;
    const bubbleY = 350;

    const bubble = this.add.graphics().setDepth(10);
    bubble.fillStyle(0x222222, 0.9);
    bubble.fillRoundedRect(bubbleX - 150, bubbleY - 30, 300, 60, 10);
    // Triangle pointer
    bubble.fillTriangle(bubbleX - 10, bubbleY - 30, bubbleX + 10, bubbleY - 30, bubbleX, bubbleY - 45);

    this.add
      .text(bubbleX, bubbleY, `"${taunt}"`, {
        fontSize: '13px',
        color: '#CCCCCC',
        fontFamily: 'Arial',
        fontStyle: 'italic',
        align: 'center',
        wordWrap: { width: 280 },
      })
      .setOrigin(0.5)
      .setDepth(11);

    // --- Fight statistics (consolation prizes) ---
    const statsY = 430;

    this.add
      .text(GAME_WIDTH / 2, statsY, 'YOUR FIGHT', {
        fontSize: '14px',
        color: '#666666',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(10);

    const highestCombo = this.result?.highestCombo ?? 0;
    const damageDealt = this.result?.playerDamageDealt ?? 0;
    const partsDetached = this.result?.partsDetached ?? 0;

    const stats = [
      `Best combo: ${highestCombo}x`,
      `Damage dealt: ${damageDealt}`,
      `Parts detached: ${partsDetached}`,
    ];

    stats.forEach((stat, i) => {
      this.add
        .text(GAME_WIDTH / 2, statsY + 24 + i * 22, stat, {
          fontSize: '13px',
          color: '#999999',
          fontFamily: 'Arial',
        })
        .setOrigin(0.5)
        .setDepth(10);
    });

    // --- Tip ---
    const tip = TIPS[this.archetype] ?? '';

    this.add
      .text(GAME_WIDTH / 2, 560, tip, {
        fontSize: '12px',
        color: '#FFD700',
        fontFamily: 'Arial',
        align: 'center',
        wordWrap: { width: GAME_WIDTH - 60 },
      })
      .setOrigin(0.5)
      .setDepth(10);

    // --- Buttons ---

    // REMATCH — big red
    const rematchBtn = this.add
      .text(GAME_WIDTH / 2, 650, 'REMATCH', {
        fontSize: '24px',
        color: '#FFFFFF',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        backgroundColor: '#CC2222',
        padding: { x: 40, y: 14 },
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setInteractive({ useHandCursor: true });

    rematchBtn.on('pointerdown', () => {
      this.scene.start('AnnouncementScene', { archetype: this.archetype });
    });

    rematchBtn.on('pointerover', () => rematchBtn.setScale(1.05));
    rematchBtn.on('pointerout', () => rematchBtn.setScale(1.0));

    // BACK TO SELECTION — small white
    const backBtn = this.add
      .text(GAME_WIDTH / 2, 710, 'BACK TO SELECTION', {
        fontSize: '13px',
        color: '#888888',
        fontFamily: 'Arial',
        textDecoration: 'underline',
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => {
      window.location.href = '/select';
    });

    backBtn.on('pointerover', () => backBtn.setColor('#FFFFFF'));
    backBtn.on('pointerout', () => backBtn.setColor('#888888'));
  }

  shutdown(): void {
    this.events.removeAllListeners();
  }
}
