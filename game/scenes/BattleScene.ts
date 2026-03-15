import { CharacterArchetype } from '../../types/character';
import { BattleState, PunchType } from '../../types/battle';
import type { PunchEvent, BattleResult, ScoreBreakdown } from '../../types/battle';
import { ARCHETYPE_STATS } from '../constants';
import type { ArchetypeConfig } from '../constants';
import {
  COUNTER_WINDOW,
  MOMENTUM_HIT_GAIN,
  MOMENTUM_DAMAGE_LOSS,
  GAME_WIDTH,
  GAME_HEIGHT,
  STAR_TWO_TIME_LIMIT,
} from '../constants';
import { TapZoneManager } from '../managers/TapZoneManager';
import { FacePartManager } from '../managers/FacePartManager';
import { JuiceManager } from '../managers/JuiceManager';
import { ComboManager } from '../managers/ComboManager';
import { AIOpponent } from '../managers/AIOpponent';
import { DamageCalculator } from '../DamageCalculator';
import { AdaptiveDifficulty } from '../AdaptiveDifficulty';
import { updateAfterFight } from '../../lib/playerProfile';

// --- First-person positions ---
const AI_X = GAME_WIDTH / 2;
const AI_Y = GAME_HEIGHT * 0.35;
const AI_W = GAME_WIDTH * 0.45;
const AI_H = GAME_HEIGHT * 0.45;

const FIST_Y = GAME_HEIGHT * 0.8;
const LEFT_FIST_X = GAME_WIDTH * 0.2;
const RIGHT_FIST_X = GAME_WIDTH * 0.8;
const FIST_W = 60;
const FIST_H = 70;

// --- Punch target positions ---
const TARGET_LEFT_X = GAME_WIDTH * 0.45;
const TARGET_RIGHT_X = GAME_WIDTH * 0.55;
const TARGET_Y = GAME_HEIGHT * 0.35;

export class BattleScene extends Phaser.Scene {
  // --- Managers ---
  private tapZoneManager!: TapZoneManager;
  private facePartManager!: FacePartManager;
  private juiceManager!: JuiceManager;
  private comboManager!: ComboManager;
  private aiOpponent!: AIOpponent;

  // --- Game objects (first-person) ---
  private ai!: Phaser.GameObjects.Rectangle;
  private leftFist!: Phaser.GameObjects.Rectangle;
  private rightFist!: Phaser.GameObjects.Rectangle;
  private leftFistGfx?: Phaser.GameObjects.Container;
  private rightFistGfx?: Phaser.GameObjects.Container;

  // --- State ---
  private playerHealth: number = 100;
  private playerMaxHealth: number = 100;
  private aiHealth: number = 100;
  private aiMaxHealth: number = 100;
  private playerStamina: number = 100;
  private playerMomentum: number = 50;
  private specialMeter: number = 0;
  private currentState: BattleState = BattleState.PlayerTurn;

  // --- Telegraph & Counter ---
  private telegraphActive: boolean = false;
  private counterWindowActive: boolean = false;
  private counterWindowTimer?: Phaser.Time.TimerEvent;
  private telegraphGfx?: Phaser.GameObjects.Graphics;
  private telegraphTween?: Phaser.Tweens.Tween;
  private dodgeHintText?: Phaser.GameObjects.Text;

  // --- Fight tracking ---
  private fightStartTime: number = 0;
  private tookNoDamage: boolean = true;
  private totalPartsDetached: number = 0;
  private totalCounterHits: number = 0;
  private specialUsed: boolean = false;
  private lastPunch?: PunchEvent;
  private lastPunchTime: number = 0;
  private hudUpdateTimer: number = 0;

  // --- Camera effects ---
  private dizzySway?: Phaser.Tweens.Tween;
  private isDizzy: boolean = false;

  // --- Config ---
  private archetype: CharacterArchetype = CharacterArchetype.DerGroszer;
  private difficulty: number = 1;
  private adaptiveModifier: number = 1.0;
  private archetypeConfig!: ArchetypeConfig;

  constructor() {
    super({ key: 'BattleScene' });
  }

