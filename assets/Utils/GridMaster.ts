import Tile from "../Objects/Tile/Tile";

export class GridMaster {
  grid: Tile[][] = [];
  width: number = 0;
  height: number = 0;


  constructor(grid: Tile[][]) {
    this.grid = grid;
    this.width = grid.length;
    this.height = grid[0] ? grid[0].length : 0;
  }

  getConnectedCells(x, y) {
    if (!this.isValidCoordinate(x, y)) {
      return [];
    }

    const targetValue = this.grid[x][y].value;
    const visited = new Set();

    return this._findConnectedGroup(x, y, targetValue, visited);
  }

  private _findConnectedGroup(x, y, targetValue, visited) {
    const key = `${x},${y}`;

    if (visited.has(key)) return [];
    if (!this.isValidCoordinate(x, y)) return [];
    if (this.grid[x][y].value !== targetValue) return [];

    visited.add(key);

    let result = [this.grid[x][y]];

    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

    for (let [dx, dy] of directions) {
      const connectedCells = this._findConnectedGroup(x + dx, y + dy, targetValue, visited);
      result = result.concat(connectedCells);
    }

    return result;
  }

  getCellsInRadius(x, y, radius) {
    if (!this.isValidCoordinate(x, y) || radius < 0) return [];

    const result = [];

    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const newX = x + dx;
        const newY = y + dy;

        if (dx === 0 && dy === 0) continue;

        if (this.isValidCoordinate(newX, newY)) {
          result.push(this.grid[newX][newY]);
        }
      }
    }

    return result;
  }

  getCellsInCircularRadius(x, y, radius) {
    if (!this.isValidCoordinate(x, y) || radius < 0) return [];

    const result = [];

    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const newX = x + dx;
        const newY = y + dy;

        if (dx === 0 && dy === 0) continue;

        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= radius && this.isValidCoordinate(newX, newY)) {
          result.push(this.grid[newX][newY]);
        }
      }
    }

    return result;
  }

  dropTiles(animateFn: (tile: Tile) => void) {
    for (let x = 0; x < this.width; x++) {
      let writeIndex = 0;

      for (let y = 0; y < this.height; y++) {

        if (this.grid[x][y] !== null) {

          if (writeIndex !== y) {
            this.grid[x][writeIndex] = this.grid[x][y];
            this.grid[x][y] = null;
            this.grid[x][writeIndex].y = writeIndex;

            animateFn && animateFn(this.grid[x][writeIndex]);
          }
          writeIndex++;
        }
      }
    }
  }

  private _fisherYatesShuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));

      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  swapeTiles(tile1: { x: number, y: number }, tile2: { x: number, y: number }) {
    const firstTile = this.grid[tile1.x][tile1.y];
    const secondTile = this.grid[tile2.x][tile2.y];

    this.grid[tile1.x][tile1.y] = secondTile;
    this.grid[tile2.x][tile2.y] = firstTile;
  }

  shuffle(attempts = 5) {
    const allTiles = [];

    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        allTiles.push(this.grid[x][y]);
      }
    }

    this._fisherYatesShuffle(allTiles);

    let index = 0;

    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        this.grid[x][y] = allTiles[index++];
      }
    }

    if (!this.hasValidMoves() && attempts > 0) this.shuffle(attempts - 1);
  }

  updateGrid(grid) {
    this.grid = grid;
    this.width = grid.length;
    this.height = grid[0] ? grid[0].length : 0;
  }

  getGrid() {
    return this.grid;
  }

  isValidCoordinate(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  hasValidMoves(countGroup: number = 1) {
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        if (this.grid[x][y] == null) continue;

        let validCount = 0;
        const currentValue = this.grid[x][y].value;
        const neighbors = [
          [x + 1, y],
          [x, y + 1],
          [x - 1, y],
          [x, y - 1],
        ];

        for (let [nx, ny] of neighbors) {
          if (this.isValidCoordinate(nx, ny) && this.grid[nx][ny].value === currentValue) validCount++;
        }

        if (validCount >= countGroup) return true;
      }
    }

    return false;
  }
}