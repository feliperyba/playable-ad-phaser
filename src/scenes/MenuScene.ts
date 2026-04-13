import Phaser from "phaser";
import {
  ABYSS,
  COLOR,
  FONT,
  GAME_HEIGHT,
  GAME_WIDTH,
  ITEM_CONFIGS,
  ItemType,
  MENU_COPY,
  MENU_LAYOUT,
  PARTYHAT_BRAND,
  TEXTURE_KEY,
  TYPO,
} from "../config/constants";

interface RainItem {
  container: Phaser.GameObjects.Container;
  base: Phaser.GameObjects.Image;
  overlay: Phaser.GameObjects.Image;
  type: ItemType;
  looping: boolean;
  baseX: number;
  swayAmplitude: number;
  swaySpeed: number;
  swayOffset: number;
  fallSpeed: number;
  fallPulseAmplitude: number;
  fallPulseSpeed: number;
  fallPulseOffset: number;
  rotationSpeed: number;
  rotationWaveAmplitude: number;
  rotationWaveSpeed: number;
  rotationWaveOffset: number;
  driftAmplitude: number;
  driftSpeed: number;
  driftOffset: number;
  scaleBias: number;
  scaleNearTop: number;
  scaleNearBottom: number;
  scalePulseSpeed: number;
  scalePulseOffset: number;
  nextGlitchAt: number;
}

interface AbyssParticle {
  img: Phaser.GameObjects.Image;
  angle: number;
  dist: number;
  speed: number;
}

const MENU_ITEMS = [
  { type: ItemType.PASSWORD, width: 78, height: 78 },
  { type: ItemType.EMAIL, width: 92, height: 72 },
  { type: ItemType.SELFIE, width: 90, height: 104 },
  { type: ItemType.CREDIT_CARD, width: 104, height: 78 },
];

const RAIN_TOP = 680;
const RAIN_BOTTOM = 1460;
const MENU_RAIN_COUNT = 22;
const RAIN_SPAWN_X_MIN = 86;
const RAIN_SPAWN_X_MAX = GAME_WIDTH - 86;
const RAIN_RESPAWN_Y_MIN = -180;
const RAIN_RESPAWN_Y_MAX = -28;
const RAIN_INITIAL_Y_MIN = -120;
const RAIN_INITIAL_Y_MAX = RAIN_BOTTOM - 150;

export class MenuScene extends Phaser.Scene {
  private rainItems: RainItem[] = [];
  private hasStarted = false;
  private scannerBeam?: Phaser.GameObjects.Image;
  private abyssGlowGfx?: Phaser.GameObjects.Graphics;
  private abyssVortexGfx?: Phaser.GameObjects.Graphics;
  private abyssRingGfx?: Phaser.GameObjects.Graphics;
  private abyssParticles: AbyssParticle[] = [];
  private vortexAngle = 0;
  private nextDirectorEventAt = 0;

  constructor() {
    super({ key: "MenuScene" });
  }

  create(): void {
    this.createBackdrop();
    this.createHero();
    this.createBottomCluster();
    this.nextDirectorEventAt = this.time.now + Phaser.Math.Between(2200, 3600);
  }

  update(_time: number, delta: number): void {
    const now = this.time.now;
    this.updateAbyssPulse();
    this.updateAbyssParticles(delta);

    this.updateSceneDirector(now);

    for (let index = this.rainItems.length - 1; index >= 0; index -= 1) {
      const item = this.rainItems[index];
      const depthProgress = this.getRainProgress(item);
      const dynamicFallSpeed = item.fallSpeed * (
        1
        + depthProgress * 0.26
        + Math.sin(now * item.fallPulseSpeed + item.fallPulseOffset) * item.fallPulseAmplitude
      );

      item.container.y += dynamicFallSpeed * (delta / 1000);
      item.container.rotation += (
        item.rotationSpeed
        + Math.sin(now * item.rotationWaveSpeed + item.rotationWaveOffset) * item.rotationWaveAmplitude
      ) * (delta / 1000);
      item.container.x = item.baseX
        + Math.sin(now * item.swaySpeed + item.swayOffset) * item.swayAmplitude
        + Math.cos(now * item.driftSpeed + item.driftOffset) * item.driftAmplitude * (0.35 + depthProgress * 0.8);
      this.updateRainItemScale(item, now);
      this.applyHeroProtection(item, delta);

      if (item.container.y > RAIN_BOTTOM + 90) {
        if (!item.looping) {
          item.container.destroy(true);
          this.rainItems.splice(index, 1);
          continue;
        }

        this.positionRainItem(item, false);
        this.randomizeRainItemProfile(item);
        item.nextGlitchAt = now + Phaser.Math.Between(600, 1800);
        item.base.setAlpha(0.96).setAngle(0);
        item.overlay.setAlpha(0).setPosition(0, 0).setAngle(0);
        this.updateRainItemScale(item, now);
      }

      if (now >= item.nextGlitchAt) {
        this.playGlitchReveal(item);
        item.nextGlitchAt = now + Phaser.Math.Between(1500, 3200);
      }
    }
  }