  init(data: Record<string, unknown>): void {
    this.archetype =
      (data.archetype as CharacterArchetype) ?? CharacterArchetype.DerGroszer;
    this.difficulty = (data.difficulty as number) ?? 1;
    this.adaptiveModifier = 1.0;

    this.archetypeConfig = ARCHETYPE_STATS[this.archetype];
    this.aiMaxHealth = this.archetypeConfig.maxHealth;
    this.aiHealth = this.aiMaxHealth;
    this.playerMaxHealth = 100;
    this.playerHealth = this.playerMaxHealth;
    this.playerStamina = 100;
    this.playerMomentum = 50;
    this.specialMeter = 0;
    this.currentState = BattleState.PlayerTurn;
    this.telegraphActive = false;
    this.counterWindowActive = false;
    this.tookNoDamage = true;
    this.totalPartsDetached = 0;
    this.totalCounterHits = 0;
    this.specialUsed = false;
    this.lastPunchTime = 0;
    this.hudUpdateTimer = 0;

    // Async adaptive modifier load
    const adaptiveDifficulty = new AdaptiveDifficulty();
    const anonymousId = typeof window !== 'undefined'
      ? localStorage.getItem('dictator_anonymous_id') ?? ''
      : '';
    if (anonymousId) {
      adaptiveDifficulty.getModifier(anonymousId, this.archetype).then((mod) => {
        this.adaptiveModifier = mod;
      });
    }
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#000000');
    this.fightStartTime = Date.now();

    // --- AI opponent (large, centered, first-person view) ---
    this.ai = this.add.rectangle(AI_X, AI_Y, AI_W, AI_H, 0xcc3333).setDepth(5);

    // --- Player fists (placeholder claymation gloves) ---
    this.createFistTextures();
    this.leftFist = this.add
      .rectangle(LEFT_FIST_X, FIST_Y, FIST_W, FIST_H, 0x000000)
      .setAlpha(0)
      .setDepth(20);
    this.rightFist = this.add
      .rectangle(RIGHT_FIST_X, FIST_Y, FIST_W, FIST_H, 0x000000)
      .setAlpha(0)
      .setDepth(20);

    // Visual fist graphics attached to the invisible rectangles
    this.createFistGraphic(LEFT_FIST_X, FIST_Y, 10, 'leftFistGfx');
    this.createFistGraphic(RIGHT_FIST_X, FIST_Y, -10, 'rightFistGfx');

    // --- Managers ---
    this.tapZoneManager = new TapZoneManager(this);
    this.facePartManager = new FacePartManager(this, AI_X, AI_Y);
    this.juiceManager = new JuiceManager(this);
    this.comboManager = new ComboManager(this);
    this.aiOpponent = new AIOpponent(
      this,
      this.archetype,
      this.difficulty as 1 | 2 | 3,
      this.adaptiveModifier
    );

    // --- Launch HUD ---
    this.scene.launch('HUDScene');
    this.emitHUDUpdate();

    // --- Event Listeners ---
    this.events.on('punch', (event: PunchEvent) => this.onPlayerPunch(event));
    this.events.on('dodge', (event: { direction: 'left' | 'right' }) => this.onDodge(event));
    this.events.on('enemy_telegraph', (data: { type: PunchType; duration: number }) => this.onEnemyTelegraph(data));
    this.events.on('enemy_attack', (data: { type: PunchType; power: number; damageMultiplier: number }) => this.onEnemyAttack(data));
    this.events.on('bear_stare', () => this.onBearStare());
    this.events.on('intimidation', () => this.onIntimidation());
    this.events.on('special_charge', () => this.onSpecialCharge());
    this.events.on('block', (data: { hand: 'left' | 'right' }) => this.onBlock(data.hand));
    this.events.on('block_release', () => this.onBlockRelease());
    this.events.on('face_part_detached', (partName: string, x: number, y: number) => {
      this.juiceManager.onPartDetach(partName, x, y);
      this.totalPartsDetached++;
    });
  }

  // ============================================================
  // Update loop
  // ============================================================

  update(_time: number, delta: number): void {
    if (this.currentState === BattleState.KO || this.currentState === BattleState.Defeat) return;

    this.aiOpponent.update(delta, this.aiHealth, this.playerHealth, this.playerMomentum);

    // Stamina regen (15/s when not recently attacking)
    if (Date.now() - this.lastPunchTime > 500) {
      this.playerStamina = Math.min(100, this.playerStamina + 15 * (delta / 1000));
    }

    // Momentum decay towards 50
    if (this.playerMomentum > 50) {
      this.playerMomentum = Math.max(50, this.playerMomentum - 3 * (delta / 1000));
    } else if (this.playerMomentum < 50) {
      this.playerMomentum = Math.min(50, this.playerMomentum + 3 * (delta / 1000));
    }

    // Sync fist graphics to hitbox positions
    if (this.leftFistGfx) {
      this.leftFistGfx.setPosition(this.leftFist.x, this.leftFist.y);
    }
    if (this.rightFistGfx) {
      this.rightFistGfx.setPosition(this.rightFist.x, this.rightFist.y);
    }

    // Arena degradation
    this.juiceManager.onArenaDegrade(this.aiHealth / this.aiMaxHealth);

    // Periodic HUD update
    this.hudUpdateTimer += delta;
    if (this.hudUpdateTimer > 200) {
      this.hudUpdateTimer = 0;
      this.emitHUDUpdate();
    }
  }

