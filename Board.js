/* eslint-disable no-constant-condition */
const directions = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
];

const fiveConditions = [
  { startIdx: -4, condition: [1, 1, 1, 1, 1] },
  { startIdx: -3, condition: [1, 1, 1, 1, 1] },
  { startIdx: -2, condition: [1, 1, 1, 1, 1] },
  { startIdx: -1, condition: [1, 1, 1, 1, 1] },
  { startIdx: 0, condition: [1, 1, 1, 1, 1] },
];

const pureFiveConditions = [
  { startIdx: -5, condition: [-1, 1, 1, 1, 1, 1, -1] },
  { startIdx: -4, condition: [-1, 1, 1, 1, 1, 1, -1] },
  { startIdx: -3, condition: [-1, 1, 1, 1, 1, 1, -1] },
  { startIdx: -2, condition: [-1, 1, 1, 1, 1, 1, -1] },
  { startIdx: -1, condition: [-1, 1, 1, 1, 1, 1, -1] },
];

const threeConditions = [
  { startIdx: -2, condition: [-1, 0, 0, 1, 1, 0, 0, -1] },
  { startIdx: -3, condition: [-1, 0, 1, 0, 1, 0, 0, -1] },
  { startIdx: -4, condition: [-1, 0, 1, 1, 0, 0, 0, -1] },
  { startIdx: -2, condition: [-1, 0, 0, 1, 0, 1, 0, -1] },
  { startIdx: -3, condition: [-1, 0, 1, 0, 0, 1, 0, -1] },
  { startIdx: -5, condition: [-1, 0, 1, 1, 0, 0, 0, -1] },
  { startIdx: -2, condition: [-1, 0, 0, 0, 1, 1, 0, -1] },
  { startIdx: -4, condition: [-1, 0, 1, 0, 0, 1, 0, -1] },
  { startIdx: -5, condition: [-1, 0, 1, 0, 1, 0, 0, -1] },
  { startIdx: -3, condition: [-1, 0, 0, 0, 1, 1, 0, -1] },
  { startIdx: -4, condition: [-1, 0, 0, 1, 0, 1, 0, -1] },
  { startIdx: -5, condition: [-1, 0, 0, 1, 1, 0, 0, -1] },
];

class Board {
  constructor(n) {
    this.size = n;
    this.grid = Array.from({ length: n + 1 }, () => Array(n + 1).fill(0));
    this.history = [];
    this.color = 1;
    console.log(this.grid);
  }

  put(x, y) {
    this.grid[y][x] = this.color;
    this.history.push({ x, y, color: this.color });
    const flag = this.checkWin(x, y);
    this.color = -this.color;
    console.table(this.grid);
    return flag;
  }

  rollback(c) {
    if (this.history.length === 0) return 0;
    for (let i = 0; i < 2; i++) {
      const { x, y, color } = this.history.pop();
      this.grid[y][x] = 0;
      if (c === color) break;
    }
    return this.history.length;
  }

  checkWin(x, y) {
    return this.color === 1 ? this.isBlackWin(x, y) : this.isWhiteWin(x, y);
  }

  isBlackWin(x, y) {
    return directions.some((direction) => {
      return this.isPureFiveInRow(x, y, direction);
    });
  }

  isWhiteWin(x, y) {
    return directions.some((direction) => {
      return this.isFiveInRow(x, y, direction);
    });
  }

  isPureFiveInRow(x, y, direction) {
    return this.checkCondition(pureFiveConditions, x, y, direction);
  }

  isFiveInRow(x, y, direction) {
    return this.checkCondition(fiveConditions, x, y, direction);
  }

  isDoubleThree(x, y) {
    let count = 0;
    for (let direction of directions) {
      if (this.isThree(x, y, direction)) {
        count += 1;
      }
      if (count == 2) {
        return true;
      }
    }
    return false;
  }

  isThree(x, y, direction) {
    return this.checkCondition(threeConditions, x, y, direction);
  }

  checkCondition(conditions, x, y, direction) {
    const [dx, dy] = direction;
    return conditions.some((check) => {
      const { startIdx, condition } = check;
      return condition
        .map((c, idx) => [
          x + (startIdx + idx) * dx,
          y + (startIdx + idx) * dy,
          c,
        ])
        .every((item) => {
          const [posX, posY, c] = item;
          switch (c) {
            case 1:
              return this.isOccupiedWithCurrColor(posX, posY);
            case 0:
              return this.isBlank(posX, posY);
            case -1:
              return !this.isOccupiedWithCurrColor(posX, posY);
            default:
              return false;
          }
        });
    });
  }

  isOccupiedWithCurrColor(x, y) {
    return this.inRange(x, y) && this.grid[y][x] === this.color;
  }

  isBlank(x, y) {
    return this.inRange(x, y) && this.grid[y][x] === 0;
  }

  inRange(x, y) {
    return x >= 0 && y >= 0 && x <= this.size && y <= this.size;
  }
}

module.exports = Board;
