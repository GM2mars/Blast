import { BoosterButton } from "../Boosters/BoosterComponent";
import { BoosterActionType, BoosterResult } from "../Boosters/BoosterResult";
import Tile from "../Objects/Tile/Tile";
import { GridMaster } from "../Utils/GridMaster";
import { debounce } from "../Utils/Utils";

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

  @property({ type: cc.Integer, tooltip: "without target tile" })
  countGroup = 2;

  @property(cc.Integer)
  lives = 3;

  @property(cc.Float)
  burnDuration = 0.2;

  @property(cc.Float)
  dropDuration = 0.2;

  @property(cc.Float)
  insertDuration = 0.2;

  private activeBoosterButton: BoosterButton | null = null;
  private selectedTilesForBooster: Tile[] = [];
  private gm: GridMaster = null;
  private score: number = 0;
  private moves: number = 0;
  private gameOver: boolean = false;
  private currentLives: number = 3;
  private animationDuration: number = 0.2;
  private isLocking: boolean = false;
  private checkGameOverThrottle: () => void;

  onLoad() {
    this.initGame();
  }

  initGame() {
    this.isLocking = false;
    this.score = 0;
    this.animationDuration = this.burnDuration + this.dropDuration + this.insertDuration;
    this.moves = this.maxMoves;
    this.currentLives = this.lives;
    this.gameArea.removeAllChildren();
    this.activeBoosterButton = null;
    this.gameOver = false;
    this.gm = new GridMaster(this.fieldWidth, this.fieldHeight);
    this.hideEndGameUI();
    this.createGameField();
    this.updateUI();
    this.checkGameOverThrottle = debounce(this.checkGameOverCondition.bind(this), this.animationDuration);
  }

  public activateBooster(boosterButton: BoosterButton) {
    if (this.activeBoosterButton) {
      this.activeBoosterButton.setActiveState(false);
    }

    this.activeBoosterButton = boosterButton;
    this.activeBoosterButton.setActiveState(true);
    this.selectedTilesForBooster = [];
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
        const tile = this.createTile(x, y, startX, startY);

        this.gm.setCell(x, y, tile);
      }
    }
  }

  createTile(x: number, y: number, startX: number, startY: number) {
    const tileNode = cc.instantiate(this.tilePrefab);
    const tileComponent = tileNode.getComponent(Tile);
    const spriteIndex = Math.floor(Math.random() * this.tilesCount);
    const posX = startX + x * this.tileSizeW;
    const posY = startY + y * this.tileSizeH;

    tileComponent.init(x, y, spriteIndex, this);
    tileNode.setPosition(posX, posY);
    this.gameArea.addChild(tileNode);

    return tileComponent;
  }

  async onTileClicked(clickedTile: Tile) {
    if (this.gameOver) return;

    if (this.activeBoosterButton) {
      if (!this.selectedTilesForBooster.includes(clickedTile)) {
        this.selectedTilesForBooster.push(clickedTile);
      }

      const boosterLogic = this.activeBoosterButton.getLogic();
      const requiredCount = boosterLogic.requiredTiles;

      if (this.selectedTilesForBooster.length === requiredCount) {
        const result = boosterLogic.execute(this.selectedTilesForBooster, this.gm.getGrid());
        await this.processBoosterResult(result);
      }
    } else {
      const group = this.gm.getConnectedCells(clickedTile.x, clickedTile.y);

      if (group.length < this.countGroup) return;

      this.calculateScore(group.length);
      this.checkWinCondition();
      await this.destroyTiles(group);
    }

    this.moves--;
    this.checkGameOverThrottle();
    this.updateUI();
  }

  private async processBoosterResult(result: BoosterResult) {
    if (!result) return;

    switch (result.type) {
      case BoosterActionType.DESTROY:
        this.calculateScore(result.tiles.length);
        this.checkWinCondition();
        await this.destroyTiles(result.tiles);
        break;

      case BoosterActionType.SWAP:
        const [tile1, tile2] = result.tiles;
        await this.swapTiles(tile1, tile2);
        break;
    }

    this.activeBoosterButton.onBoosterUsed();
    this.activeBoosterButton = null;
    this.selectedTilesForBooster = [];
  }

  async swapTiles(tile1: Tile, tile2: Tile): Promise<void[]> {
    const fX = tile1.x;
    const fY = tile1.y;
    const sX = tile2.x;
    const sY = tile2.y;

    tile1.setCoordinates(sX, sY);
    tile2.setCoordinates(fX, fY);
    this.gm.setCell(fX, fY, tile2);
    this.gm.setCell(sX, sY, tile1);

    return Promise.all([
      this.animateTileToPosition(tile1, this.dropDuration),
      this.animateTileToPosition(tile2, this.dropDuration),
    ]);
  }

  async destroyTiles(tiles: Tile[]): Promise<void> {
    if (tiles.length === 0) return;
    this.isLocking = true;

    await this.burnTiles(tiles);
    await this.dropTiles();
    await this.fillEmptySpaces();

    this.isLocking = false;
  }

  async burnTiles(group: Tile[]): Promise<void> {
    const promises: Promise<void>[] = [];

    for (let tile of group) {
      const p = new Promise<void>(res => {

        cc.tween(tile.node as any)
          .to(this.burnDuration, { opacity: 0, scale: 0 })
          .call(() => {
            tile.node.destroy();
            this.gm.setCell(tile.x, tile.y, null);
            res();
          })
          .start();
      });

      promises.push(p);
    }

    await Promise.all(promises);
  }

  async dropTiles(): Promise<void> {
    const promises: Promise<void>[] = [];

    for (let x = 0; x < this.fieldWidth; x++) {
      let writeIndex = 0;

      for (let y = 0; y < this.fieldHeight; y++) {
        if (this.gm.getCell(x, y) !== null) {
          if (writeIndex !== y) {
            this.gm.setCell(x, writeIndex, this.gm.getCell(x, y));
            this.gm.setCell(x, y, null);

            const tile = this.gm.getCell(x, writeIndex);

            tile.setCoordinates(x, writeIndex);
            promises.push(this.animateTileToPosition(tile, this.dropDuration));
          }
          writeIndex++;
        }
      }
    }

    await Promise.all(promises);
  }

  async fillEmptySpaces() {
    const promises: Promise<void>[] = [];
    const startX = -(this.fieldWidth - 1) * this.tileSizeW / 2;
    const startY = -(this.fieldHeight - 1) * this.tileSizeH / 2;

    for (let x = 0; x < this.fieldWidth; x++) {
      for (let y = 0; y < this.fieldHeight; y++) {
        const cell = this.gm.getCell(x, y);

        if (cell === null) {
          const tile = this.createTile(x, y, startX, startY);

          this.gm.setCell(x, y, tile);

          if (tile) {
            tile.node.setPosition(
              startX + x * this.tileSizeW,
              startY + this.fieldHeight * this.tileSizeH
            );

            promises.push(this.animateTileToPosition(tile, this.insertDuration));
          }
        }
      }
    }

    await Promise.all(promises);
  }

  async animateTileToPosition(tile: Tile, duration: number): Promise<void> {
    const startY = -(this.fieldHeight - 1) * this.tileSizeH / 2;
    const startX = -(this.fieldWidth - 1) * this.tileSizeW / 2;
    const targetPos = cc.v2(startX + tile.x * this.tileSizeW, startY + tile.y * this.tileSizeH);

    return new Promise<void>(res => {
      cc.tween(tile.node as any)
        .to(duration, { position: targetPos })
        .call(() => res())
        .start();
    });
  }

  async shuffleTiles() {
    this.gm.shuffle(this.countGroup);

    const promises: Promise<void>[] = [];

    for (let x = 0; x < this.fieldWidth; x++) {
      for (let y = 0; y < this.fieldHeight; y++) {
        const tile = this.gm.getCell(x, y);

        if (tile) {
          promises.push(this.animateTileToPosition(tile, this.dropDuration));
        }
      }
    }

    await Promise.all(promises);
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

  async checkGameOverCondition() {
    if (this.gameOver || this.isLocking) return;

    const canMove = this.gm.hasValidMoves(this.countGroup);

    if (!canMove && this.currentLives > 0) {
      this.currentLives--;
      await this.shuffleTiles();
      return;
    }

    if (!canMove || this.moves <= 0) {
      this.gameOver = true;
      this.showLosePanel(true);
    }
  }

  showWinPanel(show: boolean) {
    if (this.winPanel) {
      this.winPanel.active = show;

      const bg = this.winPanel.getChildByName('bg');

      cc.tween(bg)
        .to(1, { opacity: show ? 100 : 0 })
        .start();
    }
  }

  showLosePanel(show: boolean) {
    if (this.losePanel) {
      this.losePanel.active = show;

      const bg = this.losePanel.getChildByName('bg');

      cc.tween(bg)
        .to(1, { opacity: show ? 100 : 0 })
        .start();
    }
  }

  restartGame() {
    this.initGame();
  }
}