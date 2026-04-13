import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "@config/constants";
import { BootScene } from "@scenes/BootScene";
import { MenuScene } from "@scenes/MenuScene";
import { GameScene } from "@scenes/GameScene";
import { GameOverScene } from "@scenes/GameOverScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: "game-container",
  backgroundColor: "#0a0a1a",
  physics: {
    default: "arcade",
    arcade: { gravity: { x: 0, y: 0 } },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    expandParent: true,
  },
  input: {
    touch: { capture: true },
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene],
};

const game = new Phaser.Game(config);

const refreshScale = (): void => {
  game.scale.refresh();
};

window.addEventListener("resize", refreshScale);
window.addEventListener("orientationchange", refreshScale);
window.visualViewport?.addEventListener("resize", refreshScale);
window.visualViewport?.addEventListener("scroll", refreshScale);
