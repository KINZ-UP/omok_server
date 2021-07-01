const { uuid } = require('uuidv4');
const Board = require('./Board');

class Room {
  constructor({ io, title, password, username }) {
    this.id = uuid();
    this.socket = io.to(this.id);
    this.title = title;
    this.password = password ? password : null;
    this.ownerName = username;
    this.players = [];
    this.turnIdx = null;
    this.isStarted = false;
    this.board = null;
    this.timeLimit = 30;
    this.remainTime = this.timeLimit;
  }

  toggleReady(username) {
    this.players = this.players.map((player) =>
      player.username === username
        ? { ...player, isReady: !player.isReady }
        : player
    );
  }

  start() {
    this.isStarted = true;
    this.turnIdx = this.players.findIndex((player) => player.isFirst);
    this.board = new Board(10);
    this.initTimer();
  }

  canStart() {
    return (
      this.players.length === 2 &&
      this.players.every((player) => player.isReady)
    );
  }

  end(loserIdx) {
    this.socket.emit('update', {
      type: 'END',
      payload: { winnerIdx: 1 - loserIdx },
    });

    this.isStarted = false;
    this.board = null;
    this.players = this.players.map((player) => ({
      ...player,
      isFirst: !player.isFirst,
      isReady: player.isOwner,
    }));
    this.turnIdx = null;
  }

  join(socketId, username) {
    console.log('user joined', username);

    if (!username) return { type: 'UNDEFINED_USER' };

    const playerIdx = this.players.findIndex((player) => {
      return player.username === username;
    });

    if (playerIdx === -1) {
      if (this.players.length >= 2) {
        return { type: 'FULL' };
      }
      this.players = [
        ...this.players,
        {
          socketId,
          username,
          isOwner: username === this.ownerName,
          isReady: username === this.ownerName,
          isFirst: username === this.ownerName,
          isTurn: false,
        },
      ];
      return { type: 'NEW_USER' };
    }

    // update socketId
    const prevSocketId = this.players[playerIdx].socketId;
    this.players[playerIdx].socketId = socketId;
    console.log('prev', prevSocketId);
    console.log('curr', socketId);

    return { type: 'REPLACE', prevSocketId };
  }

  checkUser(username) {
    return this.players.some((player) => player.username === username);
  }

  exit({ username }) {
    this.players = this.players.filter(
      (player) => player.username !== username
    );

    if (this.players.length === 1) {
      const player = this.players[0];
      player.isOwner = true;
      player.isReady = true;
      player.isFirst = true;

      this.ownerName = player.name;
    }
  }

  isEmpty() {
    return this.players.length === 0;
  }

  getReady({ socketId }) {
    this.players = this.players.map((player) =>
      player.socketId === socketId ? { ...player, isReady: true } : player
    );
  }

  putStone(x, y) {
    const flag = this.board.put(x, y);
    this.socket.emit('game', {
      type: 'PUT_STONE',
      payload: { x, y, turnIdx: this.turnIdx },
    });

    this.turnIdx = 1 - this.turnIdx;
    this.resetTimer();
    if (!flag) {
      this.initTimer();
      return;
    }
    this.end(this.turnIdx);
  }

  initTimer() {
    this.timer = setInterval(() => {
      this.updateTimer();
    }, 1000);
    this.emitTimer();
  }

  updateTimer() {
    this.remainTime = this.remainTime - 1;
    if (this.remainTime <= 0) {
      this.resetTimer();
      this.end(this.turnIdx);
    }
  }

  emitTimer() {
    this.socket.emit('timer', this.remainTime);
  }

  resetTimer() {
    this.remainTime = this.timeLimit;
    clearInterval(this.timer);
  }

  surrender(loserIdx) {
    this.resetTimer();
    this.end(loserIdx);
  }
}

module.exports = Room;