  // ============================================================
  // Player punch — first-person fist animations
  // ============================================================

  private onPlayerPunch(event: PunchEvent): void {
    if (this.currentState !== BattleState.PlayerTurn) return;

    this.currentState = BattleState.Animating;
    this.lastPunch = event;
    this.lastPunchTime = Date.now();

    // Animate the correct fist
    this.animateFistPunch(event.type, event.hand);

    // Register with AI and combo
    this.aiOpponent.registerPlayerMove(event.type);
    const comboCount = this.comboManager.registerHit();

    // Counter check
    const isCounter = this.counterWindowActive;
    if (isCounter) {
      this.counterWindowActive = false;
      this.counterWindowTimer?.destroy();
      this.totalCounterHits++;
    }

    // Damage calculation
    const attackerStats = {
      health: this.playerHealth,
      maxHealth: this.playerMaxHealth,
      stamina: this.playerStamina,
      maxStamina: 100,
      strength: 80,
      speed: 70,
      defense: 50,
      momentum: this.playerMomentum,
    };

    const defenderStats = {
      health: this.aiHealth,
      maxHealth: this.aiMaxHealth,
      stamina: this.archetypeConfig.maxStamina,
      maxStamina: this.archetypeConfig.maxStamina,
      strength: this.archetypeConfig.strength,
      speed: this.archetypeConfig.speed,
      defense: this.archetypeConfig.defense,
      momentum: 50,
    };

    const punchWithCombo: PunchEvent = { ...event, comboPosition: comboCount - 1 };

    const result = DamageCalculator.calculate(
      punchWithCombo,
      attackerStats,
      defenderStats,
      false,
      isCounter,
      this.playerMomentum
    );

    // Apply damage
    this.aiHealth = Math.max(0, this.aiHealth - result.damage);
    this.playerMomentum = Math.min(100, this.playerMomentum + MOMENTUM_HIT_GAIN);
    this.specialMeter = Math.min(100, this.specialMeter + 5 + (isCounter ? 10 : 0));

    // Juice feedback on AI position
    this.juiceManager.onPunchHit(AI_X, AI_Y - 20, result, event.type);

    // Face part detach
    if (result.triggerDetach && result.partName) {
      this.facePartManager.checkAndDetach(this.aiHealth, this.aiMaxHealth, punchWithCombo);
    }

    // Counter feedback
    if (isCounter) {
      const counterText = this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.25, 'COUNTER!', {
          fontSize: '36px',
          color: '#FFD700',
          fontFamily: 'Arial',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 4,
        })
        .setOrigin(0.5)
        .setDepth(45);

      this.tweens.add({
        targets: counterText,
        y: counterText.y - 60,
        alpha: 0,
        scale: 1.3,
        duration: 800,
        onComplete: () => counterText.destroy(),
      });
    }

    // Combo feedback
    if (comboCount >= 2) {
      this.juiceManager.onComboHit(comboCount);
    }

    // AI recoil — direction depends on punch type
    if (event.type === PunchType.Uppercut) {
      // Uppercut: AI flies upward with arc
      this.tweens.add({
        targets: this.ai,
        y: this.ai.y - 50,
        scaleX: 0.9,
        scaleY: 1.1,
        duration: 150,
        ease: 'Power2',
        onComplete: () => {
          this.tweens.add({
            targets: this.ai,
            y: AI_Y,
            scaleX: 1,
            scaleY: 1,
            duration: 300,
            ease: 'Bounce.easeOut',
          });
        },
      });
    } else {
      // Jab/Hook/Cross: AI moves in punch direction
      const recoilX = event.hand === 'left' ? 25 : -25;
      this.tweens.add({
        targets: this.ai,
        x: this.ai.x + recoilX,
        scaleX: 0.95,
        duration: 75,
        yoyo: true,
        onComplete: () => {
          this.ai.x = AI_X;
        },
      });
    }

    this.facePartManager.updateContainerPosition(this.ai.x, this.ai.y);
    this.emitHUDUpdate();

