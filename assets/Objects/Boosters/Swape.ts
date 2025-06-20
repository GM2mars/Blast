import Tile from "../Tile/Tile";
import { Booster } from "./Booster";

const { ccclass, property } = cc._decorator;

@ccclass
export class Swape extends Booster {

  selectTile(tile: Tile) {
    if (this.tiles.length < 2) {
      this.tiles.push(tile);
    }

    if (this.tiles.length === 2) {
      this.dispatchAction();
    }

    return this;
  }

  dispatchAction() {
    const firstTile = this.tiles[0];
    const secondTile = this.tiles[1];

    const fX = firstTile.x;
    const fY = firstTile.y;
    const sX = secondTile.x;
    const sY = secondTile.y;

    firstTile.setCoordinates(sX, sY);
    secondTile.setCoordinates(fX, fY);

    this.grid[fX][fY] = secondTile;
    this.grid[sX][sY] = firstTile;

    this.tiles = [];

    cc.tween(firstTile.node as any)
      .to(0.3, { position: secondTile.node.getPosition() }, { easing: 'backOut' })
      .start();

    cc.tween(secondTile.node as any)
      .to(0.3, { position: firstTile.node.getPosition() }, { easing: 'backOut' })
      .start();

    this.completeBooster();
  }

  getResult() {
    return {
      grid: this.grid,
      complete: true,
    };
  }
}