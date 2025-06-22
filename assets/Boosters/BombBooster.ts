import Tile from "../Objects/Tile/Tile";
import { Booster } from "./Booster";
import { BoosterActionType, IDestroyResult } from "./BoosterResult";

export class BombBooster extends Booster {
  public readonly requiredTiles: number = 1;
  private readonly radius: number;

  constructor(initialCount: number, radius: number = 2) {
    super(initialCount);
    this.radius = radius;
  }

  protected getBoosterResult(targetTiles: Tile[], grid: Tile[][]): IDestroyResult {
    const targetTile = targetTiles[0];
    const affected: Tile[] = [targetTile];

    for (let dx = -this.radius; dx <= this.radius; dx++) {
      for (let dy = -this.radius; dy <= this.radius; dy++) {
        const newX = targetTile.x + dx;
        const newY = targetTile.y + dy;

        if (dx === 0 && dy === 0) continue;

        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= this.radius && this.isValidCoordinate(newX, newY, grid)) {
          affected.push(grid[newX][newY]);
        }
      }
    }

    return {
      type: BoosterActionType.DESTROY,
      tiles: affected,
    };
  }
}