import Tile from "../Tile/Tile";

const { ccclass, property } = cc._decorator;

@ccclass
export class Booster extends cc.Component {

  @property(cc.Integer)
  private count: number = 5;

  disabled: boolean = false;
  isActive: boolean = false;

  private currentCount: number = 0;
  private label: cc.Label = null;

  protected tiles: Tile[] = [];
  protected grid: Tile[][] = null;
  protected group: Tile[] = [];

  initBooster() {
    this.isActive = false;
    this.disabled = false;
    this.currentCount = this.count;
    this.tiles = [];
    this.grid = null;
    this.group = [];
    this.label = this.node.getChildByName('booster_counter').getComponent(cc.Label);
    this.label.string = this.currentCount.toString();
    this.node.opacity = 255;
  }

  setGrid(grid: Tile[][]) {
    this.grid = grid;

    return this;
  }

  getGrid() {
    return this.grid;
  }

  setActive(active: boolean) {
    if (active) {
      this.grid = null;
      this.tiles = [];
      this.group = [];
    }

    this.isActive = active;
    this.node.opacity = active ? 150 : 255;
    this.playClickAnimation();

    return this;
  }

  isValidCoordinate(x, y) {
    return x >= 0 && x < this.grid.length && y >= 0 && y < this.grid[0].length;
  }

  completeBooster() {
    this.currentCount--;

    if (this.label) this.label.string = this.currentCount.toString();

    if (this.currentCount <= 0) this.setDisabled();
    else this.setActive(false);
  }

  setDisabled() {
    this.isActive = false;
    this.disabled = true;
    this.node.opacity = 50;
  }

  playClickAnimation() {
    const scale = this.node.scale;
    const scaleUp = cc.scaleTo(0.1, scale * 1.1);
    const scaleDown = cc.scaleTo(0.1, scale);
    const sequence = cc.sequence(scaleUp, scaleDown);

    this.node.runAction(sequence);
  }

  selectTile(tile: Tile) {
    return this;
  }

  getResult(): { complete: boolean, grid?: Tile[][], group?: Tile[] } {
    return { grid: this.grid, group: this.group, complete: true };
  };

  dispatchAction() { }
}