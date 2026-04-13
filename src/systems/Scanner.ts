import { COLOR, SCANNER, TEXTURE_KEY, GAME_WIDTH, GAME_HEIGHT } from "@config/constants";
import { FallingItem } from "@entities/FallingItem";

export class Scanner {
  private scene: Phaser.Scene;
  private getActiveItems: () => FallingItem[];
  private getComboMultiplier: () => number;
  private cooldownTimer: Phaser.Time.TimerEvent | null = null;
  private durationTimer: Phaser.Time.TimerEvent | null = null;
  private _isActive = false;
  private overlay!: Phaser.GameObjects.Image;
  private scanlines!: Phaser.GameObjects.TileSprite;
  private beam: Phaser.GameObjects.Image | null = null;
  private beamX = -SCANNER.BEAM_WIDTH;
  private activeProgress = 0;
  private activeDurationMs = SCANNER.DURATION_MS;

  constructor(
    scene: Phaser.Scene,
    getActiveItems: () => FallingItem[],
    getComboMultiplier: () => number
  ) {
    this.scene = scene;
    this.getActiveItems = getActiveItems;
    this.getComboMultiplier = getComboMultiplier;
  }

  start(): void {
    this._isActive = false;
    this.activeProgress = 0;
    this.beamX = -SCANNER.BEAM_WIDTH;

    this.overlay = this.scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, TEXTURE_KEY.DAMAGE_OVERLAY)
      .setDepth(14)
      .setAlpha(0)
      .setTint(COLOR.SCANNER_OVERLAY);

    this.scanlines = this.scene.add.tileSprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, TEXTURE_KEY.SCANNER_LINES)
      .setDepth(18)
      .setAlpha(0)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.scheduleNextActivation();
  }

  stop(): void {
    this.deactivate();
    if (this.cooldownTimer) {
      this.cooldownTimer.destroy();
      this.cooldownTimer = null;
    }
    this.durationTimer?.destroy();
    this.durationTimer = null;
    this.beam?.destroy();
    this.beam = null;
    this.overlay?.destroy();
    this.scanlines?.destroy();
  }

  update(delta: number): void {
    if (!this._isActive) return;
    this.scanlines.tilePositionY -= delta * SCANNER.SCANLINE_SPEED;

    this.getActiveItems().forEach((item) => {
      if (!item.getData("scannerPrepared")) {
        item.setData("scannerPrepared", true);
        item.prepareScannerReveal();
      }

      if (item.getData("scanned")) {
        return;
      }

      if (!this.beam) {
        item.setData("scanned", true);
        item.applyScannerTint();
        return;
      }

      if (item.x < this.beamX + SCANNER.BEAM_WIDTH * 0.5) {
        item.setData("scanned", true);
        item.applyScannerTint();
      }
    });
  }

  activate(): void {
    if (this._isActive) return;

    this._isActive = true;
    this.activeProgress = 0;
    this.beamX = -SCANNER.BEAM_WIDTH;
    this.activeDurationMs = this.getScaledDurationMs();

    this.scene.tweens.add({
      targets: this.overlay,
      alpha: SCANNER.OVERLAY_ALPHA,
      duration: 140,
      ease: "Sine.easeOut",
    });

    this.scene.tweens.add({
      targets: this.scanlines,
      alpha: 0.06,
      duration: 180,
      ease: "Sine.easeOut",
    });

    this.getActiveItems().forEach((item) => {
      item.setData("scannerPrepared", true);
      item.setData("scanned", false);
      item.prepareScannerReveal();
    });

    this.beam = this.scene.add.image(-SCANNER.BEAM_WIDTH, GAME_HEIGHT / 2, TEXTURE_KEY.SCANNER_BEAM)
      .setDepth(20)
      .setAlpha(0.42)
      .setTint(0x9fffe7);

    this.scene.tweens.addCounter({
      from: -SCANNER.BEAM_WIDTH,
      to: GAME_WIDTH + SCANNER.BEAM_WIDTH,
      duration: SCANNER.BEAM_SWEEP_MS,
      ease: "Sine.easeInOut",
      onUpdate: (tween) => {
        const beamX = tween.getValue() ?? 0;
        this.beamX = beamX;
        this.activeProgress = Phaser.Math.Clamp(
          (beamX + SCANNER.BEAM_WIDTH) / (GAME_WIDTH + SCANNER.BEAM_WIDTH * 2),
          0,
          1
        );

        this.beam?.setX(beamX);

        this.getActiveItems().forEach((item) => {
          if (item.x < beamX + SCANNER.BEAM_WIDTH * 0.5 && !item.getData("scanned")) {
            item.setData("scanned", true);
            item.applyScannerTint();
          }
        });
      },
      onComplete: () => {
        this.beam?.destroy();
        this.beam = null;
        this.beamX = GAME_WIDTH + SCANNER.BEAM_WIDTH;
      },
    });

    this.scene.cameras.main.flash(140, 120, 255, 220, false);
    this.durationTimer = this.scene.time.delayedCall(this.activeDurationMs, () => this.deactivate());
  }

  cleanup(): void {
    this.stop();
  }

  getProgress(): number {
    if (this._isActive) return this.activeProgress;
    if (this.cooldownTimer) return this.cooldownTimer.getProgress();
    return 0;
  }

  getIsActive(): boolean {
    return this._isActive;
  }

  private deactivate(): void {
    if (!this._isActive) return;

    this.getActiveItems().forEach((item) => {
      item.clearScannerTint();
      item.setData("scannerPrepared", false);
      item.setData("scanned", false);
    });

    this.scene.tweens.add({
      targets: this.overlay,
      alpha: 0,
      duration: SCANNER.FADE_MS,
    });

    this.scene.tweens.add({
      targets: this.scanlines,
      alpha: 0,
      duration: SCANNER.FADE_MS,
    });

    this.beam?.destroy();
    this.beam = null;
    this.beamX = -SCANNER.BEAM_WIDTH;
    this._isActive = false;
    this.activeProgress = 0;
    this.scheduleNextActivation();
  }

  private scheduleNextActivation(): void {
    const delay = SCANNER.COOLDOWN_MS + Phaser.Math.Between(-SCANNER.JITTER_MS, SCANNER.JITTER_MS);
    this.cooldownTimer = this.scene.time.delayedCall(delay, () => this.activate());
  }

  private getScaledDurationMs(): number {
    const multiplier = Math.max(1, this.getComboMultiplier());
    const bonusDuration = Math.max(0, multiplier - 1) * SCANNER.DURATION_BONUS_PER_MULTIPLIER_MS;
    return Math.min(SCANNER.MAX_DURATION_MS, SCANNER.DURATION_MS + bonusDuration);
  }
}
