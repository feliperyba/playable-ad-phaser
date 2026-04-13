import { GAME_WIDTH, ITEM_WEIGHTS, ItemType, SPAWN, WaveConfig } from "@config/constants";
import { FallingItem } from "@entities/FallingItem";

export class Spawner {
  private scene: Phaser.Scene;
  private group: Phaser.Physics.Arcade.Group;
  private currentConfig: WaveConfig | null = null;
  private timeSinceLastSpawn = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.group = scene.physics.add.group({ runChildUpdate: true });
  }

  update(deltaMs: number, config: WaveConfig): void {
    this.currentConfig = config;
    this.timeSinceLastSpawn += deltaMs;

    if (this.timeSinceLastSpawn >= config.spawnInterval) {
      this.spawn();
      this.timeSinceLastSpawn -= config.spawnInterval;
    }
  }

  syncItemPositions(): void {
    this.group.getChildren().forEach((child) => {
      (child as FallingItem).updatePosition();
    });
  }

  getGroup(): Phaser.Physics.Arcade.Group {
    return this.group;
  }

  getActiveItems(): FallingItem[] {
    return this.group.getChildren().filter((child) => (child as FallingItem).isActive()) as FallingItem[];
  }

  private spawn(): void {
    if (!this.currentConfig) return;

    const type = this.pickWeightedType();
    const isMalware = Math.random() < this.currentConfig.malwareRatio;
    const x = Phaser.Math.Between(SPAWN.X_MARGIN, GAME_WIDTH - SPAWN.X_MARGIN);

    const item = new FallingItem(this.scene, x, SPAWN.Y_START, type, isMalware);
    this.group.add(item);
    const body = item.body as Phaser.Physics.Arcade.Body;
    body.setVelocityY(this.currentConfig.fallSpeed);
    body.setGravityY(0);
    body.setImmovable(true);
  }

  private pickWeightedType(): ItemType {
    const totalWeight = ITEM_WEIGHTS.reduce((sum, [, w]) => sum + w, 0);
    let roll = Phaser.Math.Between(1, totalWeight);

    for (const [type, weight] of ITEM_WEIGHTS) {
      roll -= weight;
      if (roll <= 0) return type;
    }

    return ITEM_WEIGHTS[ITEM_WEIGHTS.length - 1][0];
  }

  cleanup(): void {
    this.group.getChildren().forEach((child) => child.destroy());
    this.group.clear(false, true);
  }
}
