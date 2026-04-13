import {
  GAME_WIDTH,
  GAME_HEIGHT,
  COLOR,
  SCANNER,
  TEXTURE_KEY,
  ITEM_CONFIGS,
  ABYSS,
} from "../config/constants";
import { ITEM_ASSET_URLS, STATIC_ASSET_URLS } from "@assets/assetManifest";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload(): void {
    this.load.image(TEXTURE_KEY.BACKGROUND, STATIC_ASSET_URLS.background);
    this.load.image(TEXTURE_KEY.SHIELD, STATIC_ASSET_URLS.shield);
    this.load.image(TEXTURE_KEY.HEART_FILLED, STATIC_ASSET_URLS.hearts.full);
    this.load.image(TEXTURE_KEY.HEART_EMPTY, STATIC_ASSET_URLS.hearts.empty);
    this.load.image(TEXTURE_KEY.PARTYHAT_WORDMARK, STATIC_ASSET_URLS.partyhat.wordmark);
    this.load.image(TEXTURE_KEY.PARTYHAT_MASCOT, STATIC_ASSET_URLS.partyhat.mascot);
    this.load.image(TEXTURE_KEY.PARTYHAT_BANNER, STATIC_ASSET_URLS.partyhat.banner);
    this.load.image(TEXTURE_KEY.PARTYHAT_FAVICON, STATIC_ASSET_URLS.partyhat.favicon);
    this.load.image(TEXTURE_KEY.PARTYHAT_WEBCLIP, STATIC_ASSET_URLS.partyhat.webclip);

    for (const config of Object.values(ITEM_CONFIGS)) {
      const sources = ITEM_ASSET_URLS[config.type];
      this.load.image(config.neutralTextureKey, sources.neutral);
      this.load.image(config.safeTextureKey, sources.good);
      this.load.image(config.dangerTextureKey, sources.bad);
    }
  }

  create(): void {
    this.generateScannerBeam();
    this.generateAbyssTextures();
    this.generateButton();
    this.generateUtilityTextures();
    this.generateVignette();
    this.scene.start("MenuScene");
  }

  private generateScannerBeam(): void {
    const w = SCANNER.BEAM_WIDTH;
    const h = GAME_HEIGHT;
    const g = this.add.graphics();
    const steps = 70;
    const halfW = w / 2;

    for (let i = 0; i < steps; i++) {
      const x = (i / steps) * w;
      const distFromCenter = Math.abs(x - halfW) / halfW;
      const alpha = Math.pow(Math.max(1 - distFromCenter, 0), 1.5) * 0.95;
      const tint = distFromCenter < 0.18
        ? 0xffffff
        : distFromCenter < 0.42
          ? 0x8fffe4
          : 0xff4a86;
      g.fillStyle(tint, alpha);
      g.fillRect(x, 0, w / steps + 2, h);
    }

    g.generateTexture(TEXTURE_KEY.SCANNER_BEAM, w, h);
    g.destroy();
  }

  private generateAbyssTextures(): void {
    this.generateAbyssGlow();
    this.generateAbyssVortex();
    this.generateAbyssRing();
    this.generateAbyssGroundGlow();
    this.generateAbyssParticle();
  }

  private generateAbyssGlow(): void {
    const w = ABYSS.HOLE_WIDTH + 200;
    const h = ABYSS.HOLE_HEIGHT + 120;
    const cx = w / 2;
    const cy = h / 2;
    const g = this.add.graphics();

    for (let i = ABYSS.GLOW_LAYERS; i >= 0; i--) {
      const t = i / ABYSS.GLOW_LAYERS;
      const ex = i * ABYSS.GLOW_EXPAND;
      const ey = i * ABYSS.GLOW_EXPAND * 0.5;
      const alpha = 0.03 + (1 - t) * 0.05;
      g.fillStyle(0x6B21A8, alpha);
      g.fillEllipse(cx, cy, (ABYSS.HOLE_WIDTH / 2 + ex) * 2, (ABYSS.HOLE_HEIGHT / 2 + ey) * 2);
    }

    for (let i = 6; i >= 0; i--) {
      const t = i / 6;
      const ex = i * 8;
      const ey = i * 4;
      const alpha = 0.02 + (1 - t) * 0.03;
      g.fillStyle(0x14B8A6, alpha);
      g.fillEllipse(cx, cy, (ABYSS.HOLE_WIDTH / 2 * 0.8 + ex) * 2, (ABYSS.HOLE_HEIGHT / 2 * 0.8 + ey) * 2);
    }

    g.generateTexture(TEXTURE_KEY.ABYSS_GLOW, w, h);
    g.destroy();
  }

  private generateAbyssVortex(): void {
    const w = ABYSS.HOLE_WIDTH;
    const h = ABYSS.HOLE_HEIGHT;
    const cx = w / 2;
    const cy = h / 2;
    const rx = w / 2 - 30;
    const ry = h / 2 - 30;
    const g = this.add.graphics();

    for (let i = 12; i >= 0; i--) {
      const t = i / 12;
      const shrink = i * 3;
      const r = Math.floor(10 + (1 - t) * 30);
      const gr = Math.floor(0 + (1 - t) * 10);
      const b = Math.floor(18 + (1 - t) * 60);
      g.fillStyle(Phaser.Display.Color.GetColor(r, gr, b), 0.15 + (1 - t) * 0.15);
      g.fillEllipse(cx, cy, (rx - shrink) * 2, (ry - shrink) * 2);
    }

    g.fillStyle(0x050010, 1);
    g.fillEllipse(cx, cy, rx * 1.6, ry * 1.6);

    g.fillStyle(0x000000, 1);
    g.fillEllipse(cx, cy, rx * 0.7, ry * 0.7);

    g.generateTexture(TEXTURE_KEY.ABYSS_VORTEX, w, h);
    g.destroy();
  }

  private generateAbyssRing(): void {
    const w = ABYSS.HOLE_WIDTH;
    const h = ABYSS.HOLE_HEIGHT;
    const cx = w / 2;
    const cy = h / 2;
    const rx = w / 2 - 20;
    const ry = h / 2 - 20;
    const g = this.add.graphics();

    for (let i = 5; i >= 0; i--) {
      g.lineStyle(ABYSS.RING_THICKNESS + i * 6, 0x6B21A8, 0.06);
      g.strokeEllipse(cx, cy, rx * 2, ry * 2);
    }

    g.lineStyle(ABYSS.RING_THICKNESS, 0x8B5CF6, 0.95);
    g.strokeEllipse(cx, cy, rx * 2, ry * 2);

    g.lineStyle(4, 0xC084FC, 0.6);
    g.strokeEllipse(cx, cy, rx * 2 - 6, ry * 2 - 3);

    g.lineStyle(ABYSS.RING_INNER_HIGHLIGHT, 0x14B8A6, 0.5);
    g.strokeEllipse(cx, cy, rx * 2 - ABYSS.RING_THICKNESS, ry * 2 - ABYSS.RING_THICKNESS / 2);

    g.lineStyle(2, 0xffffff, 0.12);
    g.strokeEllipse(cx, cy, rx * 2 + 2, ry * 2 + 1);

    g.generateTexture(TEXTURE_KEY.ABYSS_RING, w, h);
    g.destroy();
  }

  private generateAbyssGroundGlow(): void {
    const g = this.add.graphics();
    const w = ABYSS.GROUND_GLOW_WIDTH;
    const h = ABYSS.GROUND_GLOW_HEIGHT;
    const cx = w / 2;
    const cy = h / 2;

    for (let i = 8; i >= 0; i--) {
      const t = i / 8;
      g.fillStyle(0x8B5CF6, 0.03 + (1 - t) * 0.05);
      g.fillEllipse(cx, cy, w * (0.5 + t * 0.5), h * (0.4 + t * 0.6));
    }

    for (let i = 5; i >= 0; i--) {
      const t = i / 5;
      g.fillStyle(0x14B8A6, 0.02 + (1 - t) * 0.03);
      g.fillEllipse(cx, cy - 3, w * (0.3 + t * 0.2), h * (0.2 + t * 0.3));
    }

    g.generateTexture(TEXTURE_KEY.ABYSS_GROUND_GLOW, w, h);
    g.destroy();
  }

  private generateAbyssParticle(): void {
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 4, 4);
    g.fillStyle(0xffffff, 0.3);
    g.fillCircle(4, 4, 7);
    g.generateTexture(TEXTURE_KEY.ABYSS_PARTICLE, 14, 14);
    g.destroy();
  }

  private generateButton(): void {
    const primary = this.add.graphics();
    const primaryWidth = 480;
    const primaryHeight = 104;
    primary.fillStyle(COLOR.PARTYHAT_PINK, 1);
    primary.fillRoundedRect(0, 0, primaryWidth, primaryHeight, 52);
    primary.fillStyle(0xffffff, 0.18);
    primary.fillRoundedRect(22, 18, primaryWidth - 44, 22, 12);
    primary.lineStyle(3, 0xffffff, 0.18);
    primary.strokeRoundedRect(1.5, 1.5, primaryWidth - 3, primaryHeight - 3, 52);
    primary.generateTexture(TEXTURE_KEY.BUTTON_PRIMARY, primaryWidth, primaryHeight);
    primary.generateTexture(TEXTURE_KEY.BUTTON, primaryWidth, primaryHeight);
    primary.destroy();

    const secondary = this.add.graphics();
    const secondaryWidth = 340;
    const secondaryHeight = 74;
    secondary.fillStyle(COLOR.CTA_BUTTON_SECONDARY, 0.82);
    secondary.fillRoundedRect(0, 0, secondaryWidth, secondaryHeight, 37);
    secondary.lineStyle(2, 0xffffff, 0.18);
    secondary.strokeRoundedRect(1, 1, secondaryWidth - 2, secondaryHeight - 2, 37);
    secondary.generateTexture(TEXTURE_KEY.BUTTON_SECONDARY, secondaryWidth, secondaryHeight);
    secondary.destroy();

    const ghost = this.add.graphics();
    const ghostWidth = 320;
    const ghostHeight = 72;
    ghost.fillStyle(COLOR.CTA_BUTTON_SECONDARY, 0.35);
    ghost.fillRoundedRect(0, 0, ghostWidth, ghostHeight, 36);
    ghost.lineStyle(2, COLOR.PARTYHAT_PINK, 0.7);
    ghost.strokeRoundedRect(1, 1, ghostWidth - 2, ghostHeight - 2, 36);
    ghost.generateTexture(TEXTURE_KEY.CTA_GHOST, ghostWidth, ghostHeight);
    ghost.destroy();
  }

  private generateUtilityTextures(): void {
    const gp = this.add.graphics();
    gp.fillStyle(0xffffff, 1);
    gp.fillCircle(4, 4, 4);
    gp.generateTexture(TEXTURE_KEY.CATCH_BURST, 8, 8);
    gp.destroy();

    const gd = this.add.graphics();
    gd.fillStyle(COLOR.DAMAGE_OVERLAY, 0.3);
    gd.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    gd.generateTexture(TEXTURE_KEY.DAMAGE_OVERLAY, GAME_WIDTH, GAME_HEIGHT);
    gd.destroy();

    const halo = this.add.graphics();
    const haloW = 640;
    const haloH = 640;
    const haloCx = haloW / 2;
    const haloCy = haloH / 2;
    for (let i = 10; i >= 0; i--) {
      const t = i / 10;
      halo.fillStyle(COLOR.PARTYHAT_PINK, 0.02 + (1 - t) * 0.05);
      halo.fillEllipse(haloCx, haloCy, 260 + i * 34, 260 + i * 34);
    }
    halo.fillStyle(COLOR.PARTYHAT_PINK_DARK, 0.28);
    halo.fillEllipse(haloCx, haloCy, 240, 240);
    halo.generateTexture(TEXTURE_KEY.HALO_SPOTLIGHT, haloW, haloH);
    halo.destroy();

    const chip = this.add.graphics();
    chip.fillStyle(COLOR.SITE_NAVY_SOFT, 0.94);
    chip.lineStyle(2, COLOR.SITE_RULE, 0.95);
    chip.fillRoundedRect(0, 0, 196, 56, 28);
    chip.strokeRoundedRect(1, 1, 194, 54, 28);
    chip.generateTexture(TEXTURE_KEY.BADGE_CHIP, 196, 56);
    chip.destroy();

    const rail = this.add.graphics();
    rail.fillStyle(COLOR.SITE_NAVY_SOFT, 0.96);
    rail.lineStyle(2, COLOR.SITE_RULE, 0.85);
    rail.fillRoundedRect(0, 0, 820, 108, 28);
    rail.strokeRoundedRect(1, 1, 818, 106, 28);
    rail.generateTexture(TEXTURE_KEY.FEATURE_RAIL, 820, 108);
    rail.destroy();

    const activeRail = this.add.graphics();
    activeRail.fillStyle(COLOR.SITE_NAVY_SOFT, 0.98);
    activeRail.lineStyle(3, COLOR.PARTYHAT_PINK, 0.92);
    activeRail.fillRoundedRect(0, 0, 820, 124, 32);
    activeRail.strokeRoundedRect(1.5, 1.5, 817, 121, 32);
    activeRail.fillStyle(COLOR.PARTYHAT_PINK, 0.08);
    activeRail.fillRoundedRect(18, 14, 160, 96, 22);
    activeRail.generateTexture(TEXTURE_KEY.FEATURE_RAIL_ACTIVE, 820, 124);
    activeRail.destroy();

    const gl = this.add.graphics();
    gl.fillStyle(0x00ffb3, 0.14);
    for (let y = 0; y < 256; y += 6) {
      gl.fillRect(0, y, 256, 2);
    }
    gl.fillStyle(0xffffff, 0.04);
    for (let x = 0; x < 256; x += 40) {
      gl.fillRect(x, 0, 1, 256);
    }
    gl.generateTexture(TEXTURE_KEY.SCANNER_LINES, 256, 256);
    gl.destroy();
  }

  private generateVignette(): void {
    const g = this.add.graphics();
    const steps = 12;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const shrink = t * 200;
      g.fillStyle(0x000000, t * 0.4);
      g.fillRect(0, 0, GAME_WIDTH, shrink);
      g.fillRect(0, GAME_HEIGHT - shrink, GAME_WIDTH, shrink);
      g.fillRect(0, 0, shrink, GAME_HEIGHT);
      g.fillRect(GAME_WIDTH - shrink, 0, shrink, GAME_HEIGHT);
    }
    g.generateTexture(TEXTURE_KEY.VIGNETTE, GAME_WIDTH, GAME_HEIGHT);
    g.destroy();
  }
}
