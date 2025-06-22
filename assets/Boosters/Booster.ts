import Tile from "../Objects/Tile/Tile";
import { BoosterResult } from "./BoosterResult";

export abstract class Booster {
  currentCount: number;

  constructor(initialCount: number) {
    this.currentCount = initialCount;
  }

  public getCount(): number {
    return this.currentCount;
  }

  public canUse(): boolean {
    return this.currentCount > 0;
  }

  public readonly requiredTiles: number;

  public execute(targetTiles: Tile[], grid: Tile[][]): BoosterResult {
    if (!this.canUse() || targetTiles.length < this.requiredTiles) {
      return null;
    }

    this.currentCount--;
    return this.getBoosterResult(targetTiles, grid);
  }

  protected abstract getBoosterResult(targetTiles: Tile[], grid: Tile[][]): BoosterResult;

  protected isValidCoordinate(x: number, y: number, grid: Tile[][]): boolean {
    return x >= 0 && x < grid.length && y >= 0 && y < grid[0].length;
  }
}