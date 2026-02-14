/**
 * Spatial hash for efficient neighbor queries.
 * Divides space into cells and indexes items by cell.
 */
export class SpatialHash {
  /**
   * @param {number} cellSize - size of each grid cell
   * @param {number} width - total width
   * @param {number} height - total height
   */
  constructor(cellSize, width, height) {
    this.cellSize = cellSize;
    this.width = width;
    this.height = height;
    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);
    this.cells = new Map();
  }

  _key(col, row) {
    return row * this.cols + col;
  }

  _cellCoords(x, y) {
    return {
      col: Math.floor(x / this.cellSize),
      row: Math.floor(y / this.cellSize),
    };
  }

  /**
   * Insert an item with position (x, y).
   * @param {object} item - must have .x and .y properties
   */
  insert(item) {
    const { col, row } = this._cellCoords(item.x, item.y);
    const key = this._key(col, row);
    if (!this.cells.has(key)) {
      this.cells.set(key, []);
    }
    this.cells.get(key).push(item);
  }

  /**
   * Find all items within `radius` of (x, y).
   * @param {number} x
   * @param {number} y
   * @param {number} radius
   * @returns {Array<object>}
   */
  query(x, y, radius) {
    const results = [];
    const minCol = Math.floor((x - radius) / this.cellSize);
    const maxCol = Math.floor((x + radius) / this.cellSize);
    const minRow = Math.floor((y - radius) / this.cellSize);
    const maxRow = Math.floor((y + radius) / this.cellSize);
    const r2 = radius * radius;

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) continue;
        const cell = this.cells.get(this._key(col, row));
        if (!cell) continue;
        for (const item of cell) {
          const dx = item.x - x;
          const dy = item.y - y;
          if (dx * dx + dy * dy <= r2) {
            results.push(item);
          }
        }
      }
    }
    return results;
  }
}
