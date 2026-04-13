import { WaveConfig, WAVE_DEFINITIONS, WAVE_DURATION_MS } from "../config/constants";

export class DifficultyManager {
  private elapsedMs: number = 0;
  private currentWave: number = 0;
  private currentConfig: WaveConfig = { ...WAVE_DEFINITIONS[0] };

  update(deltaMs: number): void {
    this.elapsedMs += deltaMs;

    const targetWave = Math.min(
      Math.floor(this.elapsedMs / WAVE_DURATION_MS),
      WAVE_DEFINITIONS.length - 1
    );

    if (targetWave !== this.currentWave) {
      this.currentWave = targetWave;
    }

    if (this.currentWave === WAVE_DEFINITIONS.length - 1) {
      this.currentConfig = { ...WAVE_DEFINITIONS[this.currentWave] };
      return;
    }

    const progress = (this.elapsedMs % WAVE_DURATION_MS) / WAVE_DURATION_MS;
    const from = WAVE_DEFINITIONS[this.currentWave];
    const to = WAVE_DEFINITIONS[this.currentWave + 1];

    this.currentConfig = {
      fallSpeed: this.lerp(from.fallSpeed, to.fallSpeed, progress),
      spawnInterval: this.lerp(from.spawnInterval, to.spawnInterval, progress),
      malwareRatio: this.lerp(from.malwareRatio, to.malwareRatio, progress),
    };
  }

  getConfig(): WaveConfig {
    return this.currentConfig;
  }

  getWaveNumber(): number {
    return this.currentWave;
  }

  reset(): void {
    this.elapsedMs = 0;
    this.currentWave = 0;
    this.currentConfig = { ...WAVE_DEFINITIONS[0] };
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }
}
