import Phaser from "phaser";
import {
  COLOR,
  FONT,
  GAME_HEIGHT,
  GAME_WIDTH,
  ITEM_CONFIGS,
  ItemType,
  PARTYHAT_BRAND,
  RESULT_FEATURES,
  RESULT_SCREEN,
  RESULT_TIER_CONFIGS,
  ResultTierConfig,
  TEXTURE_KEY,
  TYPO,
} from "../config/constants";

interface AmbientItem {
  image: Phaser.GameObjects.Image;
  velocityX: number;
  velocityY: number;
  rotationSpeed: number;
}

const AMBIENT_ITEMS = [
  { key: ITEM_CONFIGS[ItemType.PASSWORD].neutralTextureKey, width: 70, height: 70 },
  { key: ITEM_CONFIGS[ItemType.EMAIL].neutralTextureKey, width: 82, height: 64 },
  { key: ITEM_CONFIGS[ItemType.SELFIE].neutralTextureKey, width: 78, height: 88 },
  { key: ITEM_CONFIGS[ItemType.CREDIT_CARD].neutralTextureKey, width: 92, height: 64 },
];

export class GameOverScene extends Phaser.Scene {
  private ambientItems: AmbientItem[] = [];

  constructor() {
    super({ key: "GameOverScene" });
  }

  create(): void {
    this.createBackdrop();

    const data = (this.scene.settings.data as { score: number; maxCombo: number }) || { score: 0, maxCombo: 0 };
    const score = data.score;
    const maxCombo = data.maxCombo || 0;
    const tier = this.getResultTier(score);

    const storedHigh = parseInt(localStorage.getItem("dataDropHighScore") || "0", 10);
    const isNewHigh = score > storedHigh;
    const highScore = isNewHigh ? score : storedHigh;
    if (isNewHigh) {
      localStorage.setItem("dataDropHighScore", String(score));
    }

    this.createHeader();
    this.createHeadline(tier);
    this.createScoreBlock(score, maxCombo, isNewHigh, highScore);
    this.createFeatureRails();
    this.createCTACluster();
  }

  update(_time: number, delta: number): void {
    for (const item of this.ambientItems) {
      item.image.x += item.velocityX * (delta / 1000);
      item.image.y += item.velocityY * (delta / 1000);
      item.image.rotation += item.rotationSpeed * (delta / 1000);

      if (item.image.x < -80) item.image.x = GAME_WIDTH + 80;
      if (item.image.x > GAME_WIDTH + 80) item.image.x = -80;
      if (item.image.y > GAME_HEIGHT + 90) {
        item.image.y = -90;
        item.image.x = Phaser.Math.Between(80, GAME_WIDTH - 80);
      }
    }
  }

