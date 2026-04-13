import { COLOR, ITEM_CONFIGS, ItemType } from "@config/constants";

interface CollisionLocalPoint {
  x: number;
  y: number;
}

export class FallingItem extends Phaser.Physics.Arcade.Image {
  private static readonly collisionSampleCache = new Map<string, CollisionLocalPoint[]>();

  public readonly type: ItemType;
  public readonly isMalware: boolean;
  public readonly points: number;

  private readonly glowSprites: Phaser.GameObjects.Image[] = [];
  private hintGraphics!: Phaser.GameObjects.Graphics;
  private scannerOverlay!: Phaser.GameObjects.Image;
  private scannerEchoOverlay!: Phaser.GameObjects.Image;
  private scannerLoop?: Phaser.Time.TimerEvent;
  private overlayTween?: Phaser.Tweens.Tween;
  private baseTween?: Phaser.Tweens.Tween;
  private scannerOverlayScale = 1;
  private scannerOverlayAngleOffset = 0;
  private scannerOverlayJitterX = 0;
  private scannerOverlayJitterY = 0;
  private scannerEchoScale = 1;
  private scannerEchoAngleOffset = 0;
  private scannerEchoJitterX = 0;
  private scannerEchoJitterY = 0;
  private scannerActive = false;
  private scannerResolved = false;
  private baseDisplayWidth = 0;
  private baseDisplayHeight = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    type: ItemType,
    isMalware: boolean
  ) {
    const config = ITEM_CONFIGS[type];
    super(scene, x, y, config.neutralTextureKey);

    this.type = type;
    this.isMalware = isMalware;
    this.points = config.points;

    scene.add.existing(this);
    scene.physics.add.existing(this, false);
    (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

    for (let i = 0; i < 8; i += 1) {
      const glowSprite = scene.add.image(x, y, config.neutralTextureKey)
        .setDepth(this.depth - 1)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setTint(config.color)
        .setAlpha(0.04);
      this.glowSprites.push(glowSprite);
    }

    this.hintGraphics = scene.add.graphics()
      .setDepth(this.depth + 1)
      .setAlpha(1)
      .setVisible(false);

    this.scannerOverlay = scene.add.image(x, y, config.safeTextureKey)
      .setDepth(this.depth + 2)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setAlpha(0);

    this.scannerEchoOverlay = scene.add.image(x, y, config.safeTextureKey)
      .setDepth(this.depth + 3)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0);

    this.refreshDisplaySize();
    this.resetNeutralState();
  }

  getPoints(): number {
    return this.isMalware ? 0 : this.points;
  }

  prepareScannerReveal(): void {
    if (this.scannerActive) return;

    this.scannerActive = true;
    this.scannerResolved = false;
    this.stopOverlayFx();

    this.scannerOverlay
      .setTexture(this.getRevealTextureKey())
      .setAlpha(0)
      .setTint(0xffffff)
      .setAngle(0);
    this.scannerEchoOverlay
      .setTexture(this.getRevealTextureKey())
      .setAlpha(0)
      .setTint(this.isMalware ? COLOR.SCANNER_DANGER : COLOR.SCANNER_SAFE)
      .setAngle(0);
    this.resetOverlayMotion();
    this.clearHintGraphics();
    this.setGlowTint(ITEM_CONFIGS[this.type].color);
    this.setGlowAlpha(0.065);

    this.scannerLoop = this.scene.time.addEvent({
      delay: 120,
      loop: true,
      callback: () => this.playScannerGlitchPass(),
    });

    this.playScannerGlitchPass();
  }

  applyScannerTint(): void {
    if (this.scannerResolved) return;

    const glowTint = this.isMalware ? COLOR.SCANNER_DANGER : COLOR.SCANNER_SAFE;

    this.scannerResolved = true;
    this.stopOverlayFx();

    this.setGlowTint(glowTint);
    this.setGlowAlpha(0.12);

    this.scannerOverlay
      .setTexture(this.getRevealTextureKey())
      .setPosition(this.x, this.y)
      .setAngle(0)
      .setTint(0xffffff)
      .setAlpha(0);

    this.scannerEchoOverlay
      .setTexture(this.getRevealTextureKey())
      .setPosition(this.x, this.y)
      .setAngle(0)
      .setTint(glowTint)
      .setAlpha(0);

    this.resetOverlayMotion();
    const primaryRevealState = {
      alpha: 0,
      scale: 0.94,
      angle: this.isMalware ? -2.6 : -1.8,
    };
    const echoRevealState = {
      alpha: 0,
      scale: 0.98,
      angle: this.isMalware ? 3.2 : -2.4,
    };

    this.scannerOverlayScale = primaryRevealState.scale;
    this.scannerOverlayAngleOffset = primaryRevealState.angle;
    this.scannerEchoScale = echoRevealState.scale;
    this.scannerEchoAngleOffset = echoRevealState.angle;

    this.overlayTween = this.scene.tweens.add({
      targets: primaryRevealState,
      alpha: { from: 0, to: this.isMalware ? 0.92 : 0.8 },
      scale: { from: 0.94, to: 1.03 },
      angle: { from: this.isMalware ? -2.6 : -1.8, to: this.isMalware ? 2.6 : 1.8 },
      duration: 220,
      ease: "Cubic.easeOut",
      onStart: () => {
        this.scannerOverlay.setAlpha(0);
      },
      onUpdate: () => {
        this.scannerOverlayScale = primaryRevealState.scale;
        this.scannerOverlayAngleOffset = primaryRevealState.angle;
        this.scannerOverlay.setAlpha(primaryRevealState.alpha);
      },
      onComplete: () => {
        this.scannerOverlayScale = 1;
        this.scannerOverlayAngleOffset = 0;
        this.overlayTween = undefined;
      },
    });

    this.scene.tweens.add({
      targets: echoRevealState,
      alpha: { from: 0, to: this.isMalware ? 0.56 : 0.42 },
      scale: { from: 0.98, to: this.isMalware ? 1.16 : 1.11 },
      angle: { from: this.isMalware ? 3.2 : -2.4, to: this.isMalware ? -3.2 : 2.4 },
      duration: 260,
      ease: "Quad.easeOut",
      onStart: () => {
        this.scannerEchoOverlay.setAlpha(0);
      },
      onUpdate: () => {
        this.scannerEchoScale = echoRevealState.scale;
        this.scannerEchoAngleOffset = echoRevealState.angle;
        this.scannerEchoOverlay.setAlpha(echoRevealState.alpha);
      },
      onComplete: () => {
        this.scannerEchoScale = 1;
        this.scannerEchoAngleOffset = 0;
      },
    });
  }

  clearScannerTint(): void {
    this.stopOverlayFx();
    this.scannerActive = false;
    this.scannerResolved = false;
    this.resetNeutralState();
  }

  isActive(): boolean {
    return this.active && this.y < 2000;
  }

  getCollisionSamplePoints(): Phaser.Geom.Point[] {
    const localPoints = FallingItem.getLocalCollisionPoints(
      this.scene,
      ITEM_CONFIGS[this.type].neutralTextureKey
    );

    const points: Phaser.Geom.Point[] = [];
    const cos = Math.cos(this.rotation);
    const sin = Math.sin(this.rotation);

    for (const point of localPoints) {
      const localX = point.x * this.displayWidth;
      const localY = point.y * this.displayHeight;
      const worldX = this.x + localX * cos - localY * sin;
      const worldY = this.y + localX * sin + localY * cos;
      points.push(new Phaser.Geom.Point(worldX, worldY));
    }

    return points;
  }

  updatePosition(): void {
    const time = this.scene.time.now;

    if (this.scannerActive && this.scannerResolved) {
      const settlePulse = this.isMalware ? 0.8 : 0.7;
      this.scannerOverlay.setAlpha(settlePulse + Math.sin(time * 0.012 + this.x * 0.02) * 0.1);
      this.scannerOverlayScale = 1;
      this.scannerOverlayAngleOffset = 0;
      this.scannerOverlayJitterX = 0;
      this.scannerOverlayJitterY = 0;
      this.scannerEchoOverlay
        .setAlpha((this.isMalware ? 0.28 : 0.22) + (Math.sin(time * 0.016 + this.y * 0.02) + 1) * 0.06)
        ;
      this.scannerEchoScale = 1.04 + Math.sin(time * 0.01 + this.x * 0.03) * 0.05;
      this.scannerEchoAngleOffset = Math.sin(time * 0.006 + this.y * 0.01) * (this.isMalware ? 2.8 : 1.8);
      this.scannerEchoJitterX = 0;
      this.scannerEchoJitterY = 0;
      this.clearHintGraphics();
      this.setGlowAlpha(0.11 + (Math.sin(time * 0.012 + this.y * 0.01) + 1) * 0.018);
    } else if (this.isMalware && !this.scannerActive) {
      this.applyMalwareHint(time);
    } else {
      this.clearHintGraphics();
      this.scannerEchoOverlay.setAlpha(0);
      this.resetOverlayMotion();
      this.setGlowTint(this.scannerResolved
        ? (this.isMalware ? COLOR.SCANNER_DANGER : COLOR.SCANNER_SAFE)
        : ITEM_CONFIGS[this.type].color);
      this.setGlowAlpha(this.scannerResolved ? 0.12 : this.isMalware ? 0.055 : 0.05);
    }

    this.syncEffectTransforms();
    this.positionGlowSprites(time);
  }

  destroy(fromScene?: boolean): void {
    this.stopOverlayFx();
    this.glowSprites.forEach((glowSprite) => glowSprite.destroy());
    this.hintGraphics.destroy();
    this.scannerOverlay.destroy();
    this.scannerEchoOverlay.destroy();
    super.destroy(fromScene);
  }

  private playScannerGlitchPass(): void {
    if (!this.scannerActive || this.scannerResolved) return;

    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.killTweensOf(this.scannerOverlay);
    this.scene.tweens.killTweensOf(this.scannerEchoOverlay);
    this.scannerOverlay
      .setTexture(this.getRevealTextureKey())
      .setPosition(this.x, this.y)
      .setTint(0xffffff)
      .setAngle(0)
      .setAlpha(0);

    this.scannerEchoOverlay
      .setTexture(this.getRevealTextureKey())
      .setPosition(this.x, this.y)
      .setTint(this.isMalware ? COLOR.SCANNER_DANGER : COLOR.SCANNER_SAFE)
      .setAngle(0)
      .setAlpha(0);

    const primaryLoopState = {
      alpha: 0,
      scale: 0.92,
      angle: this.isMalware ? -3.2 : -2.2,
    };
    const echoLoopState = {
      alpha: 0,
      scale: 0.96,
      angle: this.isMalware ? 4.2 : -3.1,
    };

    this.scannerOverlayScale = primaryLoopState.scale;
    this.scannerOverlayAngleOffset = primaryLoopState.angle;
    this.scannerEchoScale = echoLoopState.scale;
    this.scannerEchoAngleOffset = echoLoopState.angle;

    this.overlayTween = this.scene.tweens.add({
      targets: primaryLoopState,
      alpha: { from: 0, to: this.isMalware ? 0.82 : 0.7 },
      scale: { from: 0.92, to: 1.06 },
      duration: 150,
      yoyo: true,
      hold: 110,
      repeat: 2,
      ease: "Sine.easeInOut",
      onUpdate: () => {
        this.scannerOverlay.setAlpha(primaryLoopState.alpha);
        this.scannerOverlayScale = primaryLoopState.scale;
        this.scannerOverlayJitterX = Phaser.Math.Between(-4, 4);
        this.scannerOverlayJitterY = Phaser.Math.Between(-2, 2);
      },
      onComplete: () => {
        this.scannerOverlay.setAlpha(0);
        this.scannerOverlayScale = 1;
        this.scannerOverlayAngleOffset = 0;
        this.scannerOverlayJitterX = 0;
        this.scannerOverlayJitterY = 0;
        this.overlayTween = undefined;
      },
    });

    this.scene.tweens.add({
      targets: primaryLoopState,
      angle: { from: this.isMalware ? -3.2 : -2.2, to: this.isMalware ? 3.2 : 2.2 },
      duration: 150,
      yoyo: true,
      repeat: 2,
      ease: "Sine.easeInOut",
      onUpdate: () => {
        this.scannerOverlayAngleOffset = primaryLoopState.angle;
      },
    });

    this.scene.tweens.add({
      targets: echoLoopState,
      alpha: { from: 0, to: this.isMalware ? 0.5 : 0.36 },
      scale: { from: 0.96, to: this.isMalware ? 1.18 : 1.12 },
      angle: { from: this.isMalware ? 4.2 : -3.1, to: this.isMalware ? -4.2 : 3.1 },
      duration: 190,
      yoyo: true,
      repeat: 1,
      ease: "Sine.easeOut",
      onUpdate: () => {
        this.scannerEchoOverlay.setAlpha(echoLoopState.alpha);
        this.scannerEchoScale = echoLoopState.scale;
        this.scannerEchoAngleOffset = echoLoopState.angle;
        this.scannerEchoJitterX = Phaser.Math.Between(-6, 6);
        this.scannerEchoJitterY = Phaser.Math.Between(-3, 3);
      },
      onComplete: () => {
        this.scannerEchoOverlay.setAlpha(0);
        this.scannerEchoScale = 1;
        this.scannerEchoAngleOffset = 0;
        this.scannerEchoJitterX = 0;
        this.scannerEchoJitterY = 0;
      },
    });

    this.baseTween = this.scene.tweens.add({
      targets: this,
      alpha: { from: 0.68, to: 1 },
      angle: { from: this.isMalware ? -1.2 : -0.7, to: this.isMalware ? 1.2 : 0.7 },
      duration: 150,
      yoyo: true,
      repeat: 1,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.setAlpha(1).setAngle(0);
        this.baseTween = undefined;
      },
    });
  }

  private resetNeutralState(): void {
    const config = ITEM_CONFIGS[this.type];
    this.setTexture(config.neutralTextureKey);
    this.setAlpha(1);
    this.setGlowTint(config.color);
    this.setGlowAlpha(this.isMalware ? 0.055 : 0.05);
    this.clearHintGraphics();
    this.scannerOverlay
      .setTexture(this.getRevealTextureKey())
      .setPosition(this.x, this.y)
      .setAngle(0)
      .setAlpha(0);
    this.scannerEchoOverlay
      .setTexture(this.getRevealTextureKey())
      .setPosition(this.x, this.y)
      .setTint(this.isMalware ? COLOR.SCANNER_DANGER : COLOR.SCANNER_SAFE)
      .setAngle(0)
      .setAlpha(0);
    this.resetOverlayMotion();
  }

  private stopOverlayFx(): void {
    if (this.scannerLoop) {
      this.scannerLoop.destroy();
      this.scannerLoop = undefined;
    }
    if (this.overlayTween) {
      this.overlayTween.stop();
      this.overlayTween = undefined;
    }
    if (this.baseTween) {
      this.baseTween.stop();
      this.baseTween = undefined;
    }
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.killTweensOf(this.scannerOverlay);
    this.scene.tweens.killTweensOf(this.scannerEchoOverlay);
    this.setAlpha(1);
    this.setAngle(0);
    this.clearHintGraphics();
    this.resetOverlayMotion();
    this.scannerOverlay.setAlpha(0).setPosition(this.x, this.y).setAngle(0);
    this.scannerEchoOverlay.setAlpha(0).setPosition(this.x, this.y).setAngle(0);
  }

  private refreshDisplaySize(): void {
    const cfg = ITEM_CONFIGS[this.type];
    const frameWidth = this.frame.realWidth;
    const frameHeight = this.frame.realHeight;
    const scale = Math.min(cfg.width / frameWidth, cfg.height / frameHeight);
    const displayWidth = frameWidth * scale;
    const displayHeight = frameHeight * scale;

    this.baseDisplayWidth = displayWidth;
    this.baseDisplayHeight = displayHeight;

    this.setDisplaySize(displayWidth, displayHeight);
    this.glowSprites.forEach((glowSprite) => {
      glowSprite
        .setTexture(cfg.neutralTextureKey)
        .setDisplaySize(displayWidth * 1.02, displayHeight * 1.02);
    });
    this.syncEffectTransforms();

    const body = this.body as Phaser.Physics.Arcade.Body;
    const bodyWidth = displayWidth * 0.74;
    const bodyHeight = displayHeight * 0.74;
    body.setSize(bodyWidth, bodyHeight, true);
  }

  private positionGlowSprites(time: number): void {
    const radius = Math.max(2.5, Math.min(this.baseDisplayWidth, this.baseDisplayHeight) * 0.05);
    const offsetMultiplier = 0.85 + Math.sin(time * 0.0045 + this.x * 0.01) * 0.06;
    const offsets = [
      { x: -1, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -0.72, y: -0.72 },
      { x: 0.72, y: -0.72 },
      { x: -0.72, y: 0.72 },
      { x: 0.72, y: 0.72 },
    ];

    this.glowSprites.forEach((glowSprite, index) => {
      const offset = offsets[index];
      glowSprite.setPosition(
        this.x + offset.x * radius * offsetMultiplier,
        this.y + offset.y * radius * offsetMultiplier
      );
    });
  }

  private setGlowTint(color: number | { r: number; g: number; b: number }): void {
    if (typeof color === "number") {
      this.glowSprites.forEach((glowSprite) => glowSprite.setTint(color));
      return;
    }

    const tint = Phaser.Display.Color.GetColor(color.r, color.g, color.b);
    this.glowSprites.forEach((glowSprite) => glowSprite.setTint(tint));
  }

  private setGlowAlpha(alpha: number): void {
    this.glowSprites.forEach((glowSprite) => glowSprite.setAlpha(alpha));
  }

  private syncEffectTransforms(): void {
    this.scannerOverlay
      .setDisplaySize(
        this.displayWidth * this.scannerOverlayScale,
        this.displayHeight * this.scannerOverlayScale
      )
      .setPosition(this.x + this.scannerOverlayJitterX, this.y + this.scannerOverlayJitterY)
      .setAngle(this.angle + this.scannerOverlayAngleOffset);

    this.scannerEchoOverlay
      .setDisplaySize(
        this.displayWidth * 1.04 * this.scannerEchoScale,
        this.displayHeight * 1.04 * this.scannerEchoScale
      )
      .setPosition(this.x + this.scannerEchoJitterX, this.y + this.scannerEchoJitterY)
      .setAngle(this.angle + this.scannerEchoAngleOffset);
  }

  private resetOverlayMotion(): void {
    this.scannerOverlayScale = 1;
    this.scannerOverlayAngleOffset = 0;
    this.scannerOverlayJitterX = 0;
    this.scannerOverlayJitterY = 0;
    this.scannerEchoScale = 1;
    this.scannerEchoAngleOffset = 0;
    this.scannerEchoJitterX = 0;
    this.scannerEchoJitterY = 0;
  }

  private applyMalwareHint(time: number): void {
    const baseColor = Phaser.Display.Color.IntegerToColor(ITEM_CONFIGS[this.type].color);
    const dangerColor = Phaser.Display.Color.IntegerToColor(COLOR.MALWARE_GLITCH);
    const g = this.hintGraphics;
    const w = this.displayWidth;
    const h = this.displayHeight;
    const dangerHex = COLOR.MALWARE_GLITCH;
    const pulse = 0.42 + (Math.sin(time * 0.008 + this.x * 0.018) + 1) * 0.11;
    const accentPulse = 0.18 + (Math.sin(time * 0.012 + this.y * 0.014) + 1) * 0.08;
    const thickness = Math.max(3, Math.min(w, h) * 0.052);

    g
      .setVisible(true)
      .setPosition(this.x, this.y)
      .setRotation(this.rotation)
      .clear();

    switch (this.type) {
      case ItemType.PASSWORD: {
        const shift = Math.sin(time * 0.012 + this.y * 0.02) * w * 0.01;
        const ringRadius = Math.min(w, h) * 0.15;
        const ringX = w * 0.16;
        const ringY = -h * 0.22;

        g.lineStyle(Math.max(2, thickness * 0.65), dangerHex, 0.34 + accentPulse);
        g.strokeCircle(ringX, ringY, ringRadius);

        this.strokeSegment(
          g,
          -w * 0.22 + shift,
          -h * 0.10,
          w * 0.02 + shift,
          h * 0.01,
          thickness,
          dangerHex,
          0.5 + pulse * 0.35
        );
        this.strokeSegment(
          g,
          -w * 0.02 + shift,
          -h * 0.01,
          w * 0.20 + shift,
          h * 0.10,
          thickness,
          dangerHex,
          0.46 + pulse * 0.32
        );
        this.strokeSegment(
          g,
          -w * 0.18 + shift,
          h * 0.06,
          w * 0.05 + shift,
          h * 0.17,
          thickness * 0.86,
          dangerHex,
          0.42 + pulse * 0.28
        );

        this.setGlowTint(Phaser.Display.Color.Interpolate.ColorWithColor(
          baseColor,
          dangerColor,
          100,
          48 + Math.round(pulse * 30)
        ));
        this.setGlowAlpha(0.084 + pulse * 0.028);
        break;
      }
      case ItemType.EMAIL: {
        const bracketW = w * 0.17;
        const bracketH = h * 0.15;

        this.drawCornerBracket(
          g,
          -w * 0.35,
          -h * 0.22,
          bracketW,
          bracketH,
          1,
          1,
          thickness * 0.72,
          dangerHex,
          0.44 + pulse * 0.3
        );
        this.drawCornerBracket(
          g,
          w * 0.35,
          -h * 0.22,
          bracketW,
          bracketH,
          -1,
          1,
          thickness * 0.72,
          dangerHex,
          0.44 + pulse * 0.3
        );
        this.drawCornerBracket(
          g,
          -w * 0.31,
          h * 0.20,
          bracketW * 0.88,
          bracketH * 0.85,
          1,
          -1,
          thickness * 0.64,
          dangerHex,
          0.36 + accentPulse * 0.9
        );

        g.fillStyle(dangerHex, 0.34 + accentPulse);
        g.fillRect(-w * 0.05, -h * 0.01, w * 0.13, h * 0.07);
        g.fillRect(w * 0.18, h * 0.06, w * 0.08, h * 0.06);
        g.fillRect(-w * 0.27, h * 0.12, w * 0.07, h * 0.05);

        this.setGlowTint(Phaser.Display.Color.Interpolate.ColorWithColor(
          baseColor,
          dangerColor,
          100,
          44 + Math.round(pulse * 22)
        ));
        this.setGlowAlpha(0.08 + accentPulse * 0.03);
        break;
      }
      case ItemType.SELFIE: {
        const bandY = -h * 0.08 + Math.sin(time * 0.01 + this.x * 0.015) * h * 0.035;
        const cornerWidth = w * 0.16;
        const cornerHeight = h * 0.17;

        this.drawCornerBracket(
          g,
          -w * 0.28,
          -h * 0.24,
          cornerWidth,
          cornerHeight,
          1,
          1,
          thickness * 0.62,
          dangerHex,
          0.38 + pulse * 0.22
        );
        this.drawCornerBracket(
          g,
          w * 0.28,
          h * 0.22,
          cornerWidth,
          cornerHeight,
          -1,
          -1,
          thickness * 0.62,
          dangerHex,
          0.38 + pulse * 0.22
        );

        g.fillStyle(dangerHex, 0.28 + pulse * 0.22);
        g.fillRect(-w * 0.32, bandY, w * 0.64, h * 0.08);

        this.strokeSegment(
          g,
          -w * 0.30,
          -h * 0.16,
          w * 0.30,
          -h * 0.16,
          thickness * 0.48,
          dangerHex,
          0.34 + accentPulse
        );
        this.strokeSegment(
          g,
          -w * 0.24,
          h * 0.03,
          w * 0.24,
          h * 0.03,
          thickness * 0.48,
          dangerHex,
          0.32 + accentPulse * 0.9
        );
        this.strokeSegment(
          g,
          -w * 0.30,
          h * 0.20,
          w * 0.30,
          h * 0.20,
          thickness * 0.42,
          dangerHex,
          0.3 + accentPulse * 0.85
        );

        this.setGlowTint(Phaser.Display.Color.Interpolate.ColorWithColor(
          baseColor,
          dangerColor,
          100,
          46 + Math.round(pulse * 20)
        ));
        this.setGlowAlpha(0.082 + accentPulse * 0.026);
        break;
      }
      case ItemType.CREDIT_CARD: {
        const bandHeight = h * 0.18;
        g.fillStyle(dangerHex, 0.24 + pulse * 0.24);
        g.fillRoundedRect(
          -w * 0.39,
          -h * 0.14,
          w * 0.78,
          bandHeight,
          Math.max(6, h * 0.05)
        );

        this.strokeSegment(
          g,
          -w * 0.32,
          h * 0.06,
          w * 0.28,
          h * 0.06,
          thickness * 0.58,
          dangerHex,
          0.4 + accentPulse
        );
        this.strokeSegment(
          g,
          -w * 0.08,
          -h * 0.20,
          w * 0.18,
          h * 0.18,
          thickness * 0.68,
          dangerHex,
          0.46 + pulse * 0.28
        );
        this.strokeSegment(
          g,
          w * 0.18,
          -h * 0.20,
          -w * 0.08,
          h * 0.18,
          thickness * 0.68,
          dangerHex,
          0.4 + pulse * 0.24
        );

        this.setGlowTint(Phaser.Display.Color.Interpolate.ColorWithColor(
          baseColor,
          dangerColor,
          100,
          50 + Math.round(pulse * 28)
        ));
        this.setGlowAlpha(0.086 + pulse * 0.028);
        break;
      }
    }
  }

  private getRevealTextureKey(): string {
    return this.isMalware
      ? ITEM_CONFIGS[this.type].dangerTextureKey
      : ITEM_CONFIGS[this.type].safeTextureKey;
  }

  private clearHintGraphics(): void {
    this.hintGraphics.clear();
    this.hintGraphics.setVisible(false);
  }

  private strokeSegment(
    graphics: Phaser.GameObjects.Graphics,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    thickness: number,
    color: number,
    alpha: number
  ): void {
    graphics.lineStyle(thickness, color, alpha);
    graphics.beginPath();
    graphics.moveTo(x1, y1);
    graphics.lineTo(x2, y2);
    graphics.strokePath();
  }

  private drawCornerBracket(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
    horizontalDir: 1 | -1,
    verticalDir: 1 | -1,
    thickness: number,
    color: number,
    alpha: number
  ): void {
    this.strokeSegment(
      graphics,
      x,
      y,
      x + width * horizontalDir,
      y,
      thickness,
      color,
      alpha
    );
    this.strokeSegment(
      graphics,
      x,
      y,
      x,
      y + height * verticalDir,
      thickness,
      color,
      alpha
    );
  }

  private static getLocalCollisionPoints(
    scene: Phaser.Scene,
    textureKey: string
  ): CollisionLocalPoint[] {
    const cached = FallingItem.collisionSampleCache.get(textureKey);
    if (cached) {
      return cached;
    }

    const frame = scene.textures.getFrame(textureKey);
    if (!frame) {
      const fallback = [{ x: 0, y: 0 }];
      FallingItem.collisionSampleCache.set(textureKey, fallback);
      return fallback;
    }

    const width = frame.width;
    const height = frame.height;
    const sourceImage = frame.source.image as CanvasImageSource;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      const fallback = [{ x: 0, y: 0 }];
      FallingItem.collisionSampleCache.set(textureKey, fallback);
      return fallback;
    }

    context.clearRect(0, 0, width, height);
    context.drawImage(sourceImage, frame.cutX, frame.cutY, width, height, 0, 0, width, height);

    const alphaThreshold = 20;
    const imageData = context.getImageData(0, 0, width, height);
    const alphaAt = (x: number, y: number): number => imageData.data[(y * width + x) * 4 + 3];

    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (alphaAt(x, y) <= alphaThreshold) {
          continue;
        }

        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }

    if (maxX < minX || maxY < minY) {
      const fallback = [{ x: 0, y: 0 }];
      FallingItem.collisionSampleCache.set(textureKey, fallback);
      return fallback;
    }

    const points: CollisionLocalPoint[] = [];
    const seen = new Set<string>();

    const addPoint = (x: number, y: number): void => {
      const normalizedX = ((x + 0.5) - width / 2) / width;
      const normalizedY = ((y + 0.5) - height / 2) / height;
      const key = `${Math.round(normalizedX * 1000)}:${Math.round(normalizedY * 1000)}`;

      if (seen.has(key)) {
        return;
      }

      seen.add(key);
      points.push({ x: normalizedX, y: normalizedY });
    };

    const findOpaqueInCell = (
      startX: number,
      endX: number,
      startY: number,
      endY: number
    ): { x: number; y: number } | null => {
      const clampedStartX = Phaser.Math.Clamp(Math.floor(startX), minX, maxX);
      const clampedEndX = Phaser.Math.Clamp(Math.ceil(endX), minX, maxX);
      const clampedStartY = Phaser.Math.Clamp(Math.floor(startY), minY, maxY);
      const clampedEndY = Phaser.Math.Clamp(Math.ceil(endY), minY, maxY);

      for (let y = clampedStartY; y <= clampedEndY; y += 1) {
        for (let x = clampedStartX; x <= clampedEndX; x += 1) {
          if (alphaAt(x, y) > alphaThreshold) {
            return { x, y };
          }
        }
      }

      return null;
    };

    const rowSamples = 8;
    for (let i = 0; i < rowSamples; i += 1) {
      const y = Math.round(minY + ((maxY - minY) * i) / (rowSamples - 1));
      let left = -1;
      let right = -1;

      for (let x = minX; x <= maxX; x += 1) {
        if (alphaAt(x, y) > alphaThreshold) {
          left = x;
          break;
        }
      }

      for (let x = maxX; x >= minX; x -= 1) {
        if (alphaAt(x, y) > alphaThreshold) {
          right = x;
          break;
        }
      }

      if (left !== -1 && right !== -1) {
        addPoint(left, y);
        addPoint(right, y);
        addPoint(Math.round((left + right) / 2), y);
      }
    }

    const columnSamples = 6;
    for (let i = 0; i < columnSamples; i += 1) {
      const x = Math.round(minX + ((maxX - minX) * i) / (columnSamples - 1));
      let top = -1;
      let bottom = -1;

      for (let y = minY; y <= maxY; y += 1) {
        if (alphaAt(x, y) > alphaThreshold) {
          top = y;
          break;
        }
      }

      for (let y = maxY; y >= minY; y -= 1) {
        if (alphaAt(x, y) > alphaThreshold) {
          bottom = y;
          break;
        }
      }

      if (top !== -1 && bottom !== -1) {
        addPoint(x, top);
        addPoint(x, bottom);
      }
    }

    const gridColumns = 5;
    const gridRows = 5;
    const boundsWidth = maxX - minX + 1;
    const boundsHeight = maxY - minY + 1;

    for (let gx = 0; gx < gridColumns; gx += 1) {
      for (let gy = 0; gy < gridRows; gy += 1) {
        const cellStartX = minX + (boundsWidth * gx) / gridColumns;
        const cellEndX = minX + (boundsWidth * (gx + 1)) / gridColumns - 1;
        const cellStartY = minY + (boundsHeight * gy) / gridRows;
        const cellEndY = minY + (boundsHeight * (gy + 1)) / gridRows - 1;
        const opaquePoint = findOpaqueInCell(cellStartX, cellEndX, cellStartY, cellEndY);

        if (opaquePoint) {
          addPoint(opaquePoint.x, opaquePoint.y);
        }
      }
    }

    addPoint(Math.round((minX + maxX) / 2), Math.round((minY + maxY) / 2));

    FallingItem.collisionSampleCache.set(textureKey, points);
    return points;
  }
}
