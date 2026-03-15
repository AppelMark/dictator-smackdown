import { CharacterArchetype } from '../../types/character';
import { PunchType } from '../../types/battle';
import { TELEGRAPH_DURATION } from '../constants';

export class AIOpponent {
  private scene: Phaser.Scene;
  private archetype: CharacterArchetype;
  private difficultyLevel: 1 | 2 | 3;
  private adaptiveModifier: number;

  private attackTimer: number = 0;
  private nextAttackDelay: number = 2000;
  private telegraphActive: boolean = false;
  private telegraphTimer?: Phaser.Time.TimerEvent;
  private lastPlayerMoves: PunchType[] = [];

  private attackCount: number = 0;
  private elapsedTime: number = 0;
  private lastBearStareTime: number = 0;
  private lastIntimidationTime: number = 0;
  private nextAttackMultiplier: number = 1.0;

  constructor(
    scene: Phaser.Scene,
    archetype: CharacterArchetype,
    difficultyLevel: 1 | 2 | 3,
    adaptiveModifier: number
  ) {
    this.scene = scene;
    this.archetype = archetype;
    this.difficultyLevel = difficultyLevel;
    this.adaptiveModifier = adaptiveModifier;
    this.attackTimer = 1500;
  }

  update(
    delta: number,
    aiHealth: number,
    playerHealth: number,
    aiMomentum: number
  ): void {
    if (this.telegraphActive) return;

    this.elapsedTime += delta;
    this.attackTimer -= delta;

    if (this.attackTimer <= 0) {
      this.decideAction(aiHealth, playerHealth, aiMomentum);
      this.attackTimer = this.nextAttackDelay;
    }
  }

  private decideAction(
    aiHealth: number,
    _playerHealth: number,
    _aiMomentum: number
  ): void {
    let punchType: PunchType | null = null;

    switch (this.archetype) {
      case CharacterArchetype.DerGroszer:
        punchType = this.decideDerGroszer(aiHealth);
        break;
      case CharacterArchetype.TheDon:
        punchType = this.decideTheDon();
        break;
      case CharacterArchetype.TheNationalist:
        punchType = this.decideTheNationalist();
        break;
      case CharacterArchetype.TheChairman:
        punchType = this.decideTheChairman();
        break;
      case CharacterArchetype.TheAyatollah:
        punchType = this.decideTheAyatollah();
        break;
      case CharacterArchetype.TheGeneralissimo:
        punchType = this.decideTheGeneralissimo();
        break;
      default:
        punchType = this.randomPunchType();
        break;
    }

    if (punchType !== null) {
      this.startTelegraph(punchType);
    }
  }

  // ---- Per-archetype AI ----

  private decideDerGroszer(aiHealth: number): PunchType | null {
    const healthRatio = aiHealth / 120;

    if (healthRatio < 0.35) {
      this.setNextDelay(1600 * this.adaptiveModifier);
    } else {
      this.setNextDelay(2800 * this.adaptiveModifier);
    }

    // Bear stare every 15 seconds
    if (this.elapsedTime - this.lastBearStareTime > 15000) {
      this.lastBearStareTime = this.elapsedTime;
      this.triggerBearStare();
    }

    const roll = Math.random();
    if (roll < 0.10) {
      this.scene.events.emit('ai_catchphrase');
      return null;
    }
    if (roll < 0.40) return PunchType.Hook;
    return PunchType.Uppercut;
  }

  private decideTheDon(): PunchType | null {
    const delay = 700 + Math.random() * 2500;
    this.setNextDelay(delay * this.adaptiveModifier);

    if (Math.random() < 0.15) {
      this.scene.events.emit('ai_catchphrase');
      return null;
    }

    return this.randomPunchType();
  }

  private decideTheNationalist(): PunchType {
    this.setNextDelay(850 * this.adaptiveModifier);

    const roll = Math.random();
    if (roll < 0.50) return PunchType.Jab;
    if (roll < 0.80) return PunchType.Cross;
    return PunchType.Hook;
  }

  private decideTheChairman(): PunchType | null {
    this.setNextDelay(2200 * this.adaptiveModifier);

    const roll = Math.random();
    if (roll < 0.35) {
      this.scene.events.emit('ai_block');
      return null;
    }
    if (roll < 0.75) return PunchType.Jab;
    return PunchType.Cross;
  }

  private decideTheAyatollah(): PunchType | null {
    this.setNextDelay(2500 * this.adaptiveModifier);

    // Counter detection: last 3 moves identical
    if (this.lastPlayerMoves.length >= 3) {
      const last3 = this.lastPlayerMoves.slice(-3);
      if (last3[0] === last3[1] && last3[1] === last3[2]) {
        this.nextAttackMultiplier = 2.0;
        this.setNextDelay(400);
        return PunchType.Uppercut;
      }
    }

    const roll = Math.random();
    if (roll < 0.30) return PunchType.Cross;
    if (roll < 0.60) return PunchType.Jab;
    return null;
  }

  private decideTheGeneralissimo(): PunchType | null {
    this.setNextDelay(3800 * this.adaptiveModifier);

    // Intimidation every 12 seconds
    if (this.elapsedTime - this.lastIntimidationTime > 12000) {
      this.lastIntimidationTime = this.elapsedTime;
      this.triggerIntimidation();
    }

    this.attackCount++;

    // Every 5th attack is Special
    if (this.attackCount % 5 === 0) {
      return PunchType.Special;
    }

    const roll = Math.random();
    if (roll < 0.70) return PunchType.Uppercut;
    return null;
  }

  // ---- Telegraph and attack ----

  private startTelegraph(punchType: PunchType): void {
    this.telegraphActive = true;

    const difficultyScale = 2 - this.difficultyLevel * 0.15;
    const telegraphDuration = TELEGRAPH_DURATION * difficultyScale * this.adaptiveModifier;

    this.scene.events.emit('enemy_telegraph', {
      type: punchType,
      duration: telegraphDuration,
    });

    this.telegraphTimer = this.scene.time.delayedCall(telegraphDuration, () => {
      this.telegraphActive = false;

      this.scene.events.emit('enemy_attack', {
        type: punchType,
        power: 0.7 + Math.random() * 0.3,
        damageMultiplier: this.nextAttackMultiplier,
      });

      this.nextAttackMultiplier = 1.0;
    });
  }

  // ---- Special abilities ----

  private triggerBearStare(): void {
    this.scene.events.emit('bear_stare');
    this.nextAttackMultiplier = 2.0;
  }

  private triggerIntimidation(): void {
    this.scene.events.emit('intimidation');
    // Freeze handled by BattleScene listening to this event
  }

  // ---- Player move tracking ----

  registerPlayerMove(punchType: PunchType): void {
    this.lastPlayerMoves.push(punchType);
    if (this.lastPlayerMoves.length > 5) {
      this.lastPlayerMoves.splice(0, this.lastPlayerMoves.length - 5);
    }
  }

  // ---- Helpers ----

  private setNextDelay(ms: number): void {
    this.nextAttackDelay = ms;
  }

  private randomPunchType(): PunchType {
    const types = [PunchType.Jab, PunchType.Cross, PunchType.Hook, PunchType.Uppercut];
    return types[Math.floor(Math.random() * types.length)];
  }

  stop(): void {
    this.telegraphTimer?.destroy();
    this.telegraphActive = false;
  }

  destroy(): void {
    this.stop();
  }
}
