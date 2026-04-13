import { FallingItem } from "@entities/FallingItem";
import { Shield } from "@entities/Shield";
import {
  ABYSS,
  COLOR,
  COMBO,
  FONT,
  GAME_WIDTH,
  GAME_HEIGHT,
  GLOW,
  HUD,
  JUICE,
  LIVES,
  TEXTURE_KEY,
  THREAT,
  TYPO,
} from "@config/constants";
import { DifficultyManager } from "@systems/DifficultyManager";
import { Scanner } from "@systems/Scanner";
import { Spawner } from "@systems/Spawner";

export class GameScene extends Phaser.Scene {
  private shield!: Shield;
  private spawner!: Spawner;
  private scanner!: Scanner;
  private difficulty!: DifficultyManager;

  private isRunning = false;
  private score = 0;
  private displayedScore = 0;
  private lives = LIVES.INITIAL;
  private dataLeakCounter = 0;

  private combo = 0;
  private multiplier = 1;
  private lastCatchTime = 0;
  private maxCombo = 0;
  private prevTierIndex = -1;
  private prevMultiplier = 1;

  private scoreText!: Phaser.GameObjects.Text;
  private scoreTween?: Phaser.Tweens.Tween;
  private hearts: Phaser.GameObjects.Image[] = [];
  private scannerBarTrack!: Phaser.GameObjects.Graphics;
  private scannerBarFill!: Phaser.GameObjects.Graphics;
  private comboText!: Phaser.GameObjects.Text;
  private multiplierText!: Phaser.GameObjects.Text;

  private abyssGlow!: Phaser.GameObjects.Image;
  private abyssVoid!: Phaser.GameObjects.Image;
  private abyssVortexGfx!: Phaser.GameObjects.Graphics;
  private abyssRing!: Phaser.GameObjects.Image;
  private abyssGroundGlow!: Phaser.GameObjects.Image;
  private vortexAngle = 0;
  private abyssParticles: { img: Phaser.GameObjects.Image; angle: number; dist: number; speed: number }[] = [];
  private binaryColumns: {
    head: Phaser.GameObjects.Text;
    trail: Phaser.GameObjects.Text;
    speed: number;
  }[] = [];
  private threatVignette!: Phaser.GameObjects.Image;

  constructor() {
    super({ key: "GameScene" });
  }

  create(): void {
    this.isRunning = false;
    this.score = 0;
    this.displayedScore = 0;
    this.lives = LIVES.INITIAL;
    this.dataLeakCounter = 0;
    this.hearts = [];
    this.abyssParticles = [];
    this.binaryColumns = [];
    this.combo = 0;
    this.multiplier = 1;
    this.lastCatchTime = 0;
    this.maxCombo = 0;
    this.prevTierIndex = -1;
    this.prevMultiplier = 1;

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, TEXTURE_KEY.BACKGROUND)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(-1)
      .setAlpha(0.3);

    this.setupAbyssEffects();
    this.setupThreatOverlay();

    this.shield = new Shield(this);
    this.spawner = new Spawner(this);
    this.difficulty = new DifficultyManager();
    this.scanner = new Scanner(
      this,
      () => this.spawner.getActiveItems(),
      () => this.multiplier
    );

    this.scanner.start();
    this.setupHUD();

