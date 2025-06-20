import Tile from "../Tile/Tile";

const { ccclass, property } = cc._decorator;

@ccclass
export class Buster extends cc.Component {

  @property(cc.Integer)
  count: number = 5;

  isActive: boolean = false;
  selectedTile: any = null;
  label: cc.Label = null;
  grid: Tile[][] = null;

  protected onLoad(): void {
    this.label = this.node.getChildByName('first_booster_counter').getComponent(cc.Label);
    this.label.string = this.count.toString();
  }

  setGrid(grid: Tile[][]) {
    this.grid = grid;

    return this;
  }

  getGrid() {
    return this.grid;
  }

  setActive(active: boolean) {
    this.isActive = active;
  }

  selectTile(tile: Tile) { }

  dispatchAction() {
  }
}