import Tile from "../Objects/Tile/Tile";
import { Booster } from "./Booster";
import { BoosterActionType, ISwapResult } from "./BoosterResult";

export class SwapBooster extends Booster {
  public readonly requiredTiles: number = 2;

  constructor(initialCount: number) {
    super(initialCount);
  }

  protected getBoosterResult(targetTiles: Tile[], _grid: Tile[][]): ISwapResult {
    const firstTile = targetTiles[0];
    const secondTile = targetTiles[1];

    return {
      type: BoosterActionType.SWAP,
      tiles: [firstTile, secondTile],
    };
  }
}