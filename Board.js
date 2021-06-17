const directions = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
];

const threeChecks = [
  { diff: [-3, -2, -1, 1], shouldOccupied: [0, 1, 1, 0] },
  { diff: [-2, -1, 1, 2], shouldOccupied: [0, 1, 1, 0] },
  { diff: [-1, 1, 2, 3], shouldOccupied: [0, 1, 1, 0] },
  { diff: [-4, -3, -2, -1, 1], shouldOccupied: [0, 1, 1, 0, 0] },
  { diff: [-4, -3, -2, -1, 1], shouldOccupied: [0, 1, 0, 1, 0] },
  { diff: [-3, -2, -1, 1, 2], shouldOccupied: [0, 1, 0, 1, 0] },
  { diff: [-2, -1, 1, 2, 3], shouldOccupied: [0, 1, 0, 1, 0] },
  { diff: [-1, 1, 2, 3, 4], shouldOccupied: [0, 1, 0, 1, 0] },
  { diff: [-1, 1, 2, 3, 4], shouldOccupied: [0, 0, 1, 1, 0] },
];

const fiveChecks = [
  { diff: [-5, -4, -3, -2, -1, 1], shouldOccupied: [0, 1, 1, 1, 1, 0] },
  { diff: [-4, -3, -2, -1, 1, 2], shouldOccupied: [0, 1, 1, 1, 1, 0] },
  { diff: [-3, -2, -1, 1, 2, 3], shouldOccupied: [0, 1, 1, 1, 1, 0] },
  { diff: [-2, -1, 1, 2, 3, 4], shouldOccupied: [0, 1, 1, 1, 1, 0] },
  { diff: [-1, 1, 2, 3, 4, 5], shouldOccupied: [0, 1, 1, 1, 1, 0] },
];

class Board {
  constructor(n) {
    this.size = n;
    this.grid = Array.from({ length: n }, () => Array(n).fill(0));
    this.history = [];
  }

  put(color, x, y) {
    this.grid[x][y] = 1;
    this.history.push({ color, x, y });

    return this.existAnyFive(color, x, y);
  }

  rollback() {
    if (this.history.length === 0) return;
    const { x, y } = this.history.pop();
    this.grid[x][y] = 0;
  }

  existAnyFive(color, x, y) {
    return directions.some((direction) => {
      const [dx, dy] = direction;
      return this.isFiveInRow(color, x, y, dx, dy);
    });
  }

  isFiveInRow(color, x, y, dx, dy) {
    return this.isContinuous(fiveChecks, color, x, y, dx, dy);
  }

  isDoubleThree(color, x, y) {
    let count = 0;
    for (let direction of directions) {
      const [dx, dy] = direction;
      if (this.isThree(color, x, y, dx, dy)) {
        count += 1;
      }
      if (count == 2) {
        return true;
      }
    }
    return false;
  }

  isThree(color, x, y, dx, dy) {
    return this.isContinuous(threeChecks, color, x, y, dx, dy);
  }

  checkContinuous(checkItems, color, x, y, dx, dy) {
    const sign = color === 'B' ? 1 : -1;
    return checkItems.some((item) => {
      const coords = item.diff.map((n) => [x + n * dx, y + n * dy]);
      return coords.every((coord, idx) => {
        const [currX, currY] = coord;
        const occupied = this.grid[currX][currY] === sign;
        const shouldOccupied = item.shouldOccupied[idx] === 1;
        return occupied === shouldOccupied;
      });
    });
  }

  isOccupied(node, sign) {
    if (!this.inRange(node)) return false;

    const [x, y] = node;
    return this.grid[x][y] === sign;
  }

  inRange(node) {
    const [x, y] = node;
    return x >= 0 && y >= 0 && x < this.size && y < this.size;
  }
}

module.exports = Board;
