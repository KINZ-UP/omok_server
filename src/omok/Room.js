const { v4 } = require('uuid');
const Board = require('./Board');
const Player = require('./Player');

class Room {
  constructor({ io, title, password, username, totalTime, numOfSection }) {
    this.id = v4();
    this.socket = io.to(this.id);
    this.title = title;
    this.password = password ? password : null;
    this.ownerName = username;
    this.players = [];
    this.turnIdx = null;
    this.isStarted = false;
    this.board = null;
    this.totalTime = totalTime;
    this.remainTime = this.totalTime;
    this.numOfSection = numOfSection;
  }

  toggleReady(username) {
    this.players.forEach((player) => {
      if (player.username === username) {
        player.toggleReady();
      }
    });
  }

  start() {
    this.isStarted = true;
    this.turnIdx = this.players.findIndex((player) => player.isFirst);
    this.board = new Board(this.numOfSection);
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
    this.players.forEach((player) => player.onGameEnd());
    this.turnIdx = null;
  }

  join(socketId, username) {
    console.log('user joined', username);

    if (!username) return { type: 'UNDEFINED_USER' };

    const player = this.players.find((player) => {
      return player.username === username;
    });

    if (!player) {
      if (this.players.length >= 2) {
        return { type: 'FULL' };
      }
      this.players = [
        ...this.players,
        new Player(socketId, username, username === this.ownerName),
      ];
      return { type: 'NEW_USER' };
    }

    // reset disconnection timeout
    player.resetTimeout();

    // update socketId
    const prevSocketId = player.socketId;
    player.socketId = socketId;
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
      player.setAsOwner();

      this.ownerName = player.name;
    }
  }

  isEmpty() {
    return this.players.length === 0;
  }

  putStone(x, y) {
    const flag = this.board.put(x, y);
    this.turnIdx = 1 - this.turnIdx;
    this.socket.emit('game', {
      type: 'PUT_STONE',
      payload: { x, y, turnIdx: this.turnIdx },
    });

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
      this.emitTimer();
    }, 1000);
  }

  updateTimer() {
    this.remainTime = this.remainTime - 1;
    if (this.remainTime <= 0) {
      this.emitTimer();
      this.resetTimer();
      this.end(this.turnIdx);
    }
  }

  emitTimer() {
    this.socket.emit('timer', this.remainTime);
  }

  resetTimer() {
    this.remainTime = this.totalTime;
    clearInterval(this.timer);
  }

  updateSetting({ totalTime, numOfSection }) {
    this.totalTime = totalTime;
    this.remainTime = totalTime;
    this.numOfSection = numOfSection;
  }

  surrender(loserIdx) {
    this.resetTimer();
    this.end(loserIdx);
  }

  isBlack() {
    return this.players[this.turnIdx].isFirst;
  }

  onUserDisconnected(username, timeoutCallback) {
    const disconnectedPlayer = this.players.find(
      (player) => player.username === username
    );
    if (!disconnectedPlayer) return;

    disconnectedPlayer.onDisconnected(timeoutCallback);
  }
}

module.exports = Room;