    this.playOpeningRitual();
  }

  update(time: number, delta: number): void {
    this.updateAbyssPulse();
    this.updateBinaryRain(delta);
    this.scanner.update(delta);

    if (!this.isRunning) return;

    if (this.physics.world.isPaused) {
      this.updateHUD();
      this.updateThreatVignette();
      return;
    }

    this.difficulty.update(delta);
    this.spawner.update(delta, this.difficulty.getConfig());
    this.shield.update();
    this.spawner.syncItemPositions();
    this.processItemInteractions();
    this.updateHUD();
    this.cleanupOffscreenItems();
    this.checkComboDecay(time);
    this.updateThreatVignette();
  }

  private onShieldCatch(item: FallingItem): void {
    if (!item.active) return;

    if (item.isMalware) {
      this.cameras.main.shake(JUICE.SCREEN_SHAKE_MALWARE_MS, JUICE.SCREEN_SHAKE_MALWARE_INTENSITY);
      this.shield.playMalwareFlash();
      this.spawnCatchBurst(item.x, item.y, COLOR.MALWARE_GLITCH, JUICE.MALWARE_CATCH_PARTICLE_COUNT);
      this.loseLife();
    } else {
      this.dataLeakCounter = 0;
      const points = item.getPoints() * this.multiplier;
      this.score += points;
      this.combo++;
      this.lastCatchTime = this.time.now;
      this.updateMultiplier();
      this.shield.playCatchGlow();
      this.spawnCatchBurst(item.x, item.y, ITEM_CONFIGS_MAP[item.type], JUICE.CATCH_PARTICLE_COUNT);
      this.spawnScorePopup(item.x, item.y, points, ITEM_CONFIGS_MAP[item.type]);
      this.animateDisplayedScore();
      this.pulseScoreText();
      this.checkComboMilestone();
    }

    item.destroy();
  }

  private onItemLeak(item: FallingItem): void {
    if (!item.active) return;
    if (item.getData("resolvingLeak")) return;

    item.setData("resolvingLeak", true);

    const body = item.body as Phaser.Physics.Arcade.Body | undefined;
    if (body) {
      body.stop();
      body.enable = false;
    }

    item.setActive(false);

    if (!item.isMalware) {
      this.dataLeakCounter++;
      this.combo = 0;
      this.updateMultiplier();

      this.tweens.add({
        targets: item,
        y: item.y + 20,
        alpha: 0,
        duration: 400,
        onComplete: () => item.destroy(),
      });
      this.spawnCatchBurst(item.x, item.y, COLOR.DARKWEB_GLOW_BOTTOM, 6);

      if (this.dataLeakCounter >= LIVES.DATA_LEAKS_PER_LIFE) {
        this.dataLeakCounter = 0;
        this.loseLife();
      }
    } else {
      item.destroy();
    }
  }

  private loseLife(): void {
    const lostHeartIndex = Math.max(0, this.lives - 1);
    this.lives = Math.max(0, this.lives - 1);
    this.combo = 0;
    this.updateMultiplier();
    this.refreshHearts(lostHeartIndex);
    this.animateHeartLoss(lostHeartIndex);
    this.pulseScoreText(true);

    this.physics.pause();
    this.cameras.main.flash(JUICE.FREEZE_FRAME_MS, 255, 0, 68);
    this.cameras.main.shake(JUICE.SCREEN_SHAKE_LIFE_LOSS_MS, JUICE.SCREEN_SHAKE_LIFE_LOSS_INTENSITY);

    this.time.delayedCall(JUICE.FREEZE_FRAME_MS, () => {
      if (this.lives <= 0) {
        this.gameOver();
      } else {
        this.physics.resume();
      }
    });
  }

  private gameOver(): void {
    this.isRunning = false;
    this.spawner.cleanup();
    this.scanner.cleanup();
    this.scene.start("GameOverScene", { score: this.score, maxCombo: this.maxCombo });
  }

  private spawnCatchBurst(x: number, y: number, color: number, count: number): void {
    const particles = this.add.particles(x, y, TEXTURE_KEY.CATCH_BURST, {
      speed: { min: JUICE.CATCH_PARTICLE_SPEED_MIN, max: JUICE.CATCH_PARTICLE_SPEED_MAX },
      lifespan: JUICE.CATCH_PARTICLE_LIFESPAN,
      quantity: count,
      scale: { start: 0.6, end: 0 },
      tint: color,
      emitting: false,
    });
    particles.setDepth(7);
    particles.explode(count);
    this.time.delayedCall(JUICE.CATCH_PARTICLE_LIFESPAN + 100, () => particles.destroy());
  }

  private spawnScorePopup(x: number, y: number, points: number, itemColor: number): void {
    const cssColor = "#" + itemColor.toString(16).padStart(6, "0");
    const ox = Phaser.Math.Between(-25, 25);
    const popup = this.add.text(x + ox, y, "+" + points, {
      fontSize: TYPO.SUBTITLE,
      fontFamily: FONT.FAMILY,
      fontStyle: "bold",
      color: cssColor,
    }).setOrigin(0.5).setDepth(16).setScale(0.3);

    popup.setShadow(0, 0, cssColor, 14, true, true);

    this.tweens.chain({
      targets: popup,
      tweens: [
        {
          scaleX: { from: 0.3, to: 1.15 },
          scaleY: { from: 0.3, to: 1.15 },
          duration: 120,
          ease: "Back.easeOut",
        },
        {
          y: y - 100,
          alpha: 0,
          scaleX: 1.3,
          scaleY: 1.3,
          duration: 750,
          ease: "Cubic.easeIn",
        },
      ],
      onComplete: () => popup.destroy(),
    });
  }

  private pulseScoreText(isDamage = false): void {
    const pulseColor = isDamage ? "#ff6b88" : "#ffffff";
    const settleColor = isDamage ? COLOR.HUD_TEXT : COLOR.HUD_TEXT;

    this.tweens.killTweensOf(this.scoreText);
    this.scoreText.setColor(pulseColor);
    this.tweens.chain({
      targets: this.scoreText,
      tweens: [
        {
          scaleX: { from: isDamage ? 0.96 : 1, to: isDamage ? 1.05 : 1.12 },
          scaleY: { from: isDamage ? 0.96 : 1, to: isDamage ? 1.05 : 1.12 },
          y: { from: this.scoreText.y, to: this.scoreText.y - 4 },
          duration: 150,
          ease: "Cubic.easeOut",
        },
        {
          scaleX: 1,
          scaleY: 1,
          y: this.scoreText.y,
          duration: 240,
          ease: "Sine.easeOut",
        },
      ],
      onComplete: () => {
        this.scoreText.setColor(settleColor);
      },
    });
  }

  private checkComboMilestone(): void {
    if (COMBO.MILESTONES.includes(this.combo)) {
      this.cameras.main.shake(JUICE.SCREEN_SHAKE_COMBO_MS, JUICE.SCREEN_SHAKE_COMBO_INTENSITY);
    }
  }

  private updateMultiplier(): void {
    const step = Math.floor(this.combo / COMBO.COMBOS_PER_STEP);
    this.multiplier = Math.min(1 + step * COMBO.MULTIPLIER_STEP, COMBO.MAX_MULTIPLIER);
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;
    this.shield.setComboLevel(this.combo);
    this.updateComboDisplay();
  }

  private updateComboDisplay(): void {
    if (this.combo >= 2) {
      const tierIdx = this.getComboTierIndex();
      const tierColor = tierIdx >= 0 ? COMBO.TIERS[tierIdx].color : "#ffffff";

      this.comboText.setText("COMBO x" + this.combo);
      this.comboText.setColor(tierColor);
      this.comboText.setShadow(0, 0, tierColor, 22, true, true);

      this.comboText.setScale(0.6).setAngle(-4);
      this.tweens.killTweensOf(this.comboText);
      this.tweens.add({
        targets: this.comboText,
        scaleX: { from: 0.6, to: 1 },
        scaleY: { from: 0.6, to: 1 },
        duration: 250,
        ease: "Back.easeOut",
      });
      this.tweens.add({
        targets: this.comboText,
        angle: { from: -4, to: 0 },
        duration: 200,
        ease: "Cubic.easeOut",
      });

      if (tierIdx > this.prevTierIndex && this.prevTierIndex >= 0) {
        this.flashComboTier(COMBO.TIERS[tierIdx]);
      }
      this.prevTierIndex = tierIdx;
    } else {
      this.comboText.setText("");
      this.prevTierIndex = -1;
    }

    if (this.multiplier > 1) {
      const colorIndex = Math.min(
        Math.floor((this.multiplier - 1) / COMBO.MULTIPLIER_STEP),
        HUD.COMBO_COLORS.length - 1
      );
      const mColor = HUD.COMBO_COLORS[colorIndex];

      this.multiplierText.setText(this.multiplier.toFixed(1) + "x");
      this.multiplierText.setColor(mColor);
      this.multiplierText.setShadow(0, 0, mColor, 16, true, true);

      if (this.multiplier !== this.prevMultiplier) {
        this.multiplierText.setScale(0.5);
        this.tweens.killTweensOf(this.multiplierText);
        this.tweens.add({
          targets: this.multiplierText,
          scaleX: { from: 0.5, to: 1 },
          scaleY: { from: 0.5, to: 1 },
          duration: 300,
          ease: "Back.easeOut",
        });
      }
    } else {
      this.multiplierText.setText("");
    }
    this.prevMultiplier = this.multiplier;
  }

  private getComboTierIndex(): number {
    for (let i = COMBO.TIERS.length - 1; i >= 0; i--) {
      if (this.combo >= COMBO.TIERS[i].min) return i;
    }
    return -1;
  }

  private flashComboTier(tier: { label: string; color: string }): void {
    const label = this.add.text(GAME_WIDTH / 2, HUD.COMBO_Y - 60, tier.label, {
      fontSize: TYPO.HEADING,
      fontFamily: FONT.FAMILY,
      fontStyle: "bold",
      color: tier.color,
    }).setOrigin(0.5).setDepth(16).setScale(0);

    label.setShadow(0, 0, tier.color, 30, true, true);

    this.tweens.chain({
      targets: label,
      tweens: [
        {
          scaleX: { from: 0, to: 1.4 },
          scaleY: { from: 0, to: 1.4 },
          duration: 150,
          ease: "Back.easeOut",
        },
        {
          y: HUD.COMBO_Y - 140,
          alpha: 0,
          scaleX: 1.8,
          scaleY: 1.8,
          duration: 900,
          ease: "Cubic.easeIn",
        },
      ],
      onComplete: () => label.destroy(),
    });
  }

  private checkComboDecay(time: number): void {
    if (this.combo > 0 && time - this.lastCatchTime > COMBO.DECAY_TIMEOUT_MS) {
      this.combo = 0;
      this.updateMultiplier();
    }
  }

  private processItemInteractions(): void {
    const shieldCatchBand = this.shield.getCatchBand();
    const abyssCollider = new Phaser.Geom.Rectangle(0, ABYSS.TOP_Y + 24, GAME_WIDTH, GAME_HEIGHT - (ABYSS.TOP_Y + 24));

    for (const item of this.spawner.getActiveItems()) {
      if (!item.active) {
        continue;
      }

      const collisionPoints = item.getCollisionSamplePoints();

      if (collisionPoints.some((point) => Phaser.Geom.Rectangle.ContainsPoint(shieldCatchBand, point))) {
        this.onShieldCatch(item);
        continue;
      }

      if (collisionPoints.some((point) => Phaser.Geom.Rectangle.ContainsPoint(abyssCollider, point))) {
        this.onItemLeak(item);
      }
    }
  }

  private setupHUD(): void {
    this.scoreText = this.add
      .text(40, HUD.SCORE_Y, "DATA SAVED: 0", {
        fontSize: TYPO.TITLE,
        fontFamily: FONT.FAMILY,
        fontStyle: "bold",
        color: COLOR.HUD_TEXT,
      })
      .setOrigin(0, 0.5)
      .setDepth(15)
      .setShadow(0, 0, GLOW.CYAN.color, GLOW.CYAN.blur, true, true);

    this.comboText = this.add.text(GAME_WIDTH / 2, HUD.COMBO_Y, "", {
      fontSize: TYPO.TITLE,
      fontFamily: FONT.FAMILY,
      fontStyle: "bold",
      color: "#ffffff",
    }).setOrigin(0.5).setDepth(15)
    .setShadow(0, 0, "#ffffff", 18, true, true);

    this.multiplierText = this.add.text(GAME_WIDTH / 2, HUD.MULTIPLIER_Y, "", {
      fontSize: TYPO.BODY,
      fontFamily: FONT.FAMILY,
      fontStyle: "bold",
      color: "#14b8a6",
    }).setOrigin(0.5).setDepth(15)
    .setShadow(0, 0, GLOW.CYAN.color, 16, true, true);

    const heartY = this.scoreText.y;
    for (let i = 0; i < LIVES.INITIAL; i++) {
      const heart = this.add.image(
        HUD.HEART_START_X + i * HUD.HEART_SPACING,
        heartY + 2,
        TEXTURE_KEY.HEART_FILLED
      );
      heart.setDepth(15);
      this.applyHeartVisual(heart, true);
      this.hearts.push(heart);
    }

    this.scannerBarTrack = this.add.graphics().setDepth(15);
    this.scannerBarTrack.fillStyle(0x0c1426, 0.95);
    this.scannerBarTrack.fillRoundedRect(
      HUD.SCANNER_BAR_X,
      HUD.SCANNER_BAR_Y,
      HUD.SCANNER_BAR_WIDTH,
      HUD.SCANNER_BAR_HEIGHT,
      7
    );
    this.scannerBarTrack.lineStyle(1, 0x5cf3da, 0.28);
    this.scannerBarTrack.strokeRoundedRect(
      HUD.SCANNER_BAR_X,
      HUD.SCANNER_BAR_Y,
      HUD.SCANNER_BAR_WIDTH,
      HUD.SCANNER_BAR_HEIGHT,
      7
    );

    this.scannerBarFill = this.add.graphics().setDepth(16);
  }

  private updateHUD(): void {
    this.scoreText.setText("DATA SAVED: " + Math.round(this.displayedScore).toLocaleString());

    const progress = this.scanner.getProgress();
    const fillWidth = Math.max(0, HUD.SCANNER_BAR_WIDTH * progress);
    const barColor = this.scanner.getIsActive() ? COLOR.SCANNER_SAFE : COLOR.SHIELD_TEAL;

    this.scannerBarFill.clear();

    if (fillWidth > 0) {
      this.scannerBarFill.fillStyle(barColor, this.scanner.getIsActive() ? 0.8 : 0.5);
      this.scannerBarFill.fillRoundedRect(
        HUD.SCANNER_BAR_X,
        HUD.SCANNER_BAR_Y,
        fillWidth,
        HUD.SCANNER_BAR_HEIGHT,
        7
      );
    }
  }

  private refreshHearts(skipIndex?: number): void {
    for (let i = 0; i < this.hearts.length; i++) {
      if (i === skipIndex) {
        continue;
      }
      this.applyHeartVisual(this.hearts[i], i < this.lives);
    }
  }

  private animateDisplayedScore(): void {
    this.scoreTween?.stop();

    const scoreState = { value: this.displayedScore };
    const distance = Math.abs(this.score - this.displayedScore);
    const duration = Phaser.Math.Clamp(180 + distance * 10, 180, 520);

    this.scoreTween = this.tweens.add({
      targets: scoreState,
      value: this.score,
      duration,
      ease: "Cubic.easeOut",
      onUpdate: () => {
        this.displayedScore = scoreState.value;
      },
      onComplete: () => {
        this.displayedScore = this.score;
        this.scoreTween = undefined;
      },
    });
  }

  private animateHeartLoss(index: number): void {
    const heart = this.hearts[index];
    if (!heart) {
      return;
    }

    const baseY = heart.y;
    const baseSize = HUD.HEART_SIZE;
    const lostHeartGhost = this.createHeartFxImage(
      TEXTURE_KEY.HEART_FILLED,
      heart.x,
      baseY,
      heart.depth + 1
    );
    const lostHeartGlow = this.createHeartFxImage(
      TEXTURE_KEY.HEART_FILLED,
      heart.x,
      baseY,
      heart.depth + 2
    )
      .setTint(0xffffff)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.28);

    this.tweens.killTweensOf(heart);
    this.tweens.killTweensOf(lostHeartGhost);
    this.tweens.killTweensOf(lostHeartGlow);

    this.applyHeartVisual(heart, false);
    heart
      .setAlpha(0.18)
      .setDisplaySize(baseSize * 0.88, baseSize * 0.88)
      .setY(baseY + 4)
      .setAngle(4);

    this.tweens.add({
      targets: heart,
      alpha: 1,
      displayWidth: baseSize,
      displayHeight: baseSize,
      y: baseY,
      angle: 0,
      duration: 320,
      ease: "Cubic.easeOut",
    });

    this.tweens.add({
      targets: lostHeartGhost,
      alpha: { from: 1, to: 0 },
      displayWidth: { from: baseSize, to: baseSize * 1.18 },
      displayHeight: { from: baseSize, to: baseSize * 1.18 },
      y: { from: baseY, to: baseY - 12 },
      angle: { from: 0, to: -10 },
      duration: 320,
      ease: "Cubic.easeOut",
      onComplete: () => {
        lostHeartGhost.destroy();
      },
    });

    this.tweens.add({
      targets: lostHeartGlow,
      alpha: { from: 0.28, to: 0 },
      displayWidth: { from: baseSize * 1.02, to: baseSize * 1.34 },
      displayHeight: { from: baseSize * 1.02, to: baseSize * 1.34 },
      y: { from: baseY - 1, to: baseY - 10 },
      duration: 360,
      ease: "Quad.easeOut",
      onComplete: () => {
        lostHeartGlow.destroy();
      },
    });
  }

  private applyHeartVisual(heart: Phaser.GameObjects.Image, isFilled: boolean): void {
    heart
      .setTexture(isFilled ? TEXTURE_KEY.HEART_FILLED : TEXTURE_KEY.HEART_EMPTY)
      .setCrop(
        HUD.HEART_CROP_X,
        HUD.HEART_CROP_Y,
        HUD.HEART_CROP_WIDTH,
        HUD.HEART_CROP_HEIGHT
      )
      .setDisplaySize(HUD.HEART_SIZE, HUD.HEART_SIZE)
      .setAngle(0)
      .setAlpha(1);
  }

  private createHeartFxImage(
    textureKey: string,
    x: number,
    y: number,
    depth: number
  ): Phaser.GameObjects.Image {
    return this.add.image(x, y, textureKey)
      .setDepth(depth)
      .setCrop(
        HUD.HEART_CROP_X,
        HUD.HEART_CROP_Y,
        HUD.HEART_CROP_WIDTH,
        HUD.HEART_CROP_HEIGHT
      )
      .setDisplaySize(HUD.HEART_SIZE, HUD.HEART_SIZE);
  }

  private setupAbyssEffects(): void {
    this.abyssGroundGlow = this.add.image(
      GAME_WIDTH / 2,
      ABYSS.HOLE_Y + ABYSS.HOLE_HEIGHT / 2 - 20,
      TEXTURE_KEY.ABYSS_GROUND_GLOW
    ).setDepth(3).setAlpha(0.5);

    this.tweens.add({
      targets: this.abyssGroundGlow,
      alpha: { from: 0.35, to: 0.65 },
      scaleX: { from: 0.96, to: 1.04 },
      duration: 2500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.abyssGlow = this.add.image(
      GAME_WIDTH / 2,
      ABYSS.HOLE_Y,
      TEXTURE_KEY.ABYSS_GLOW
    ).setDepth(3).setAlpha(0.6);

    this.tweens.add({
      targets: this.abyssGlow,
      alpha: { from: 0.45, to: 0.75 },
      scaleX: { from: 1, to: 1.04 },
      scaleY: { from: 1, to: 1.04 },
      duration: 2800,
      yoyo: true,
      repeat: -1,
      ease: "Quad.easeInOut",
    });

    this.setupBinaryRain();

    this.abyssVoid = this.add.image(
      GAME_WIDTH / 2,
      ABYSS.HOLE_Y,
      TEXTURE_KEY.ABYSS_VORTEX
    ).setDepth(5).setAlpha(0.95);

    this.abyssVortexGfx = this.add.graphics().setDepth(5);

    this.abyssRing = this.add.image(
      GAME_WIDTH / 2,
      ABYSS.HOLE_Y,
      TEXTURE_KEY.ABYSS_RING
    ).setDepth(6).setAlpha(1);

    this.tweens.add({
      targets: this.abyssRing,
      scaleX: { from: 1, to: 1.015 },
      scaleY: { from: 1, to: 1.015 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: "Back.easeInOut",
    });

    this.setupAbyssParticles();
  }

  private setupAbyssParticles(): void {
    const cx = GAME_WIDTH / 2;
    const cy = ABYSS.HOLE_Y;
    const rx = ABYSS.HOLE_WIDTH / 2 * 0.75;
    const ry = ABYSS.HOLE_HEIGHT / 2 * 0.75;

    for (let i = 0; i < ABYSS.PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 0.5 + Math.random() * 0.7;
      const px = cx + Math.cos(angle) * rx * dist;
      const py = cy + Math.sin(angle) * ry * dist;
      const color = ABYSS.PARTICLE_COLORS[Math.floor(Math.random() * ABYSS.PARTICLE_COLORS.length)];
      const baseScale = 0.2 + Math.random() * 0.4;

      const img = this.add.image(px, py, TEXTURE_KEY.ABYSS_PARTICLE)
        .setDepth(7)
        .setAlpha(0.4 + Math.random() * 0.4)
        .setScale(baseScale)
        .setTint(color);

      this.tweens.add({
        targets: img,
        alpha: { from: img.alpha, to: 0.05 },
        scale: { from: baseScale, to: baseScale * 0.2 },
        duration: 1200 + Math.random() * 1800,
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 2500,
        ease: "Sine.easeInOut",
      });

      this.abyssParticles.push({
        img,
        angle,
        dist,
        speed: 0.003 + Math.random() * 0.005,
      });
    }
  }

  private updateAbyssParticles(): void {
    const cx = GAME_WIDTH / 2;
    const cy = ABYSS.HOLE_Y;
    const rx = ABYSS.HOLE_WIDTH / 2 * 0.75;
    const ry = ABYSS.HOLE_HEIGHT / 2 * 0.75;

    for (const p of this.abyssParticles) {
      p.angle += p.speed;
      p.dist = Math.max(0.15, p.dist - 0.0003);

      const px = cx + Math.cos(p.angle) * rx * p.dist;
      const py = cy + Math.sin(p.angle) * ry * p.dist;
      p.img.setPosition(px, py);

      if (p.dist <= 0.18) {
        p.dist = 0.6 + Math.random() * 0.5;
        p.angle = Math.random() * Math.PI * 2;
        p.speed = 0.003 + Math.random() * 0.005;
      }
    }
  }

  private setupBinaryRain(): void {
    const spacing = GAME_WIDTH / ABYSS.BINARY_RAIN_COLUMNS;
    const bandHeight = ABYSS.BINARY_RAIN_BOTTOM_Y - ABYSS.BINARY_RAIN_TOP_Y;

    for (let i = 0; i < ABYSS.BINARY_RAIN_COLUMNS; i++) {
      const x = i * spacing + spacing * (0.3 + Math.random() * 0.4);
      const trailLen = Phaser.Math.Between(
        Math.floor(ABYSS.BINARY_RAIN_TRAIL_CHARS * 0.6),
        ABYSS.BINARY_RAIN_TRAIL_CHARS
      );
      const trailStr = this.genBinaryStr(trailLen);
      const headChar = Math.random() > 0.5 ? "1" : "0";
      const speed = Phaser.Math.Between(ABYSS.BINARY_RAIN_SPEED_MIN, ABYSS.BINARY_RAIN_SPEED_MAX);
      const headY = ABYSS.BINARY_RAIN_TOP_Y + Math.random() * bandHeight;

      const trail = this.add.text(x, 0, trailStr, {
        fontSize: TYPO.MICRO,
        fontFamily: FONT.FAMILY_MONO,
        color: ABYSS.BINARY_RAIN_TRAIL_COLOR,
      }).setOrigin(0.5, 1).setDepth(4).setAlpha(ABYSS.BINARY_RAIN_TRAIL_ALPHA);

      const head = this.add.text(x, headY, headChar, {
        fontSize: TYPO.MICRO,
        fontFamily: FONT.FAMILY_MONO,
        fontStyle: "bold",
        color: ABYSS.BINARY_RAIN_HEAD_COLOR,
      }).setOrigin(0.5, 0).setDepth(4).setAlpha(ABYSS.BINARY_RAIN_HEAD_ALPHA);

      trail.y = head.y;
      this.binaryColumns.push({ head, trail, speed });
    }
  }

  private genBinaryStr(len: number): string {
    let s = "";
    for (let i = 0; i < len; i++) {
      s += Math.random() > 0.5 ? "1" : "0";
      if (i < len - 1) s += "\n";
    }
    return s;
  }

  private updateBinaryRain(delta: number): void {
    const dt = delta / 1000;
    const bandHeight = ABYSS.BINARY_RAIN_BOTTOM_Y - ABYSS.BINARY_RAIN_TOP_Y;

    for (const col of this.binaryColumns) {
      col.speed += ABYSS.BINARY_RAIN_ACCEL * dt;
      col.head.y += col.speed * dt;
      col.trail.y = col.head.y;

      const progress = (col.head.y - ABYSS.BINARY_RAIN_TOP_Y) / bandHeight;
      const fade = Math.max(0, 1 - progress);

      col.head.setAlpha(ABYSS.BINARY_RAIN_HEAD_ALPHA * fade);
      col.trail.setAlpha(ABYSS.BINARY_RAIN_TRAIL_ALPHA * fade);

      if (col.head.y > ABYSS.BINARY_RAIN_BOTTOM_Y + 20) {
        const trailLen = Phaser.Math.Between(
          Math.floor(ABYSS.BINARY_RAIN_TRAIL_CHARS * 0.6),
          ABYSS.BINARY_RAIN_TRAIL_CHARS
        );
        col.head.y = ABYSS.BINARY_RAIN_TOP_Y;
        col.head.setText(Math.random() > 0.5 ? "1" : "0");
        col.trail.setText(this.genBinaryStr(trailLen));
        col.trail.y = col.head.y;
        col.speed = Phaser.Math.Between(ABYSS.BINARY_RAIN_SPEED_MIN, ABYSS.BINARY_RAIN_SPEED_MAX);
      }
    }
  }

  private setupThreatOverlay(): void {
    this.threatVignette = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, TEXTURE_KEY.VIGNETTE)
      .setDepth(14)
      .setTint(THREAT.VIGNETTE_COLOR)
      .setAlpha(0);
  }

  private updateAbyssPulse(): void {
    const speed = this.lives <= 1 ? ABYSS.PULSE_DANGER_SPEED : ABYSS.PULSE_BASE_SPEED;

    const glowAlpha = 0.55 + Math.sin(this.time.now * speed * 1.2) * 0.2;
    this.abyssGlow.setAlpha(glowAlpha);

    const voidAlpha = 0.85 + Math.sin(this.time.now * speed * 0.6) * 0.1;
    this.abyssVoid.setAlpha(voidAlpha);

    if (this.lives <= 1) {
      this.abyssRing.setScale(
        1.04 + Math.sin(this.time.now * speed * 2) * 0.03,
        1.04 + Math.sin(this.time.now * speed * 2) * 0.03
      );
      this.vortexAngle += ABYSS.VORTEX_SPIN_SPEED * 2.5;
    } else {
      this.vortexAngle += ABYSS.VORTEX_SPIN_SPEED;
    }

    this.drawVortexArms();
    this.updateAbyssParticles();
  }

  private drawVortexArms(): void {
    const gfx = this.abyssVortexGfx;
    gfx.clear();

    const cx = GAME_WIDTH / 2;
    const cy = ABYSS.HOLE_Y;
    const rx = ABYSS.HOLE_WIDTH / 2 - 30;
    const ry = ABYSS.HOLE_HEIGHT / 2 - 30;
    const segs = ABYSS.VORTEX_SEGMENTS;
    const globalPulse = 0.7 + Math.sin(this.time.now * 0.003) * 0.15;

    for (let arm = 0; arm < ABYSS.VORTEX_ARMS; arm++) {
      const baseAngle = this.vortexAngle + (arm / ABYSS.VORTEX_ARMS) * Math.PI * 2;
      const armPulse = Math.sin(this.time.now * 0.002 + arm * 1.5) * 0.2;
      const [c1, c2] = ABYSS.ARM_COLORS[arm % ABYSS.ARM_COLORS.length];
      const col1 = Phaser.Display.Color.IntegerToColor(c1);
      const col2 = Phaser.Display.Color.IntegerToColor(c2);

      const passes = [
        { width: 20, alphaMul: 0.18 },
        { width: 10, alphaMul: 0.35 },
        { width: 3.5, alphaMul: 0.6 },
      ];

      for (const pass of passes) {
        for (let i = 0; i < segs - 1; i++) {
          const t1 = i / segs;
          const t2 = (i + 1) / segs;
          const tm = (t1 + t2) / 2;

          const r1 = ABYSS.VORTEX_INNER_R + t1 * (ABYSS.VORTEX_OUTER_R - ABYSS.VORTEX_INNER_R);
          const r2 = ABYSS.VORTEX_INNER_R + t2 * (ABYSS.VORTEX_OUTER_R - ABYSS.VORTEX_INNER_R);

          const a1 = baseAngle + t1 * ABYSS.VORTEX_TURNS * Math.PI * 2;
          const a2 = baseAngle + t2 * ABYSS.VORTEX_TURNS * Math.PI * 2;

          const x1 = cx + Math.cos(a1) * rx * r1;
          const y1 = cy + Math.sin(a1) * ry * r1;
          const x2 = cx + Math.cos(a2) * rx * r2;
          const y2 = cy + Math.sin(a2) * ry * r2;

          const blend = Phaser.Display.Color.Interpolate.ColorWithColor(
            col1, col2, 100, Math.round(tm * 100)
          );
          const color = Phaser.Display.Color.GetColor(blend.r, blend.g, blend.b);

          const alphaCurve = Math.sin(tm * Math.PI);
          const alpha = alphaCurve * pass.alphaMul * (globalPulse + armPulse);

          gfx.lineStyle(pass.width, color, Math.min(alpha, 1));
          gfx.beginPath();
          gfx.moveTo(x1, y1);
          gfx.lineTo(x2, y2);
          gfx.strokePath();
        }
      }
    }
  }

  private updateThreatVignette(): void {
    const targetAlpha = this.lives <= 1 ? THREAT.VIGNETTE_ALPHA_1_LIFE : THREAT.VIGNETTE_ALPHA_BASE;
    const currentAlpha = this.threatVignette.alpha;
    const newAlpha = Phaser.Math.Linear(currentAlpha, targetAlpha, 0.05);
    this.threatVignette.setAlpha(newAlpha);
  }

  private playOpeningRitual(): void {
    const attackText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, "YOUR DATA IS\nUNDER ATTACK", {
      fontSize: TYPO.HEADING,
      fontFamily: FONT.FAMILY,
      fontStyle: "bold",
      color: "#ff0044",
      align: "center",
    }).setOrigin(0.5).setDepth(15).setAlpha(0)
    .setShadow(0, 0, GLOW.RED.color, GLOW.RED.blur, true, true);

    this.tweens.add({
      targets: attackText,
      alpha: { from: 0, to: 1 },
      duration: 500,
      hold: 800,
      yoyo: true,
      onComplete: () => attackText.destroy(),
    });

    this.time.delayedCall(1500, () => {
      const introShield = { alpha: 0.5 };
      this.shield.setVisualAlpha(0.5);
      this.tweens.add({
        targets: introShield,
        alpha: { from: 0.5, to: 1 },
        duration: 500,
        onUpdate: () => this.shield.setVisualAlpha(introShield.alpha),
        onComplete: () => {
          this.shield.setVisualAlpha(1);
          this.isRunning = true;
          this.physics.resume();
        },
      });
    });
  }

  private cleanupOffscreenItems(): void {
    const items = this.spawner.getActiveItems();
    for (const item of items) {
      if (item.y > ABYSS.BOTTOM_Y + 100) {
        item.destroy();
      }
    }
  }
}

const ITEM_CONFIGS_MAP: Record<string, number> = {
  password: COLOR.ITEM_PASSWORD,
  email: COLOR.ITEM_EMAIL,
  selfie: COLOR.ITEM_SELFIE,
  credit_card: COLOR.ITEM_CREDIT,
};
