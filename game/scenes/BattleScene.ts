import { CharacterArchetype } from '../../types/character';
import { BattleState, PunchType } from '../../types/battle';
import type { PunchEvent, BattleResult, ScoreBreakdown } from '../../types/battle';
import { ARCHETYPE_STATS } from '../constants';
import type { ArchetypeConfig } from '../constants';
import {
  COUNTER_WINDOW,
  TELEGRAPH_DURATION,
  MOMENTUM_HIT_GAIN,
  MOMENTUM_DAMAGE_LOSS,
  MOMENTUM_MISS_LOSS,
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

export class BattleScene extends Phaser.Scene {
  // --- Managers ---
  private tapZoneManager!: TapZoneManager;
  private facePartManager!: FacePartManager;
  private juiceManager!: JuiceManager;
  private comboManager!: ComboManager;
  private aiOpponent!: AIOpponent;

  // --- Game objects ---
  private player!: Phaser.GameObjects.Rectangle;
  private ai!: Phaser.GameObjects.Rectangle;

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

    // --- Fighter placeholders ---
    const playerX = GAME_WIDTH * 0.25;
    const playerY = GAME_HEIGHT * 0.6;
    const aiX = GAME_WIDTH * 0.75;
    const aiY = GAME_HEIGHT * 0.6;
    this.player = this.add.rectangle(playerX, playerY, 80, 160, 0x3366ff).setDepth(10);
    this.ai = this.add.rectangle(aiX, aiY, 80, 160, 0xcc3333).setDepth(10);

    // --- Managers ---
    this.tapZoneManager = new TapZoneManager(this);
    this.facePartManager = new FacePartManager(this, aiX, aiY - 40);
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

    // AI update
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

    // Arena degradation
    const aiHealthPercent = this.aiHealth / this.aiMaxHealth;
    this.juiceManager.onArenaDegrade(aiHealthPercent);

    // Periodic HUD update (every 200ms)
    this.hudUpdateTimer += delta;
    if (this.hudUpdateTimer > 200) {
      this.hudUpdateTimer = 0;
      this.emitHUDUpdate();
    }
  }

  // ============================================================
  // Player punch
  // ============================================================

  private onPlayerPunch(event: PunchEvent): void {
    if (this.currentState !== BattleState.PlayerTurn) return;

    this.currentState = BattleState.Animating;
    this.lastPunch = event;
    this.lastPunchTime = Date.now();

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

    // Build stats for damage calc
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

    // Override combo position
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

    // Momentum gain
    this.playerMomentum = Math.min(100, this.playerMomentum + MOMENTUM_HIT_GAIN);

    // Special meter charge
    this.specialMeter = Math.min(100, this.specialMeter + 5 + (isCounter ? 10 : 0));

    // Juice
    this.juiceManager.onPunchHit(this.ai.x, this.ai.y - 40, result, event.type);

    // Face part detach
    if (result.triggerDetach && result.partName) {
      this.facePartManager.checkAndDetach(this.aiHealth, this.aiMaxHealth, punchWithCombo);
    }

    // Counter feedback
    if (isCounter) {
      const counterText = this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, 'COUNTER!', {
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

    // Animate AI hit
    const dir = event.direction === 'left' ? -25 : 25;
    this.tweens.add({
      targets: this.ai,
      x: this.ai.x + dir,
      duration: 75,
      yoyo: true,
    });

    // Update face part container position
    this.facePartManager.updateContainerPosition(this.ai.x, this.ai.y - 40);

    this.emitHUDUpdate();

    // Check KO
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
  // Dodge
  // ============================================================

  private onDodge(event: { direction: 'left' | 'right' }): void {
    if (this.currentState === BattleState.KO || this.currentState === BattleState.Defeat) return;

    const dir = event.direction === 'left' ? -30 : 30;
    this.tweens.add({
      targets: this.player,
      x: this.player.x + dir,
      duration: 100,
      yoyo: true,
    });

    if (this.telegraphActive) {
      // Successful dodge
      this.telegraphActive = false;
      this.clearTelegraph();
      this.aiOpponent.stop();

      this.juiceManager.onDodgeSuccess();

      // Counter window
      this.counterWindowActive = true;
      this.counterWindowTimer = this.time.delayedCall(COUNTER_WINDOW, () => {
        this.counterWindowActive = false;
      });

      // Re-enable AI after counter window
      this.time.delayedCall(COUNTER_WINDOW + 200, () => {
        if (this.currentState !== BattleState.KO && this.currentState !== BattleState.Defeat) {
          // AI will resume via its own update loop
        }
      });
    }
  }

  // ============================================================
  // Enemy telegraph
  // ============================================================

  private onEnemyTelegraph(data: { type: PunchType; duration: number }): void {
    if (this.currentState === BattleState.KO || this.currentState === BattleState.Defeat) return;

    this.telegraphActive = true;

    // Red glow on AI
    this.telegraphGfx = this.add.graphics().setDepth(8);
    this.telegraphGfx.fillStyle(0xff0000, 0.25);
    this.telegraphGfx.fillRect(this.ai.x - 50, this.ai.y - 90, 100, 180);

    this.telegraphTween = this.tweens.add({
      targets: this.telegraphGfx,
      alpha: 0.05,
      duration: 300,
      yoyo: true,
      repeat: -1,
    });

    // DODGE hint
    this.dodgeHintText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 80, 'DODGE!', {
        fontSize: '18px',
        color: '#FF6666',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(40);

    void data;
  }

  // ============================================================
  // Enemy attack (after telegraph completes)
  // ============================================================

  private onEnemyAttack(data: {
    type: PunchType;
    power: number;
    damageMultiplier: number;
  }): void {
    if (this.currentState === BattleState.KO || this.currentState === BattleState.Defeat) return;

    this.telegraphActive = false;
    this.clearTelegraph();

    // Calculate AI damage to player
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
      comboPosition: 0,
    };

    const result = DamageCalculator.calculate(punch, aiStats, playerStats, false, false, 50);
    const finalDamage = Math.round(result.damage * data.damageMultiplier * this.adaptiveModifier);

    this.playerHealth = Math.max(0, this.playerHealth - finalDamage);
    this.tookNoDamage = false;

    // Momentum loss
    this.playerMomentum = Math.max(0, this.playerMomentum - MOMENTUM_DAMAGE_LOSS);

    // Break combo
    this.comboManager.registerTakeDamage();
    this.juiceManager.hideComboText();

    // Animate player hit
    this.tweens.add({
      targets: this.player,
      x: this.player.x - 20,
      duration: 75,
      yoyo: true,
    });

    this.emitHUDUpdate();

    // Check player KO
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
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'BEAR STARE!', {
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

    const intimidText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'INTIMIDATION!', {
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

    // Dramatic slow-mo
    this.time.timeScale = 0.3;
    this.cameras.main.shake(600, 0.02);

    const specialText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, 'SPECIAL MOVE!', {
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

    // Big damage
    const specialDamage = 40;
    this.aiHealth = Math.max(0, this.aiHealth - specialDamage);

    // Screen flash
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

    // AI knockback
    this.tweens.add({
      targets: this.ai,
      x: this.ai.x + 40,
      duration: 200,
      yoyo: true,
    });

    // Face part check
    const specialPunch: PunchEvent = {
      type: PunchType.Special,
      power: 1.0,
      direction: 'right',
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

    // Detach all parts
    const koPunch: PunchEvent = {
      type: PunchType.Uppercut,
      power: 1.0,
      direction: this.lastPunch?.direction ?? 'right',
      comboPosition: 0,
    };
    this.facePartManager.detachAll(koPunch);

    this.juiceManager.onKO();
    this.aiOpponent.stop();

    this.time.delayedCall(800, () => {
      const timeSeconds = (Date.now() - this.fightStartTime) / 1000;
      const result = this.buildBattleResult('player', timeSeconds);

      // Save async — don't block scene transition
      updateAfterFight(result, this.archetype, this.difficulty).catch(() => {
        // Supabase may not be configured — continue anyway
      });

      this.scene.stop('HUDScene');
      this.scene.start('KOScene', { result });
    });
  }

  private checkPlayerKO(): void {
    this.currentState = BattleState.Defeat;
    this.aiOpponent.stop();

    this.cameras.main.shake(400, 0.015);

    this.time.delayedCall(600, () => {
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
    this.counterWindowTimer?.destroy();
    this.scene.stop('HUDScene');
    this.events.removeAllListeners();
  }
}
