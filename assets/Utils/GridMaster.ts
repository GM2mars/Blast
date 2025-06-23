import Tile from "../Objects/Tile/Tile";

export class GridMaster {
  grid: Tile[][] = [];
  width: number = 0;
  height: number = 0;

  private shuffleAttempts: number = 10;

  constructor(w: number, h: number) {
    this.width = w;
    this.height = h;
  }

  setCell(x: number, y: number, tile: Tile) {
    !this.grid[x] && (this.grid[x] = []);

    tile && tile.setCoordinates(x, y);
    this.grid[x][y] = tile;
  }

  getCell(x: number, y: number) {
    return this.grid[x][y];
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

    const tile = this.grid[x][y];

    if (!tile || tile.value !== targetValue) return [];

    visited.add(key);

    let result = [tile];

    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

    for (let [dx, dy] of directions) {
      const connectedCells = this._findConnectedGroup(x + dx, y + dy, targetValue, visited);
      result = result.concat(connectedCells);
    }

    return result;
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

    firstTile.setCoordinates(tile2.x, tile2.y);
    secondTile.setCoordinates(tile1.x, tile1.y);

    this.grid[tile2.x][tile2.y] = firstTile;
    this.grid[tile1.x][tile1.y] = secondTile;
  }

  shuffle(countGroup: number = 2) {
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
        const tile = allTiles[index++];

        tile.setCoordinates(x, y);
        this.grid[x][y] = tile;
      }
    }

    if (!this.hasValidMoves(countGroup) && this.shuffleAttempts > 0) {
      this.shuffleAttempts--;
      this.shuffle(countGroup);
    }
  }

  getGrid() {
    return this.grid;
  }

  setGrid(grid) {
    this.grid = grid;
    this.width = grid.length;
    this.height = grid[0].length;
  }

  isValidCoordinate(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  hasValidMoves(countGroup: number = 2) {
    const visited = Array(this.width).fill(null).map(() => Array(this.height).fill(false));
    const floodCount = (sx: number, sy: number, value: any) => {
      let stack = [[sx, sy]];
      let cnt = 0;
      visited[sx][sy] = true;

      while (stack.length) {
        const [x, y] = stack.pop()!;
        cnt++;
        for (let [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (
            this.isValidCoordinate(nx, ny) &&
            !visited[nx][ny] &&
            this.grid[nx][ny]?.value === value
          ) {
            visited[nx][ny] = true;
            stack.push([nx, ny]);
          }
        }
      }
      return cnt;
    };

    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        if (!this.grid[x][y] || visited[x][y]) continue;
        if (floodCount(x, y, this.grid[x][y].value) >= countGroup) {
          return true;
        }
      }
    }

    return false;
  }
}