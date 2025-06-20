import Tile from "../Tile/Tile";
import { Buster } from "./Buster";

const { ccclass, property } = cc._decorator;

@ccclass
export class Swape extends Buster {
  secondTile: Tile = null;

  selectTile(tile: Tile) {
    if (this.count === 0) return;

    if (this.selectedTile === null) {
      this.selectedTile = tile;
    } else if (this.secondTile === null) {
      this.secondTile = tile;
    }

    if (this.selectedTile !== null && this.secondTile !== null) {
      return this.dispatchAction();
    }
  }

  dispatchAction() {
    this.grid[this.selectedTile.x][this.selectedTile.y] = this.secondTile;
    this.grid[this.secondTile.x][this.secondTile.y] = this.selectedTile;

    cc.tween(this.selectedTile.node)
      .to(1, { position: this.secondTile.node.getPosition() })
      .start();

    cc.tween(this.secondTile.node)
      .to(1, { position: this.selectedTile.node.getPosition() })
      .call(() => {
        console.log('swap complete')
        this.setActive(false);
        this.count--;

        if (this.label) this.label.string = this.count.toString();

      })
      .start();
  }
}