    if (this.aiHealth <= 0) {
      this.checkAIKO();
    } else {
      this.time.delayedCall(400, () => {
        if (this.currentState === BattleState.Animating) {
          this.currentState = BattleState.PlayerTurn;
        }
      });
    }
  }

  // ============================================================
  // Fist punch animations
  // ============================================================

  private animateFistPunch(type: PunchType, hand: 'left' | 'right'): void {
    const fist = hand === 'left' ? this.leftFist : this.rightFist;
    const restX = hand === 'left' ? LEFT_FIST_X : RIGHT_FIST_X;
    const targetX = hand === 'left' ? TARGET_LEFT_X : TARGET_RIGHT_X;

    switch (type) {
      case PunchType.Jab:
        // Straight jab to AI center
        this.tweens.add({
          targets: fist,
          x: targetX,
          y: TARGET_Y,
          duration: 100,
          yoyo: true,
          hold: 30,
          ease: 'Power2',
        });
        break;

      case PunchType.Hook: {
        // Arc from the side into center
        const sideX = hand === 'left' ? GAME_WIDTH * 0.05 : GAME_WIDTH * 0.95;
        const ctrlX = hand === 'left' ? GAME_WIDTH * 0.2 : GAME_WIDTH * 0.8;
        const hookPath = new Phaser.Curves.Path(fist.x, fist.y);
        hookPath.cubicBezierTo(
          sideX, GAME_HEIGHT * 0.5,
          ctrlX, TARGET_Y,
          targetX, TARGET_Y
        );

        const hookFollower = { t: 0 };
        this.tweens.add({
          targets: hookFollower,
          t: 1,
          duration: 120,
          ease: 'Power2',
          onUpdate: () => {
            const point = hookPath.getPoint(hookFollower.t);
            fist.setPosition(point.x, point.y);
          },
          onComplete: () => {
            this.tweens.add({
              targets: fist,
              x: restX,
              y: FIST_Y,
              duration: 150,
              ease: 'Power1',
            });
          },
        });
        break;
      }

      case PunchType.Uppercut:
        // From below upward into face
        this.tweens.add({
          targets: fist,
          x: GAME_WIDTH / 2,
          y: TARGET_Y - 30,
          duration: 130,
          ease: 'Power3',
          onComplete: () => {
            this.tweens.add({
              targets: fist,
              x: restX,
              y: FIST_Y,
              duration: 180,
              ease: 'Power1',
            });
          },
        });
        break;

      case PunchType.Cross:
        // Body shot — fist goes to midsection
        this.tweens.add({
          targets: fist,
          x: GAME_WIDTH / 2,
          y: GAME_HEIGHT * 0.45,
          duration: 110,
          yoyo: true,
          hold: 40,
          ease: 'Power2',
        });
        break;

      case PunchType.Special:
        // Both fists converge on AI
        this.tweens.add({
          targets: this.leftFist,
          x: GAME_WIDTH * 0.4,
          y: TARGET_Y,
          duration: 150,
          yoyo: true,
          hold: 50,
        });
        this.tweens.add({
          targets: this.rightFist,
          x: GAME_WIDTH * 0.6,
          y: TARGET_Y,
          duration: 150,
          yoyo: true,
          hold: 50,
        });
        break;
    }
  }

  // ============================================================
  // Fist graphics (placeholder claymation gloves)
  // ============================================================

  private createFistTextures(): void {
    // Textures are generated procedurally — no external assets needed
  }

  private createFistGraphic(x: number, y: number, angleDeg: number, key: string): void {
    const container = this.add.container(x, y).setDepth(21);
    container.setAngle(angleDeg);

    // Wrist / arm stub
    const wrist = this.add.rectangle(0, FIST_H * 0.4, FIST_W * 0.5, 30, 0xE8985E);
    container.add(wrist);

    // Main fist body — rounded
    const fistBody = this.add.rectangle(0, 0, FIST_W, FIST_H, 0xF4A460);
    fistBody.setStrokeStyle(2, 0xD2893C);
    container.add(fistBody);

    // Knuckle ridge — darker strip across the top
    const knuckles = this.add.rectangle(0, -FIST_H * 0.3, FIST_W * 0.85, 14, 0xE8985E);
    container.add(knuckles);

    // Individual knuckle bumps
    for (let i = 0; i < 4; i++) {
      const kx = -FIST_W * 0.3 + i * (FIST_W * 0.2);
      const bump = this.add.circle(kx, -FIST_H * 0.3, 5, 0xDC8750);
      container.add(bump);
    }

    // Thumb
    const thumb = this.add.ellipse(
      angleDeg > 0 ? FIST_W * 0.35 : -FIST_W * 0.35,
      FIST_H * 0.05,
      14, 22, 0xF4A460
    );
    thumb.setStrokeStyle(1, 0xD2893C);
    container.add(thumb);

    // Glove tape wrapping — white strips
    const tape1 = this.add.rectangle(0, FIST_H * 0.15, FIST_W * 0.9, 4, 0xEEEEEE);
    tape1.setAlpha(0.6);
    container.add(tape1);

    const tape2 = this.add.rectangle(0, FIST_H * 0.25, FIST_W * 0.85, 3, 0xEEEEEE);
    tape2.setAlpha(0.4);
    container.add(tape2);

    if (key === 'leftFistGfx') {
      this.leftFistGfx = container;
    } else {
      this.rightFistGfx = container;
    }
  }

  // ============================================================
  // Dodge — first-person camera lean
  // ============================================================

  private onDodge(event: { direction: 'left' | 'right' }): void {
    if (this.currentState === BattleState.KO || this.currentState === BattleState.Defeat) return;

    const dir = event.direction === 'left' ? -1 : 1;

    // Camera leans to the side
    this.tweens.add({
      targets: this.cameras.main,
      scrollX: dir * -60,
      duration: 100,
      ease: 'Power2',
      onComplete: () => {
        this.tweens.add({
          targets: this.cameras.main,
          scrollX: 0,
          duration: 200,
          ease: 'Power1',
        });
      },
    });

    // Fists follow the dodge
    this.tweens.add({
      targets: [this.leftFist, this.rightFist],
      x: `+=${dir * 50}`,
      duration: 100,
      yoyo: true,
      hold: 50,
    });

    if (this.telegraphActive) {
      // Successful dodge
      this.telegraphActive = false;
      this.clearTelegraph();
      this.aiOpponent.stop();

      this.juiceManager.onDodgeSuccess();

      // Green vignette flash for successful dodge
      this.showDodgeVignette();

      // Counter window
      this.counterWindowActive = true;
      this.counterWindowTimer = this.time.delayedCall(COUNTER_WINDOW, () => {
        this.counterWindowActive = false;
      });
    }
  }

  private showDodgeVignette(): void {
    const gfx = this.add.graphics().setDepth(45);
    const w = GAME_WIDTH;
    const h = GAME_HEIGHT;
    const thickness = 40;

    gfx.fillStyle(0x33CC33, 0.4);
    // Top edge
    gfx.fillRect(0, 0, w, thickness);
    // Bottom edge
    gfx.fillRect(0, h - thickness, w, thickness);
    // Left edge
    gfx.fillRect(0, 0, thickness, h);
    // Right edge
    gfx.fillRect(w - thickness, 0, thickness, h);

    this.tweens.add({
      targets: gfx,
      alpha: 0,
      duration: 400,
      ease: 'Power2',
      onComplete: () => gfx.destroy(),
    });
  }

  // ============================================================
  // Block — fists rise as shield
  // ============================================================

  private onBlock(hand: 'left' | 'right'): void {
    if (this.currentState === BattleState.KO || this.currentState === BattleState.Defeat) return;

    const fist = hand === 'left' ? this.leftFist : this.rightFist;

    // Fist rises to guard position
    this.tweens.add({
      targets: fist,
      y: GAME_HEIGHT * 0.5,
      x: hand === 'left' ? GAME_WIDTH * 0.3 : GAME_WIDTH * 0.7,
      duration: 80,
      ease: 'Power2',
    });

    // Camera tilts forward slightly (bracing for impact)
    this.tweens.add({
      targets: this.cameras.main,
      angle: -2,
      duration: 100,
    });
  }

  private onBlockRelease(): void {
    // Return fists to rest position
    this.tweens.add({
      targets: this.leftFist,
      x: LEFT_FIST_X,
      y: FIST_Y,
      duration: 150,
      ease: 'Power1',
    });
    this.tweens.add({
      targets: this.rightFist,
      x: RIGHT_FIST_X,
      y: FIST_Y,
      duration: 150,
      ease: 'Power1',
    });

    // Camera returns to normal
    this.tweens.add({
      targets: this.cameras.main,
      angle: 0,
      duration: 150,
    });
  }

  // ============================================================
  // Enemy telegraph
  // ============================================================

  private onEnemyTelegraph(data: { type: PunchType; duration: number }): void {
    if (this.currentState === BattleState.KO || this.currentState === BattleState.Defeat) return;

    this.telegraphActive = true;

    // Red glow around AI
    this.telegraphGfx = this.add.graphics().setDepth(8);
    this.telegraphGfx.fillStyle(0xff0000, 0.2);
    this.telegraphGfx.fillRect(AI_X - AI_W / 2 - 10, AI_Y - AI_H / 2 - 10, AI_W + 20, AI_H + 20);

    this.telegraphTween = this.tweens.add({
      targets: this.telegraphGfx,
      alpha: 0.05,
      duration: 250,
      yoyo: true,
      repeat: -1,
    });

    // DODGE hint
    this.dodgeHintText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.65, 'SWIPE TO DODGE!', {
        fontSize: '20px',
        color: '#FF6666',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(40);

    void data;
  }

  // ============================================================
  // Enemy attack — camera shake (first-person hit)
  // ============================================================

  private onEnemyAttack(data: {
    type: PunchType;
    power: number;
    damageMultiplier: number;
  }): void {
    if (this.currentState === BattleState.KO || this.currentState === BattleState.Defeat) return;

    this.telegraphActive = false;
    this.clearTelegraph();

    const aiStats = {
      health: this.aiHealth,
      maxHealth: this.aiMaxHealth,
      stamina: this.archetypeConfig.maxStamina,
      maxStamina: this.archetypeConfig.maxStamina,
      strength: this.archetypeConfig.strength,
      speed: this.archetypeConfig.speed,
      defense: this.archetypeConfig.defense,
      momentum: 50,
    };

    const playerStats = {
      health: this.playerHealth,
      maxHealth: this.playerMaxHealth,
      stamina: this.playerStamina,
      maxStamina: 100,
      strength: 80,
      speed: 70,
      defense: 50,
      momentum: this.playerMomentum,
    };

    const punch: PunchEvent = {
      type: data.type,
      power: data.power,
      direction: 'left',
      hand: 'left',
      comboPosition: 0,
    };

    const result = DamageCalculator.calculate(punch, aiStats, playerStats, false, false, 50);
    const finalDamage = Math.round(result.damage * data.damageMultiplier * this.adaptiveModifier);

    this.playerHealth = Math.max(0, this.playerHealth - finalDamage);
    this.tookNoDamage = false;
    this.playerMomentum = Math.max(0, this.playerMomentum - MOMENTUM_DAMAGE_LOSS);

    this.comboManager.registerTakeDamage();
    this.juiceManager.hideComboText();

    // First-person: AI attack animation + camera impact + damage vignette
    this.aiAttackAnimation(data.type);
    this.cameraImpact(data.type);
    this.juiceManager.onPlayerDamage(finalDamage, this.playerHealth, this.playerMaxHealth);

    // Dizzy check (below 20% health)
    const healthRatio = this.playerHealth / this.playerMaxHealth;
    if (healthRatio > 0 && healthRatio < 0.2 && !this.isDizzy) {
      this.startDizzySway();
    }

    this.emitHUDUpdate();

    if (this.playerHealth <= 0) {
      this.checkPlayerKO();
    }
  }

  // ============================================================
  // Special abilities
  // ============================================================

  private onBearStare(): void {
    if (this.currentState === BattleState.KO || this.currentState === BattleState.Defeat) return;

    const stareText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.3, 'BEAR STARE!', {
        fontSize: '32px',
        color: '#FF4444',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(45);

    this.cameras.main.shake(300, 0.008);

    this.tweens.add({
      targets: stareText,
      alpha: 0,
      scale: 1.5,
      duration: 1200,
      onComplete: () => stareText.destroy(),
    });
  }

  private onIntimidation(): void {
    if (this.currentState === BattleState.KO || this.currentState === BattleState.Defeat) return;

    const prevState = this.currentState;
    this.currentState = BattleState.Animating;

    // AI looms closer
    this.tweens.add({
      targets: this.ai,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 500,
      yoyo: true,
    });

    const intimidText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.3, 'INTIMIDATION!', {
        fontSize: '28px',
        color: '#9933FF',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(45);

    this.cameras.main.shake(500, 0.005);

    this.tweens.add({
      targets: intimidText,
      alpha: 0,
      duration: 2000,
      onComplete: () => {
        intimidText.destroy();
        if (this.currentState === BattleState.Animating) {
          this.currentState = prevState;
        }
      },
    });
  }

  private onSpecialCharge(): void {
    if (this.specialMeter >= 100) {
      this.executeSpecialMove();
    }
  }

  private executeSpecialMove(): void {
    this.specialMeter = 0;
    this.specialUsed = true;
    this.currentState = BattleState.SpecialExecuting;

    this.time.timeScale = 0.3;
    this.cameras.main.shake(600, 0.02);

    // Both fists animate
    this.animateFistPunch(PunchType.Special, 'right');

    const specialText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.25, 'SPECIAL MOVE!', {
        fontSize: '40px',
        color: '#FFD700',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setScale(0.3)
      .setDepth(50);

    this.tweens.add({
      targets: specialText,
      scale: 1.5,
      duration: 400,
      ease: 'Back.easeOut',
    });

    const specialDamage = 40;
    this.aiHealth = Math.max(0, this.aiHealth - specialDamage);

    const flash = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xFFD700)
      .setAlpha(0.5)
      .setDepth(48);

    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy(),
    });

    this.tweens.add({
      targets: this.ai,
      scaleX: 0.85,
      scaleY: 0.85,
      y: this.ai.y + 20,
      duration: 200,
      yoyo: true,
    });

    const specialPunch: PunchEvent = {
      type: PunchType.Special,
      power: 1.0,
      direction: 'right',
      hand: 'right',
      comboPosition: 0,
    };
    this.facePartManager.checkAndDetach(this.aiHealth, this.aiMaxHealth, specialPunch);

    this.time.delayedCall(800, () => {
      this.time.timeScale = 1.0;
      specialText.destroy();
      this.emitHUDUpdate();

      if (this.aiHealth <= 0) {
        this.checkAIKO();
      } else {
        this.currentState = BattleState.PlayerTurn;
      }
    });
  }

  // ============================================================
  // KO checks
  // ============================================================

  private checkAIKO(): void {
    this.currentState = BattleState.KO;

    const koPunch: PunchEvent = {
      type: PunchType.Uppercut,
      power: 1.0,
      direction: this.lastPunch?.direction ?? 'right',
      hand: this.lastPunch?.hand ?? 'right',
      comboPosition: 0,
    };
    this.facePartManager.detachAll(koPunch);

    this.juiceManager.onKO();
    this.aiOpponent.stop();

    // AI falls backward
    this.tweens.add({
      targets: this.ai,
      y: this.ai.y + 100,
      scaleY: 0.5,
      alpha: 0.5,
      duration: 600,
      ease: 'Power2',
    });

    this.time.delayedCall(800, () => {
      const timeSeconds = (Date.now() - this.fightStartTime) / 1000;
      const result = this.buildBattleResult('player', timeSeconds);

      updateAfterFight(result, this.archetype, this.difficulty).catch(() => {});

      this.scene.stop('HUDScene');
      this.scene.start('KOScene', { result });
    });
  }

  private checkPlayerKO(): void {
    this.currentState = BattleState.Defeat;
    this.aiOpponent.stop();
    this.stopDizzySway();

    // First-person KO: camera falls and rotates
    this.cameras.main.shake(300, 0.025);

    // Fists drop
    this.tweens.add({
      targets: [this.leftFist, this.rightFist],
      y: GAME_HEIGHT + 50,
      alpha: 0,
      duration: 600,
    });

    // Camera falls down and tilts
    this.tweens.add({
      targets: this.cameras.main,
      scrollY: -120,
      duration: 1200,
      ease: 'Bounce.easeOut',
    });
    this.tweens.add({
      targets: this.cameras.main,
      angle: 12,
      duration: 1000,
      ease: 'Power2',
    });

    // Fade to black
    this.time.delayedCall(800, () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
    });

    this.time.delayedCall(1400, () => {
      const timeSeconds = (Date.now() - this.fightStartTime) / 1000;
      const result = this.buildBattleResult('ai', timeSeconds);

      updateAfterFight(result, this.archetype, this.difficulty).catch(() => {});

      this.scene.stop('HUDScene');
      this.scene.start('DefeatScene', { archetype: this.archetype });
    });
  }

  // ============================================================
  // Build result
  // ============================================================

  private buildBattleResult(
    winner: 'player' | 'ai',
    timeSeconds: number
  ): BattleResult {
    const baseDamageScore = (this.aiMaxHealth - this.aiHealth) * 10;
    const comboBonus = this.comboManager.getMaxCombo() * 50;
    const timeBonus = timeSeconds < STAR_TWO_TIME_LIMIT ? Math.round((STAR_TWO_TIME_LIMIT - timeSeconds) * 5) : 0;
    const counterBonus = this.totalCounterHits * 100;
    const noDamageBonus = this.tookNoDamage ? 500 : 0;
    const partsDetachedBonus = this.totalPartsDetached * 75;
    const totalScore = baseDamageScore + comboBonus + timeBonus + counterBonus + noDamageBonus + partsDetachedBonus;

    const scoreBreakdown: ScoreBreakdown = {
      baseDamageScore,
      comboBonus,
      timeBonus,
      counterBonus,
      noDamageBonus,
      partsDetachedBonus,
      totalScore,
    };

    return {
      winner,
      timeSeconds: Math.round(timeSeconds),
      playerDamageDealt: this.aiMaxHealth - this.aiHealth,
      highestCombo: this.comboManager.getMaxCombo(),
      specialUsed: this.specialUsed,
      partsDetached: this.totalPartsDetached,
      tookNoDamage: this.tookNoDamage,
      counterHits: this.totalCounterHits,
      scoreBreakdown,
    };
  }

  // ============================================================
  // AI attack animation (first-person — opponent lunges at you)
  // ============================================================

  private aiAttackAnimation(punchType: PunchType): void {
    switch (punchType) {
      case PunchType.Jab:
        // Fist comes straight at you — scale up quickly
        this.tweens.add({
          targets: this.ai,
          scaleX: 1.15,
          scaleY: 1.15,
          duration: 100,
          yoyo: true,
          hold: 20,
          ease: 'Power2',
        });
        break;

      case PunchType.Hook: {
        // Swings from the side — move laterally and scale up
        const hookDir = Math.random() > 0.5 ? -40 : 40;
        this.tweens.add({
          targets: this.ai,
          x: this.ai.x + hookDir,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 120,
          yoyo: true,
          hold: 30,
          ease: 'Power2',
        });
        break;
      }

      case PunchType.Uppercut:
        // Fist comes from below — AI moves up and scales big
        this.tweens.add({
          targets: this.ai,
          y: this.ai.y - 60,
          scaleX: 1.3,
          scaleY: 1.3,
          duration: 130,
          ease: 'Power3',
          onComplete: () => {
            this.tweens.add({
              targets: this.ai,
              y: AI_Y,
              scaleX: 1,
              scaleY: 1,
              duration: 250,
              ease: 'Power1',
            });
          },
        });
        break;

      case PunchType.Cross:
        // Body blow — slight forward lunge
        this.tweens.add({
          targets: this.ai,
          scaleX: 1.08,
          scaleY: 1.08,
          y: this.ai.y + 15,
          duration: 100,
          yoyo: true,
          hold: 20,
          ease: 'Power2',
        });
        break;

      default:
        // Generic lunge
        this.tweens.add({
          targets: this.ai,
          scaleX: 1.12,
          scaleY: 1.12,
          duration: 100,
          yoyo: true,
          ease: 'Power2',
        });
        break;
    }
  }

  // ============================================================
  // Camera impact (first-person)
  // ============================================================

  private cameraImpact(punchType: PunchType): void {
    const cam = this.cameras.main;

    switch (punchType) {
      case PunchType.Jab:
        // Head snaps to the side
        this.tweens.add({
          targets: cam,
          scrollX: -15,
          duration: 40,
          yoyo: true,
          hold: 10,
          ease: 'Power2',
        });
        break;

      case PunchType.Hook:
        // Head rotates from the hook impact
        cam.setAngle(0);
        this.tweens.add({
          targets: cam,
          angle: 8,
          duration: 80,
          yoyo: true,
          hold: 20,
          ease: 'Power2',
        });
        break;

      case PunchType.Uppercut:
        // Head snaps upward and bounces back
        this.tweens.add({
          targets: cam,
          scrollY: 30,
          duration: 80,
          ease: 'Power3',
          onComplete: () => {
            this.tweens.add({
              targets: cam,
              scrollY: 0,
              duration: 300,
              ease: 'Bounce.easeOut',
            });
          },
        });
        break;

      case PunchType.Cross:
        // Body shot — camera dips down slightly
        this.tweens.add({
          targets: cam,
          scrollY: -10,
          duration: 60,
          yoyo: true,
          ease: 'Power2',
        });
        break;

      default:
        cam.shake(150, 0.012);
        break;
    }
  }

  // ============================================================
  // Dizzy sway (below 20% health)
  // ============================================================

  private startDizzySway(): void {
    if (this.isDizzy) return;
    this.isDizzy = true;

    this.dizzySway = this.tweens.add({
      targets: this.cameras.main,
      angle: { from: -1.5, to: 1.5 },
      scrollX: { from: -5, to: 5 },
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private stopDizzySway(): void {
    if (!this.isDizzy) return;
    this.isDizzy = false;
    this.dizzySway?.stop();
    this.dizzySway = undefined;
    this.cameras.main.setAngle(0);
    this.cameras.main.setScroll(0, 0);
  }

  // ============================================================
  // HUD
  // ============================================================

  private emitHUDUpdate(): void {
    const timeElapsed = (Date.now() - this.fightStartTime) / 1000;
    this.game.events.emit('hud_update', {
      playerHealth: this.playerHealth,
      playerMaxHealth: this.playerMaxHealth,
      opponentHealth: this.aiHealth,
      opponentMaxHealth: this.aiMaxHealth,
      comboCount: this.comboManager.getComboCount(),
      momentum: this.playerMomentum,
      timeElapsed,
      score: 0,
      specialMeter: this.specialMeter,
    });
  }

  // ============================================================
  // Telegraph cleanup
  // ============================================================

  private clearTelegraph(): void {
    this.telegraphTween?.stop();
    this.telegraphGfx?.destroy();
    this.telegraphGfx = undefined;
    this.telegraphTween = undefined;
    this.dodgeHintText?.destroy();
    this.dodgeHintText = undefined;
  }

  // ============================================================
  // Cleanup
  // ============================================================

  shutdown(): void {
    this.tapZoneManager.destroy();
    this.facePartManager.destroy();
    this.juiceManager.destroy();
    this.comboManager.destroy();
    this.aiOpponent.destroy();
    this.clearTelegraph();
    this.stopDizzySway();
    this.leftFistGfx?.destroy();
    this.rightFistGfx?.destroy();
    this.counterWindowTimer?.destroy();
    this.scene.stop('HUDScene');
    this.events.removeAllListeners();
  }
}