  private createBackdrop(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLOR.SITE_NAVY)
      .setDepth(-30);

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, TEXTURE_KEY.BACKGROUND)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(-20)
      .setAlpha(0.12);

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, TEXTURE_KEY.VIGNETTE)
      .setDepth(40)
      .setAlpha(0.22)
      .setTint(0x000000);

    this.createAbyssBackdrop();

    for (let i = 0; i < MENU_RAIN_COUNT; i++) {
      this.spawnRainItem(i);
    }
  }

  private createHero(): void {
    const centerX = GAME_WIDTH / 2;
    const titleY = MENU_LAYOUT.TITLE_Y + 18;
    const subtitleY = MENU_LAYOUT.SUBTITLE_Y + 58;

    const titleGlow = this.add.text(centerX, titleY + 8, MENU_COPY.TITLE, {
      fontSize: "146px",
      fontFamily: FONT.DISPLAY,
      color: "#fd5ab8",
      align: "center",
      lineSpacing: -8,
    })
      .setOrigin(0.5)
      .setAlpha(0.1)
      .setDepth(6);

    const title = this.add.text(centerX, titleY, MENU_COPY.TITLE, {
      fontSize: "146px",
      fontFamily: FONT.DISPLAY,
      color: "#ffffff",
      align: "center",
      lineSpacing: -8,
      stroke: "#09111a",
      strokeThickness: 5,
    })
      .setOrigin(0.5)
      .setShadow(0, 7, "#02050a", 10, true, true)
      .setDepth(7);

    const subtitle = this.add.text(centerX, subtitleY, MENU_COPY.SUBTITLE, {
      fontSize: "44px",
      fontFamily: FONT.BODY,
      fontStyle: "700",
      color: "#eef6ff",
      align: "center",
      stroke: "#09111a",
      strokeThickness: 4,
      wordWrap: { width: 740 },
    })
      .setOrigin(0.5)
      .setShadow(0, 5, "#02050a", 8, true, true)
      .setDepth(7);

    const titleBounds = title.getBounds();
    const subtitleBounds = subtitle.getBounds();
    const titlePlateWidth = Math.min(GAME_WIDTH - 120, titleBounds.width + 92);
    const titlePlateHeight = titleBounds.height + 54;
    const subtitlePlateWidth = Math.min(GAME_WIDTH - 280, subtitleBounds.width + 84);
    const subtitlePlateHeight = subtitleBounds.height + 34;

    const heroScrim = this.add.graphics().setDepth(5);
    heroScrim.fillStyle(0x02060c, 0.18);
    heroScrim.fillEllipse(centerX, titleY + 54, titlePlateWidth + 240, titlePlateHeight + 128);
    heroScrim.fillStyle(0x06101a, 0.5);
    heroScrim.fillRoundedRect(
      centerX - titlePlateWidth / 2,
      titleY - titlePlateHeight / 2 + 6,
      titlePlateWidth,
      titlePlateHeight,
      42
    );
    heroScrim.fillStyle(0x09111a, 0.72);
    heroScrim.fillRoundedRect(
      centerX - subtitlePlateWidth / 2,
      subtitleY - subtitlePlateHeight / 2,
      subtitlePlateWidth,
      subtitlePlateHeight,
      26
    );
    heroScrim.lineStyle(2, 0xffffff, 0.05);
    heroScrim.strokeRoundedRect(
      centerX - titlePlateWidth / 2,
      titleY - titlePlateHeight / 2 + 6,
      titlePlateWidth,
      titlePlateHeight,
      42
    );
    heroScrim.lineStyle(2, COLOR.PARTYHAT_PINK, 0.22);
    heroScrim.strokeRoundedRect(
      centerX - subtitlePlateWidth / 2,
      subtitleY - subtitlePlateHeight / 2,
      subtitlePlateWidth,
      subtitlePlateHeight,
      26
    );

    titleGlow.setDepth(6);
    title.setDepth(7);
    subtitle.setDepth(7);

    const subtitleAccentY = subtitleY - subtitlePlateHeight / 2 - 16;
    const accentWidth = Math.min(220, subtitlePlateWidth * 0.38);
    const titleAccent = this.add.rectangle(centerX, subtitleAccentY, accentWidth, 4, COLOR.PARTYHAT_PINK, 0.92)
      .setOrigin(0.5)
      .setDepth(7);

    const mascotHangX = titleBounds.right - 112;
    const mascotHangY = titleBounds.bottom - 12;

    this.add.rectangle(mascotHangX, mascotHangY - 4, 2, 24, COLOR.PARTYHAT_PINK, 0.72)
      .setOrigin(0.5, 0)
      .setDepth(7);

    const mascotHeight = PARTYHAT_BRAND.MASCOT_SIZE * 0.72;
    const mascotWidth = mascotHeight * (23 / 51);

    const mascotShadow = this.add.ellipse(
      mascotHangX,
      mascotHangY + mascotHeight * 0.66,
      mascotWidth * 0.92,
      18,
      0x000000,
      0.18
    ).setDepth(6);

    const mascot = this.add.image(
      mascotHangX,
      mascotHangY + mascotHeight * 0.42,
      TEXTURE_KEY.PARTYHAT_MASCOT
    )
      .setDisplaySize(mascotWidth, mascotHeight)
      .setAngle(4)
      .setDepth(8);

    this.tweens.add({
      targets: mascot,
      y: mascotHangY + mascotHeight * 0.47,
      angle: 7,
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.tweens.add({
      targets: mascotShadow,
      scaleX: { from: 1, to: 1.08 },
      alpha: { from: 0.18, to: 0.11 },
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.tweens.add({
      targets: [title, titleAccent],
      alpha: { from: 0.95, to: 1 },
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });


    const scanner = this.add.image(-120, this.getAbyssCenterY(), TEXTURE_KEY.SCANNER_BEAM)
      .setDisplaySize(110, 700)
      .setAlpha(0.06)
      .setDepth(4);
    this.scannerBeam = scanner;

    this.tweens.add({
      targets: scanner,
      x: { from: -120, to: GAME_WIDTH + 120 },
      duration: 2000,
      ease: "Sine.easeInOut",
      repeat: -1,
      repeatDelay: 2800,
    });
  }

  private createBottomCluster(): void {
    const button = this.add.image(GAME_WIDTH / 2, MENU_LAYOUT.CTA_Y, TEXTURE_KEY.BUTTON_PRIMARY)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });
    button.on("pointerdown", () => this.startGame());

    this.add.text(GAME_WIDTH / 2, MENU_LAYOUT.CTA_Y, MENU_COPY.CTA_TEXT, {
      fontSize: TYPO.SUBTITLE,
      fontFamily: FONT.DISPLAY,
      color: "#ffffff",
      letterSpacing: 1,
    })
      .setOrigin(0.5)
      .setDepth(11);

    this.tweens.add({
      targets: button,
      scaleX: { from: 1, to: 1.035 },
      scaleY: { from: 1, to: 1.035 },
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private spawnRainItem(index: number): void {
    const config = Phaser.Utils.Array.GetRandom(MENU_ITEMS);
    const itemConfig = ITEM_CONFIGS[config.type];
    const container = this.add.container(
      0,
      0
    ).setDepth(4);

    const base = this.add.image(
      0,
      0,
      itemConfig.neutralTextureKey
    )
      .setDisplaySize(config.width, config.height)
      .setAlpha(0.94);

    const overlay = this.add.image(0, 0, itemConfig.safeTextureKey)
      .setDisplaySize(config.width, config.height)
      .setAlpha(0)
      .setBlendMode(Phaser.BlendModes.SCREEN);

    container.add([base, overlay]);

    const rainItem: RainItem = {
      container,
      base,
      overlay,
      type: config.type,
      looping: true,
      baseX: container.x,
      swayAmplitude: Phaser.Math.Between(3, 10),
      swaySpeed: Phaser.Math.FloatBetween(0.0007, 0.0013),
      swayOffset: index * 0.65,
      fallSpeed: Phaser.Math.Between(56, 86),
      fallPulseAmplitude: 0.08,
      fallPulseSpeed: Phaser.Math.FloatBetween(0.0021, 0.0036),
      fallPulseOffset: Phaser.Math.FloatBetween(0, Math.PI * 2),
      rotationSpeed: Phaser.Math.FloatBetween(-0.022, 0.022),
      rotationWaveAmplitude: 0.01,
      rotationWaveSpeed: Phaser.Math.FloatBetween(0.0015, 0.0032),
      rotationWaveOffset: Phaser.Math.FloatBetween(0, Math.PI * 2),
      driftAmplitude: Phaser.Math.FloatBetween(8, 22),
      driftSpeed: Phaser.Math.FloatBetween(0.0012, 0.0024),
      driftOffset: Phaser.Math.FloatBetween(0, Math.PI * 2),
      scaleBias: 1,
      scaleNearTop: 0.9,
      scaleNearBottom: 1.2,
      scalePulseSpeed: Phaser.Math.FloatBetween(0.0012, 0.0019),
      scalePulseOffset: Phaser.Math.FloatBetween(0, Math.PI * 2),
      nextGlitchAt: this.time.now + Phaser.Math.Between(900, 2600),
    };

    this.randomizeRainItemProfile(rainItem);
    this.positionRainItem(rainItem, true);
    this.updateRainItemScale(rainItem, this.time.now);
    this.rainItems.push(rainItem);
  }

  private spawnDirectedRainItem(
    type: ItemType,
    x: number,
    y: number,
    options?: {
      fallMultiplier?: number;
      scaleMultiplier?: number;
      rotationMultiplier?: number;
      driftMultiplier?: number;
      glitchDelay?: number;
    }
  ): void {
    const menuConfig = MENU_ITEMS.find((item) => item.type === type) ?? MENU_ITEMS[0];
    const itemConfig = ITEM_CONFIGS[type];
    const container = this.add.container(x, y).setDepth(5);

    const base = this.add.image(0, 0, itemConfig.neutralTextureKey)
      .setDisplaySize(menuConfig.width, menuConfig.height)
      .setAlpha(0.96);

    const overlay = this.add.image(0, 0, itemConfig.safeTextureKey)
      .setDisplaySize(menuConfig.width, menuConfig.height)
      .setAlpha(0)
      .setBlendMode(Phaser.BlendModes.SCREEN);

    container.add([base, overlay]);

    const rainItem: RainItem = {
      container,
      base,
      overlay,
      type,
      looping: false,
      baseX: x,
      swayAmplitude: Phaser.Math.Between(6, 14),
      swaySpeed: Phaser.Math.FloatBetween(0.0009, 0.0017),
      swayOffset: Phaser.Math.FloatBetween(0, Math.PI * 2),
      fallSpeed: Phaser.Math.Between(70, 112),
      fallPulseAmplitude: Phaser.Math.FloatBetween(0.12, 0.24),
      fallPulseSpeed: Phaser.Math.FloatBetween(0.0023, 0.0043),
      fallPulseOffset: Phaser.Math.FloatBetween(0, Math.PI * 2),
      rotationSpeed: Phaser.Math.FloatBetween(-0.08, 0.08),
      rotationWaveAmplitude: Phaser.Math.FloatBetween(0.025, 0.08),
      rotationWaveSpeed: Phaser.Math.FloatBetween(0.0018, 0.0042),
      rotationWaveOffset: Phaser.Math.FloatBetween(0, Math.PI * 2),
      driftAmplitude: Phaser.Math.FloatBetween(14, 34),
      driftSpeed: Phaser.Math.FloatBetween(0.0014, 0.0032),
      driftOffset: Phaser.Math.FloatBetween(0, Math.PI * 2),
      scaleBias: 1,
      scaleNearTop: 1,
      scaleNearBottom: 1.4,
      scalePulseSpeed: Phaser.Math.FloatBetween(0.0011, 0.0019),
      scalePulseOffset: Phaser.Math.FloatBetween(0, Math.PI * 2),
      nextGlitchAt: this.time.now + (options?.glitchDelay ?? Phaser.Math.Between(250, 900)),
    };

    this.randomizeRainItemProfile(rainItem);
    rainItem.looping = false;

    if (options?.fallMultiplier) {
      rainItem.fallSpeed *= options.fallMultiplier;
    }
    if (options?.scaleMultiplier) {
      rainItem.scaleBias *= options.scaleMultiplier;
      rainItem.scaleNearTop *= options.scaleMultiplier;
      rainItem.scaleNearBottom *= options.scaleMultiplier;
    }
    if (options?.rotationMultiplier) {
      rainItem.rotationSpeed *= options.rotationMultiplier;
      rainItem.rotationWaveAmplitude *= options.rotationMultiplier;
    }
    if (options?.driftMultiplier) {
      rainItem.driftAmplitude *= options.driftMultiplier;
    }

    this.updateRainItemScale(rainItem, this.time.now);
    this.rainItems.push(rainItem);
  }

  private playGlitchReveal(item: RainItem): void {
    const revealKey = Phaser.Math.Between(0, 100) < 38
      ? ITEM_CONFIGS[item.type].dangerTextureKey
      : ITEM_CONFIGS[item.type].safeTextureKey;

    this.tweens.killTweensOf(item.base);
    this.tweens.killTweensOf(item.overlay);

    item.overlay
      .setTexture(revealKey)
      .setAlpha(0)
      .setPosition(0, 0)
      .setAngle(0);

    item.base.setAlpha(0.96).setAngle(0);

    this.tweens.add({
      targets: item.overlay,
      alpha: { from: 0, to: 0.54 },
      duration: 140,
      yoyo: true,
      hold: 90,
      repeat: 1,
      ease: "Sine.easeInOut",
      onUpdate: () => {
        item.overlay.x = Phaser.Math.Between(-2, 2);
        item.overlay.y = Phaser.Math.Between(-1, 1);
      },
      onComplete: () => {
        item.overlay.setAlpha(0).setPosition(0, 0).setAngle(0);
      },
    });

    this.tweens.add({
      targets: item.overlay,
      angle: { from: -0.9, to: 0.9 },
      duration: 180,
      yoyo: true,
      ease: "Sine.easeInOut",
    });

    this.tweens.add({
      targets: item.base,
      alpha: { from: 0.82, to: 0.96 },
      duration: 140,
      yoyo: true,
      ease: "Sine.easeInOut",
    });
  }

  private createAbyssBackdrop(): void {
    this.abyssGlowGfx = this.add.graphics().setDepth(0);
    this.abyssVortexGfx = this.add.graphics().setDepth(1);
    this.abyssRingGfx = this.add.graphics().setDepth(2);

    this.setupAbyssParticles();
    this.updateAbyssPulse();
  }

  private setupAbyssParticles(): void {
    const cx = GAME_WIDTH / 2;
    const cy = this.getAbyssCenterY();
    const radius = 228;

    for (let i = 0; i < 22; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 0.45 + Math.random() * 0.55;
      const px = cx + Math.cos(angle) * radius * dist;
      const py = cy + Math.sin(angle) * radius * dist;
      const color = ABYSS.PARTICLE_COLORS[Math.floor(Math.random() * ABYSS.PARTICLE_COLORS.length)];
      const baseScale = 0.18 + Math.random() * 0.22;

      const img = this.add.image(px, py, TEXTURE_KEY.ABYSS_PARTICLE)
        .setDepth(3)
        .setAlpha(0.18 + Math.random() * 0.22)
        .setScale(baseScale)
        .setTint(color);

      this.tweens.add({
        targets: img,
        alpha: { from: img.alpha, to: 0.04 },
        scale: { from: baseScale, to: baseScale * 0.55 },
        duration: 1600 + Math.random() * 1200,
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 1600,
        ease: "Sine.easeInOut",
      });

      this.abyssParticles.push({
        img,
        angle,
        dist,
        speed: 0.002 + Math.random() * 0.002,
      });
    }
  }

  private updateAbyssParticles(delta: number): void {
    const dt = delta / 1000;
    const cx = GAME_WIDTH / 2;
    const cy = this.getAbyssCenterY();
    const radius = 228;

    for (const particle of this.abyssParticles) {
      particle.angle += particle.speed * (delta / 16.6667);
      particle.dist = Math.max(0.16, particle.dist - 0.018 * dt);

      const px = cx + Math.cos(particle.angle) * radius * particle.dist;
      const py = cy + Math.sin(particle.angle) * radius * particle.dist;
      particle.img.setPosition(px, py);

      if (particle.dist <= 0.18) {
        particle.dist = 0.58 + Math.random() * 0.38;
        particle.angle = Math.random() * Math.PI * 2;
        particle.speed = 0.002 + Math.random() * 0.002;
      }
    }
  }

  private updateAbyssPulse(): void {
    if (!this.abyssGlowGfx || !this.abyssVortexGfx || !this.abyssRingGfx) {
      return;
    }

    const cx = GAME_WIDTH / 2;
    const cy = this.getAbyssCenterY();
    const pulseWave = Math.sin(this.time.now * 0.0028);
    const outerRadius = 316 + pulseWave * 20;
    const globalPulse = 0.76 + pulseWave * 0.22;

    this.vortexAngle += ABYSS.VORTEX_SPIN_SPEED * 0.7;

    this.abyssGlowGfx.clear();
    const shadowLayers = [
      { radius: outerRadius + 104, color: 0x02040b, alpha: 0.18 },
      { radius: outerRadius + 64, color: 0x080113, alpha: 0.15 },
      { radius: outerRadius + 28, color: 0x120218, alpha: 0.12 },
    ];
    const glowLayers = [
      { radius: outerRadius + 70, color: 0xff4a9d, alpha: 0.012 },
      { radius: outerRadius + 34, color: 0xd82f9b, alpha: 0.02 },
      { radius: outerRadius - 4, color: 0x6c24cf, alpha: 0.035 },
      { radius: outerRadius - 42, color: 0x1b0523, alpha: 0.08 },
    ];

    for (const layer of shadowLayers) {
      this.abyssGlowGfx.fillStyle(layer.color, layer.alpha);
      this.abyssGlowGfx.fillCircle(cx, cy, layer.radius);
    }

    for (const layer of glowLayers) {
      this.abyssGlowGfx.fillStyle(layer.color, layer.alpha * globalPulse);
      this.abyssGlowGfx.fillCircle(cx, cy, layer.radius);
    }

    this.abyssGlowGfx.fillStyle(0x120114, 0.18 + globalPulse * 0.04);
    this.abyssGlowGfx.fillCircle(cx, cy, outerRadius - 54);

    this.abyssGlowGfx.fillStyle(0x010108, 0.84);
    this.abyssGlowGfx.fillCircle(cx, cy, outerRadius - 122);

    this.abyssGlowGfx.fillStyle(0x000000, 0.9);
    this.abyssGlowGfx.fillCircle(cx, cy, outerRadius - 162);

    this.abyssVortexGfx.clear();
    this.drawVortexArms(cx, cy, outerRadius - 18, outerRadius - 18, globalPulse);

    this.abyssRingGfx.clear();
    this.abyssRingGfx.lineStyle(18, 0x8f35ff, 0.24 + Math.sin(this.time.now * 0.0031) * 0.05);
    this.abyssRingGfx.strokeCircle(cx, cy, outerRadius + 16);
    this.abyssRingGfx.lineStyle(6, 0xff5aa9, 0.18 + Math.sin(this.time.now * 0.0026) * 0.05);
    this.abyssRingGfx.strokeCircle(cx, cy, outerRadius + 2);
    this.abyssRingGfx.lineStyle(2, 0xc76cff, 0.11 + Math.sin(this.time.now * 0.004) * 0.03);
    this.abyssRingGfx.strokeCircle(cx, cy, outerRadius - 12);
  }

  private drawVortexArms(
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    globalPulse: number
  ): void {
    if (!this.abyssVortexGfx) {
      return;
    }

    const gfx = this.abyssVortexGfx;
    const segs = ABYSS.VORTEX_SEGMENTS;

    for (let arm = 0; arm < ABYSS.VORTEX_ARMS; arm++) {
      const baseAngle = this.vortexAngle + (arm / ABYSS.VORTEX_ARMS) * Math.PI * 2;
      const armPulse = Math.sin(this.time.now * 0.0019 + arm * 1.35) * 0.16;
      const [c1, c2] = ABYSS.ARM_COLORS[arm % ABYSS.ARM_COLORS.length];
      const col1 = Phaser.Display.Color.IntegerToColor(c1);
      const col2 = Phaser.Display.Color.IntegerToColor(c2);

      const passes = [
        { width: 22, alphaMul: 0.07 },
        { width: 11, alphaMul: 0.16 },
        { width: 4, alphaMul: 0.34 },
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
            col1,
            col2,
            100,
            Math.round(tm * 100)
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

  private updateRainItemScale(item: RainItem, now: number): void {
    const progress = this.getRainProgress(item);
    const eased = progress * progress * (3 - 2 * progress);
    const perspectiveScale = Phaser.Math.Linear(item.scaleNearTop, item.scaleNearBottom, eased) * item.scaleBias;
    const pulse = Math.sin(now * item.scalePulseSpeed + item.scalePulseOffset) * 0.026;
    item.container.setScale(perspectiveScale + pulse);
  }

  private randomizeRainItemProfile(item: RainItem): void {
    item.scaleBias = Phaser.Math.FloatBetween(0.96, 1.42);
    item.scaleNearTop = Phaser.Math.FloatBetween(0.92, 1.18);
    item.scaleNearBottom = Phaser.Math.FloatBetween(1.42, 2.04);
    item.scalePulseSpeed = Phaser.Math.FloatBetween(0.001, 0.0018);
    item.scalePulseOffset = Phaser.Math.FloatBetween(0, Math.PI * 2);
    item.swayAmplitude = Phaser.Math.Between(5, 16);
    item.swaySpeed = Phaser.Math.FloatBetween(0.0008, 0.0015);
    item.fallSpeed = Phaser.Math.Between(62, 108);
    item.fallPulseAmplitude = Phaser.Math.FloatBetween(0.08, 0.22);
    item.fallPulseSpeed = Phaser.Math.FloatBetween(0.0021, 0.0041);
    item.fallPulseOffset = Phaser.Math.FloatBetween(0, Math.PI * 2);
    item.driftAmplitude = Phaser.Math.FloatBetween(10, 34);
    item.driftSpeed = Phaser.Math.FloatBetween(0.0012, 0.0031);
    item.driftOffset = Phaser.Math.FloatBetween(0, Math.PI * 2);

    if (Math.random() < 0.38) {
      item.rotationSpeed = Phaser.Math.FloatBetween(-0.2, 0.2);
      item.rotationWaveAmplitude = Phaser.Math.FloatBetween(0.08, 0.18);
      item.rotationWaveSpeed = Phaser.Math.FloatBetween(0.0024, 0.0046);
    } else {
      item.rotationSpeed = Phaser.Math.FloatBetween(-0.05, 0.05);
      item.rotationWaveAmplitude = Phaser.Math.FloatBetween(0.012, 0.05);
      item.rotationWaveSpeed = Phaser.Math.FloatBetween(0.0012, 0.0028);
    }

    item.rotationWaveOffset = Phaser.Math.FloatBetween(0, Math.PI * 2);
  }

  private updateSceneDirector(now: number): void {
    if (now < this.nextDirectorEventAt) {
      return;
    }

    const eventRoll = Phaser.Math.Between(0, 2);
    if (eventRoll === 0) {
      this.triggerFanDropEvent();
    } else if (eventRoll === 1) {
      this.triggerZigZagDropEvent();
    } else {
      this.triggerCrossfireDropEvent();
    }

    this.pulseScannerMoment();
    this.nextDirectorEventAt = now + Phaser.Math.Between(3600, 5600);
  }

  private triggerFanDropEvent(): void {
    const count = Phaser.Math.Between(5, 7);
    const centerX = Phaser.Math.Between(300, GAME_WIDTH - 300);
    const spread = Phaser.Math.Between(88, 116);
    const chosenType = Phaser.Utils.Array.GetRandom(MENU_ITEMS).type;

    for (let i = 0; i < count; i += 1) {
      const offset = i - (count - 1) / 2;
      this.spawnDirectedRainItem(
        chosenType,
        centerX + offset * spread + Phaser.Math.Between(-12, 12),
        Phaser.Math.Between(-210, -70) - i * Phaser.Math.Between(20, 34),
        {
          fallMultiplier: 1.14,
          scaleMultiplier: 1.18,
          rotationMultiplier: 1.55,
          driftMultiplier: 1.1,
          glitchDelay: 180 + i * 120,
        }
      );
    }
  }

  private triggerZigZagDropEvent(): void {
    const count = Phaser.Math.Between(6, 8);
    const stepX = GAME_WIDTH / (count + 1);

    for (let i = 0; i < count; i += 1) {
      const type = Phaser.Utils.Array.GetRandom(MENU_ITEMS).type;
      const zig = i % 2 === 0 ? -44 : 44;

      this.spawnDirectedRainItem(
        type,
        stepX * (i + 1) + zig + Phaser.Math.Between(-14, 14),
        Phaser.Math.Between(-230, -80) - i * Phaser.Math.Between(12, 26),
        {
          fallMultiplier: 1.22,
          scaleMultiplier: 1.12,
          rotationMultiplier: 1.2,
          driftMultiplier: 1.35,
          glitchDelay: 220 + i * 90,
        }
      );
    }
  }

  private triggerCrossfireDropEvent(): void {
    const countPerSide = Phaser.Math.Between(3, 4);

    for (let i = 0; i < countPerSide; i += 1) {
      const leftType = Phaser.Utils.Array.GetRandom(MENU_ITEMS).type;
      const rightType = Phaser.Utils.Array.GetRandom(MENU_ITEMS).type;
      const y = Phaser.Math.Between(-220, -90) - i * Phaser.Math.Between(26, 38);

      this.spawnDirectedRainItem(leftType, Phaser.Math.Between(78, 188), y, {
        fallMultiplier: 1.28,
        scaleMultiplier: 1.16,
        rotationMultiplier: 1.5,
        driftMultiplier: 1.7,
        glitchDelay: 180 + i * 110,
      });

      this.spawnDirectedRainItem(rightType, Phaser.Math.Between(GAME_WIDTH - 188, GAME_WIDTH - 78), y - 18, {
        fallMultiplier: 1.28,
        scaleMultiplier: 1.16,
        rotationMultiplier: 1.5,
        driftMultiplier: 1.7,
        glitchDelay: 240 + i * 110,
      });
    }
  }

  private pulseScannerMoment(): void {
    if (!this.scannerBeam) {
      return;
    }

    this.tweens.add({
      targets: this.scannerBeam,
      alpha: { from: 0.07, to: 0.16 },
      duration: 280,
      yoyo: true,
      ease: "Sine.easeInOut",
    });
  }

  private getRainProgress(item: RainItem): number {
    const startY = RAIN_TOP - 260;
    const endY = RAIN_BOTTOM;
    return Phaser.Math.Clamp((item.container.y - startY) / (endY - startY), 0, 1);
  }

  private positionRainItem(item: RainItem, initial: boolean): void {
    let x = RAIN_SPAWN_X_MIN;
    let y = initial
      ? Phaser.Math.Between(RAIN_INITIAL_Y_MIN, RAIN_INITIAL_Y_MAX)
      : Phaser.Math.Between(RAIN_RESPAWN_Y_MIN, RAIN_RESPAWN_Y_MAX);

    for (let attempt = 0; attempt < 6; attempt += 1) {
      x = Phaser.Math.Between(RAIN_SPAWN_X_MIN, RAIN_SPAWN_X_MAX);

      if (y < 660 && x > 150 && x < GAME_WIDTH - 150) {
        continue;
      }

      break;
    }

    item.baseX = x;
    item.container.x = x;
    item.container.y = y;
  }

  private applyHeroProtection(item: RainItem, delta: number): void {
    const heroTop = 170;
    const heroBottom = 720;
    const heroHalfWidth = 340;

    if (item.container.y < heroTop || item.container.y > heroBottom) {
      item.container.setAlpha(1);
      return;
    }

    const distanceX = item.container.x - GAME_WIDTH / 2;
    const overlap = 1 - Math.abs(distanceX) / heroHalfWidth;

    if (overlap <= 0) {
      item.container.setAlpha(1);
      return;
    }

    const direction = distanceX === 0 ? (item.baseX < GAME_WIDTH / 2 ? -1 : 1) : Math.sign(distanceX);
    item.baseX += direction * overlap * 0.55 * (delta / 16.6667);
    item.baseX = Phaser.Math.Clamp(item.baseX, RAIN_SPAWN_X_MIN, RAIN_SPAWN_X_MAX);
    item.container.setAlpha(1 - overlap * 0.38);
  }

  private getAbyssCenterY(): number {
    return MENU_LAYOUT.HERO_CENTER_Y + 60;
  }

  private startGame(): void {
    if (this.hasStarted) return;
    this.hasStarted = true;
    this.cameras.main.flash(180, 253, 90, 184);
    this.time.delayedCall(120, () => this.scene.start("GameScene"));
  }
}
