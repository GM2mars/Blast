import Tile from "../Objects/Tile/Tile";
import { GridMaster } from "../Utils/GridMaster";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameController extends cc.Component {

  @property(cc.Prefab)
  tilePrefab: cc.Prefab = null;

  @property(cc.Node)
  gameArea: cc.Node = null;

  @property(cc.Label)
  scoreLabel: cc.Label = null;

  @property(cc.Label)
  movesLabel: cc.Label = null;

  @property(cc.Node)
  winPanel: cc.Node = null;

  @property(cc.Node)
  losePanel: cc.Node = null;

  @property(cc.Integer)
  fieldWidth = 8;

  @property(cc.Integer)
  fieldHeight = 10;

  @property(cc.Integer)
  tileSizeW = 50;

  @property(cc.Integer)
  tileSizeH = 55;

  @property(cc.Integer)
  targetScore = 1000;

  @property(cc.Integer)
  maxMoves = 30;

  @property(cc.Integer)
  tilesCount = 5;

  @property(cc.Float)
  animationDuration = 0.3;

  @property(cc.Integer)
  connectionCount = 2;

  gridMaster: GridMaster = null;
  tiles: any[][] = [];
  score: number = 0;
  moves: number = 0;
  gameOver: boolean = false;

  onLoad() {
    this.initGame();
  }

  initGame() {
    this.tiles = [];
    this.score = 0;
    this.moves = this.maxMoves;
    this.gameOver = false;

    for (let x = 0; x < this.fieldWidth; x++) {
      this.tiles[x] = [];
    }

    this.hideEndGameUI();
    this.createGameField();
    this.updateUI();

    this.gridMaster = new GridMaster(this.tiles);
  }

  hideEndGameUI() {
    this.showLosePanel(false);
    this.showWinPanel(false);
  }

  createGameField() {
    this.gameArea.removeAllChildren();

    const startX = -(this.fieldWidth - 1) * this.tileSizeW / 2;
    const startY = -(this.fieldHeight - 1) * this.tileSizeH / 2;

    for (let x = 0; x < this.fieldWidth; x++) {
      for (let y = 0; y < this.fieldHeight; y++) {
        this.createTile(x, y, startX, startY);
      }
    }
  }

  createTile(x: number, y: number, startX: number, startY: number) {
    const tileNode = cc.instantiate(this.tilePrefab);
    const tileComponent = tileNode.getComponent('Tile');
    const spriteIndex = Math.floor(Math.random() * this.tilesCount);
    const posX = startX + x * this.tileSizeW;
    const posY = startY + y * this.tileSizeH;

    tileComponent.init(x, y, spriteIndex, this);
    tileNode.setPosition(posX, posY);
    this.gameArea.addChild(tileNode);
    this.tiles[x][y] = tileComponent;
  }

  onTileClicked(clickedTile: Tile) {
    if (this.gameOver) return;

    const group = this.gridMaster.getConnectedCells(clickedTile.x, clickedTile.y);

    if (group.length <= this.connectionCount) {
      return;
    }

    this.burnTiles(group);
    this.dropTiles();
    this.fillEmptySpaces();

    this.calculateScore(group.length);

    this.moves--;

    this.updateUI();

    this.scheduleOnce(() => {
      this.checkWinCondition();
      this.checkGameOver();
    }, this.animationDuration * 2);
  }

  burnTiles(group: any[]) {
    for (let tile of group) {
      const fadeOut = cc.fadeOut(this.animationDuration);
      const scaleDown = cc.scaleTo(this.animationDuration, 0);
      const spawn = cc.spawn(fadeOut, scaleDown);

      tile.node.runAction(cc.sequence(
        spawn,
        cc.callFunc(() => {
          tile.node.destroy();
          this.tiles[tile.x][tile.y] = null;
        })
      ));
    }
  }

  dropTiles() {
    this.scheduleOnce(() => {
      for (let x = 0; x < this.fieldWidth; x++) {
        let writeIndex = 0;

        for (let y = 0; y < this.fieldHeight; y++) {

          if (this.tiles[x][y] !== null) {

            if (writeIndex !== y) {
              this.tiles[x][writeIndex] = this.tiles[x][y];
              this.tiles[x][y] = null;
              this.tiles[x][writeIndex].y = writeIndex;
              this.animateTileToPosition(this.tiles[x][writeIndex]);
            }
            writeIndex++;
          }
        }
      }
    }, this.animationDuration);
  }

  fillEmptySpaces() {
    this.scheduleOnce(() => {
      const startX = -(this.fieldWidth - 1) * this.tileSizeW / 2;
      const startY = -(this.fieldHeight - 1) * this.tileSizeH / 2;

      for (let x = 0; x < this.fieldWidth; x++) {
        for (let y = 0; y < this.fieldHeight; y++) {

          if (this.tiles[x][y] === null) {
            const tile = this.tiles[x][y];

            this.createTile(x, y, startX, startY);

            if (tile) {
              tile.node.setPosition(
                startX + x * this.tileSizeW,
                startY + this.fieldHeight * this.tileSizeH
              );

              this.animateTileToPosition(tile);
            }
          }
        }
      }
    }, this.animationDuration * 2);
  }

  animateTileToPosition(tile: Tile) {
    const startY = -(this.fieldHeight - 1) * this.tileSizeH / 2;
    const targetPos = cc.v2(tile.node.position.x, startY + tile.y * this.tileSizeH);
    const moveAction = cc.moveTo(this.animationDuration, targetPos);

    tile.node.runAction(moveAction);
  }

  calculateScore(tilesCount: number) {
    const baseScore = 10;
    const multiplier = Math.max(1, tilesCount - 1);
    const earnedScore = baseScore * tilesCount * multiplier;

    this.score += earnedScore;
  }

  updateUI() {
    if (this.scoreLabel) {
      this.scoreLabel.string = `${this.score}/${this.targetScore}`;
    }

    if (this.movesLabel) {
      this.movesLabel.string = this.moves.toString();
    }
  }

  checkWinCondition() {
    if (this.score >= this.targetScore) {
      this.gameOver = true;
      this.showWinPanel(true);
    }
  }

  checkGameOver() {
    let hasMoves = this.gridMaster.hasValidMoves(2);

    console.log({ hasMoves })

    if (!hasMoves || this.moves <= 0) {
      this.gameOver = true;
      this.showLosePanel(true);
    }
  }

  showWinPanel(show: boolean) {
    if (this.winPanel) {
      this.winPanel.active = show;

      const bg = this.winPanel.getChildByName('bg');

      cc.tween(bg)
        .to(1, { opacity: show ? 200 : 0 })
        .start();
    }
  }

  showLosePanel(show: boolean) {
    if (this.losePanel) {
      this.losePanel.active = show;

      const bg = this.losePanel.getChildByName('bg');

      cc.tween(bg)
        .to(1, { opacity: show ? 200 : 0 })
        .start();
    }
  }

  restartGame() {
    this.initGame();
  }
}