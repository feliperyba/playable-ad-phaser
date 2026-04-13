import { GAME_WIDTH, SHIELD, TEXTURE_KEY, COLOR, JUICE, PARTICLES } from "@config/constants";

export class Shield extends Phaser.Physics.Arcade.Image {
  private comboLevel = 0;
  private prevX = 0;
  private currentWidth = SHIELD.BASE_WIDTH;
  private targetWidth = SHIELD.BASE_WIDTH;
  private readonly visual: Phaser.GameObjects.NineSlice;
  private readonly visualScale = SHIELD.HEIGHT / SHIELD.NATIVE_HEIGHT;
  private visualAlpha = 1;
  private visualPulseScale = 1;
  private visualYOffset = 0;
  private visualFeedbackAlpha = 1;
  private baseTint: number | null = null;
  private feedbackTint: number | null = null;
  private widthTween?: Phaser.Tweens.Tween;
  private feedbackTween?: Phaser.Tweens.Tween;
  private readonly pointerMoveHandler: (pointer: Phaser.Input.Pointer) => void;

  constructor(scene: Phaser.Scene) {
    super(scene, GAME_WIDTH / 2, SHIELD.Y, TEXTURE_KEY.CATCH_BURST);

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setImmovable(true);
    this.setDisplaySize(SHIELD.BASE_WIDTH, SHIELD.HEIGHT);
    this.setDepth(9).setVisible(false).setAlpha(0);

    this.visual = scene.add.nineslice(
      this.x,
      this.y,
      TEXTURE_KEY.SHIELD,
      undefined,
      SHIELD.NATIVE_WIDTH,
      SHIELD.NATIVE_HEIGHT,
      SHIELD.SLICE_LEFT,
      SHIELD.SLICE_RIGHT,
      SHIELD.SLICE_TOP,
      SHIELD.SLICE_BOTTOM
    )
      .setDepth(9)
      .setScale(this.visualScale);

    this.resizeVisual(SHIELD.BASE_WIDTH);
    this.syncBody();
    this.applyVisualState();

    this.prevX = this.x;
    this.pointerMoveHandler = (pointer: Phaser.Input.Pointer) => {
      const halfW = this.currentWidth / 2;
      const minX = halfW;
      const maxX = GAME_WIDTH - halfW;
      this.x = Phaser.Math.Clamp(pointer.x, minX, maxX);
      this.applyVisualState();
      (this.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
    };
    scene.input.on("pointermove", this.pointerMoveHandler);
  }

  update(): void {
    this.applyVisualState();
    (this.body as Phaser.Physics.Arcade.Body).updateFromGameObject();

    const dx = Math.abs(this.x - this.prevX);
    if (dx > PARTICLES.SHIELD_TRAIL_MIN_DX) {
      const trail = this.scene.add.image(this.prevX, this.y, TEXTURE_KEY.CATCH_BURST);
      trail.setTint(COLOR.SHIELD_TEAL).setAlpha(PARTICLES.SHIELD_TRAIL_ALPHA).setDepth(7).setScale(0.3);
      this.scene.tweens.add({
        targets: trail,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: PARTICLES.SHIELD_TRAIL_LIFESPAN,
        onComplete: () => trail.destroy(),
      });
    }
    this.prevX = this.x;
  }

  setComboLevel(level: number): void {
    this.comboLevel = level;
    this.updateComboVisuals();
  }

  playCatchGlow(): void {
    this.playFeedbackPulse({
      tint: COLOR.CATCH_FLASH,
      scaleFrom: 0.98,
      scaleTo: 1.08,
      yFrom: 3,
      yTo: -4,
      alphaFrom: JUICE.CATCH_FLASH_ALPHA,
      alphaTo: 1,
      duration: JUICE.CATCH_FLASH_DURATION_MS + 120,
      ease: "Cubic.easeOut",
    });
  }

  playMalwareFlash(): void {
    this.playFeedbackPulse({
      tint: COLOR.MALWARE_FLASH,
      scaleFrom: 0.92,
      scaleTo: 1.04,
      yFrom: 7,
      yTo: -3,
      alphaFrom: 0.92,
      alphaTo: JUICE.MALWARE_FLASH_ALPHA,
      duration: JUICE.MALWARE_FLASH_DURATION_MS + 140,
      ease: "Sine.easeInOut",
    });
  }

  setVisualAlpha(alpha: number): void {
    this.visualAlpha = alpha;
    this.applyVisualState();
  }

  destroy(fromScene?: boolean): void {
    this.scene.input.off("pointermove", this.pointerMoveHandler);
    this.widthTween?.stop();
    this.feedbackTween?.stop();
    this.visual.destroy();
    super.destroy(fromScene);
  }

  getHitBounds(): Phaser.Geom.Rectangle {
    return this.getCatchBand();
  }

  getCatchBand(): Phaser.Geom.Rectangle {
    const hitWidth = this.currentWidth * 0.8 * this.visualPulseScale;
    const hitHeight = Math.max(18, SHIELD.HEIGHT * 0.26 * this.visualPulseScale);
    const centerX = this.x;
    const centerY = this.y + this.visualYOffset + SHIELD.HEIGHT * 0.06;

    return new Phaser.Geom.Rectangle(
      centerX - hitWidth / 2,
      centerY - hitHeight / 2,
      hitWidth,
      hitHeight
    );
  }

  private updateComboVisuals(): void {
    let nextWidth = SHIELD.BASE_WIDTH;
    let nextBaseTint: number | null = null;

    if (this.comboLevel >= 10) {
      nextWidth = SHIELD.MAX_WIDTH;
      nextBaseTint = 0xffffff;
    } else if (this.comboLevel >= 5) {
      nextWidth = SHIELD.MID_WIDTH;
    }

    this.baseTint = nextBaseTint;
    if (nextWidth !== this.targetWidth) {
      this.animateWidthTo(nextWidth);
    } else {
      this.applyVisualTint();
    }
  }

  private animateWidthTo(nextWidth: number): void {
    this.targetWidth = nextWidth;

    this.widthTween?.stop();

    const widthState = { width: this.currentWidth };
    this.widthTween = this.scene.tweens.add({
      targets: widthState,
      width: nextWidth,
      duration: 260,
      ease: "Cubic.easeOut",
      onUpdate: () => {
        this.currentWidth = widthState.width;
        this.resizeVisual(this.currentWidth);
        this.syncBody();
        this.applyVisualState();
      },
      onComplete: () => {
        this.currentWidth = nextWidth;
        this.resizeVisual(nextWidth);
        this.syncBody();
        this.applyVisualState();
        this.widthTween = undefined;
      },
    });
  }

  private playFeedbackPulse(config: {
    tint: number;
    scaleFrom: number;
    scaleTo: number;
    yFrom: number;
    yTo: number;
    alphaFrom: number;
    alphaTo: number;
    duration: number;
    ease: string;
  }): void {
    this.feedbackTween?.stop();

    const feedbackState = {
      scale: config.scaleFrom,
      y: config.yFrom,
      alpha: config.alphaFrom,
    };

    this.feedbackTint = config.tint;
    this.visualPulseScale = feedbackState.scale;
    this.visualYOffset = feedbackState.y;
    this.visualFeedbackAlpha = feedbackState.alpha;
    this.applyVisualState();

    this.feedbackTween = this.scene.tweens.add({
      targets: feedbackState,
      scale: config.scaleTo,
      y: config.yTo,
      alpha: config.alphaTo,
      duration: config.duration,
      ease: config.ease,
      yoyo: true,
      onUpdate: () => {
        this.visualPulseScale = feedbackState.scale;
        this.visualYOffset = feedbackState.y;
        this.visualFeedbackAlpha = feedbackState.alpha;
        this.applyVisualState();
      },
      onComplete: () => {
        this.feedbackTint = null;
        this.visualPulseScale = 1;
        this.visualYOffset = 0;
        this.visualFeedbackAlpha = 1;
        this.applyVisualState();
        this.feedbackTween = undefined;
      },
    });
  }

  private syncBody(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const bw = this.displayWidth * SHIELD.BODY_WIDTH_RATIO;
    const bh = this.displayHeight * SHIELD.BODY_HEIGHT_RATIO;
    body.setSize(bw, bh, true);
    body.setAllowGravity(false);
    body.updateFromGameObject();
  }

  private resizeVisual(targetWidth: number): void {
    this.currentWidth = targetWidth;
    this.setDisplaySize(targetWidth, SHIELD.HEIGHT);
    this.visual.setSize(targetWidth / this.visualScale, SHIELD.NATIVE_HEIGHT);
  }

  private applyVisualState(): void {
    this.visual
      .setScale(this.visualScale * this.visualPulseScale)
      .setPosition(this.x, this.y + this.visualYOffset)
      .setAlpha(this.visualAlpha * this.visualFeedbackAlpha);

    this.applyVisualTint();
  }

  private setVisualTint(color: number): void {
    this.feedbackTint = color;
    this.applyVisualTint();
  }

  private clearVisualTint(): void {
    this.feedbackTint = null;
    this.applyVisualTint();
  }

  private applyVisualTint(): void {
    const tint = this.feedbackTint ?? this.baseTint;

    if (tint === null) {
      this.visual.clearTint();
      return;
    }

    this.visual.setTint(tint);
  }
}