  private createBackdrop(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLOR.SITE_NAVY)
      .setDepth(-30);

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, TEXTURE_KEY.BACKGROUND)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(-22)
      .setAlpha(0.09);

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, TEXTURE_KEY.VIGNETTE)
      .setDepth(40)
      .setAlpha(0.28)
      .setTint(0x000000);

    this.add.image(GAME_WIDTH / 2, 1000, TEXTURE_KEY.HALO_SPOTLIGHT)
      .setScale(1.25)
      .setAlpha(0.32)
      .setDepth(-10);

    this.add.image(GAME_WIDTH + 70, 1480, TEXTURE_KEY.PARTYHAT_BANNER)
      .setOrigin(1, 0.5)
      .setDisplaySize(430, 456)
      .setAlpha(0.9)
      .setDepth(1);

    for (let i = 0; i < 6; i++) {
      this.spawnAmbientItem();
    }
  }

  private createHeader(): void {
    this.add.image(GAME_WIDTH / 2, 102, TEXTURE_KEY.PARTYHAT_WORDMARK)
      .setDisplaySize(PARTYHAT_BRAND.WORDMARK_WIDTH, PARTYHAT_BRAND.WORDMARK_HEIGHT)
      .setDepth(6);

    this.add.text(GAME_WIDTH / 2, 204, RESULT_SCREEN.EYEBROW, {
      fontSize: TYPO.SMALL,
      fontFamily: FONT.BODY,
      color: COLOR.SITE_EYEBROW,
    })
      .setOrigin(0.5)
      .setDepth(6);
  }

  private createHeadline(tier: ResultTierConfig): void {
    this.add.text(GAME_WIDTH / 2, 332, tier.headline, {
      fontSize: "152px",
      fontFamily: FONT.DISPLAY,
      color: tier.color,
      align: "center",
    })
      .setOrigin(0.5)
      .setDepth(7);
  }

  private createScoreBlock(score: number, maxCombo: number, isNewHigh: boolean, highScore: number): void {
    const centerX = GAME_WIDTH / 2;
    const scoreLabelY = 462;
    const scoreY = 564;
    const statY = 694;
    const summaryY = 822;
    const highlightY = 892;

    this.add.text(centerX, scoreLabelY, `${RESULT_SCREEN.SCORE_LABEL}:`, {
      fontSize: TYPO.BODY,
      fontFamily: FONT.BODY,
      color: COLOR.SITE_TEXT_MUTED,
    })
      .setOrigin(0.5)
      .setDepth(7);

    const scoreText = this.add.text(centerX, scoreY, "0", {
      fontSize: "112px",
      fontFamily: FONT.DISPLAY,
      color: "#ffffff",
    })
      .setOrigin(0.5)
      .setDepth(8);

    const animatedScore = { value: 0 };
    this.tweens.add({
      targets: animatedScore,
      value: score,
      duration: 900,
      ease: "Cubic.easeOut",
      onUpdate: () => {
        scoreText.setText(Math.floor(animatedScore.value).toLocaleString());
      },
    });

    const rightBadgeText = isNewHigh ? "NEW HIGH SCORE" : `HIGH SCORE: ${highScore.toLocaleString()}`;

    this.createStatChip(centerX - 170, statY, 304, TEXTURE_KEY.PARTYHAT_FAVICON, `${RESULT_SCREEN.STREAK_LABEL}: ${maxCombo}x`);
    this.createStatChip(
      centerX + 170,
      statY,
      304,
      TEXTURE_KEY.PARTYHAT_WEBCLIP,
      rightBadgeText,
      isNewHigh ? "#ffd7f0" : "#ffffff"
    );

    this.add.rectangle(centerX, 754, 184, 3, COLOR.SITE_RULE, 0.9)
      .setDepth(7);

    this.add.text(centerX, summaryY, RESULT_SCREEN.SUMMARY, {
      fontSize: TYPO.BODY,
      fontFamily: FONT.BODY,
      color: "#ffffff",
      align: "center",
    })
      .setOrigin(0.5)
      .setDepth(7);

    this.add.text(centerX, highlightY, RESULT_SCREEN.HIGHLIGHT_MESSAGE, {
      fontSize: TYPO.SMALL,
      fontFamily: FONT.BODY,
      color: COLOR.SITE_EYEBROW,
      align: "center",
      wordWrap: { width: 620 },
    })
      .setOrigin(0.5)
      .setDepth(7);
  }

  private createFeatureRails(): void {
    let y = 1040;
    for (const feature of RESULT_FEATURES) {
      const texture = feature.active ? TEXTURE_KEY.FEATURE_RAIL_ACTIVE : TEXTURE_KEY.FEATURE_RAIL;
      const height = feature.active ? 122 : 104;
      const rail = this.add.image(GAME_WIDTH / 2, y, texture)
        .setDisplaySize(848, height)
        .setDepth(7);

      const iconX = GAME_WIDTH / 2 - 332;
      this.add.image(iconX, y, feature.icon)
        .setDisplaySize(feature.active ? 50 : 42, feature.active ? 50 : 42)
        .setDepth(8);

      this.add.text(GAME_WIDTH / 2 - 264, y - (feature.active ? 22 : 16), feature.index, {
        fontSize: TYPO.MICRO,
        fontFamily: FONT.DISPLAY,
        color: COLOR.SITE_EYEBROW,
      })
        .setOrigin(0, 0.5)
        .setDepth(8);

      this.add.text(GAME_WIDTH / 2 - 214, y - (feature.active ? 22 : 16), feature.title.toUpperCase(), {
        fontSize: feature.active ? TYPO.BODY : TYPO.SMALL,
        fontFamily: FONT.DISPLAY,
        color: "#ffffff",
        letterSpacing: 1,
      })
        .setOrigin(0, 0.5)
        .setDepth(8);

      this.add.text(GAME_WIDTH / 2 - 214, y + (feature.active ? 18 : 16), feature.description, {
        fontSize: TYPO.MICRO,
        fontFamily: FONT.BODY,
        color: COLOR.SITE_TEXT_MUTED,
        wordWrap: { width: 540 },
      })
        .setOrigin(0, 0.5)
        .setDepth(8);

      rail.setAlpha(feature.active ? 1 : 0.94);
      y += feature.active ? 138 : 116;
    }
  }

  private createCTACluster(): void {
    const centerX = GAME_WIDTH / 2;
    const ctaY = 1588;
    const button = this.add.image(centerX, ctaY, TEXTURE_KEY.BUTTON_PRIMARY)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });
    button.on("pointerdown", () => {
      window.open(RESULT_SCREEN.CTA_URL, "_blank");
    });

    this.add.text(centerX, ctaY, RESULT_SCREEN.CTA_TEXT, {
      fontSize: TYPO.SUBTITLE,
      fontFamily: FONT.DISPLAY,
      color: "#ffffff",
    })
      .setOrigin(0.5)
      .setDepth(11);

    this.add.text(centerX, ctaY + 94, RESULT_SCREEN.CTA_SUBTEXT, {
      fontSize: TYPO.MICRO,
      fontFamily: FONT.BODY,
      color: COLOR.SITE_TEXT_MUTED,
      align: "center",
    })
      .setOrigin(0.5)
      .setDepth(10);

    const mascotHeight = PARTYHAT_BRAND.MASCOT_SIZE;
    const mascotWidth = mascotHeight * (23 / 51);
    const mascot = this.add.image(884, 1658, TEXTURE_KEY.PARTYHAT_MASCOT)
      .setDisplaySize(mascotWidth, mascotHeight)
      .setDepth(9)
      .setAngle(-8);

    this.tweens.add({
      targets: [button, mascot],
      scaleX: { from: 1, to: 1.03 },
      scaleY: { from: 1, to: 1.03 },
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const replay = this.add.text(centerX, 1770, RESULT_SCREEN.PLAY_AGAIN_TEXT, {
      fontSize: TYPO.BODY,
      fontFamily: FONT.BODY,
      color: "#ffffff",
      align: "center",
    })
      .setOrigin(0.5)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });
    replay.on("pointerdown", () => this.scene.start("GameScene"));

    const underline = this.add.rectangle(centerX, 1798, 154, 2, COLOR.SITE_RULE)
      .setDepth(9);

    this.tweens.add({
      targets: [replay, underline],
      alpha: { from: 1, to: 0.66 },
      duration: 850,
      yoyo: true,
      repeat: -1,
    });
  }

  private createStatChip(
    x: number,
    y: number,
    width: number,
    iconKey: string,
    text: string,
    textColor = "#ffffff"
  ): void {
    this.add.image(x, y, TEXTURE_KEY.BADGE_CHIP)
      .setDisplaySize(width, 58)
      .setDepth(7);

    this.add.image(x - width / 2 + 34, y, iconKey)
      .setDisplaySize(iconKey === TEXTURE_KEY.PARTYHAT_WEBCLIP ? 30 : 26, iconKey === TEXTURE_KEY.PARTYHAT_WEBCLIP ? 30 : 26)
      .setDepth(8);

    this.add.text(x - width / 2 + 74, y, text, {
      fontSize: TYPO.MICRO,
      fontFamily: FONT.DISPLAY,
      color: textColor,
      letterSpacing: 1,
    })
      .setOrigin(0, 0.5)
      .setDepth(8);
  }

  private getResultTier(score: number): ResultTierConfig {
    return RESULT_TIER_CONFIGS.find((config) => score >= config.minScore) ?? RESULT_TIER_CONFIGS[RESULT_TIER_CONFIGS.length - 1];
  }

  private spawnAmbientItem(): void {
    const config = Phaser.Utils.Array.GetRandom(AMBIENT_ITEMS);
    const image = this.add.image(
      Phaser.Math.Between(80, GAME_WIDTH - 80),
      Phaser.Math.Between(-GAME_HEIGHT, GAME_HEIGHT),
      config.key
    )
      .setDisplaySize(config.width, config.height)
      .setAlpha(0.12)
      .setDepth(-2);

    this.ambientItems.push({
      image,
      velocityX: Phaser.Math.FloatBetween(-14, 14),
      velocityY: Phaser.Math.FloatBetween(42, 88),
      rotationSpeed: Phaser.Math.FloatBetween(-0.12, 0.12),
    });
  }
}
