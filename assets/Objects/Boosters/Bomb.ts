import Tile from "../Tile/Tile";
import { Booster } from "./Booster";

const { ccclass, property } = cc._decorator;

@ccclass
export class Bomb extends Booster {

  @property(cc.Integer)
  radius: number = 1;

  selectTile(tile: Tile) {
    this.tiles.push(tile);

    if (this.tiles.length !== 0) {
      this.dispatchAction();
    }

    return this;
  }

  dispatchAction() {
    const target = this.tiles[0];

    this.group = [target];

    for (let dx = -this.radius; dx <= this.radius; dx++) {
      for (let dy = -this.radius; dy <= this.radius; dy++) {
        const newX = target.x + dx;
        const newY = target.y + dy;

        if (dx === 0 && dy === 0) continue;

        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= this.radius && this.isValidCoordinate(newX, newY)) {
          this.group.push(this.grid[newX][newY]);
        }
      }
    }

    this.completeBooster();
  }

  getResult() {
    return {
      group: this.group,
      complete: false,
    };
  }
}