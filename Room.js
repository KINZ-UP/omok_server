const { uuid } = require('uuidv4');

class Room {
  constructor({ title, password, username }) {
    this.id = uuid();
    this.title = title;
    console.log('username:', username);
    this.password = password ? password : null;
    this.ownerName = username;
    this.players = [];
    this.isStarted = false;
    this.board = null;
  }

  start() {
    this.isStarted = true;
  }

  canStart() {
    return this.players.every((player) => player.isReady);
  }

  end() {
    this.isStarted = false;
    this.board = null;
  }

  join(socketId, username) {
    console.log('user joined', username);
    if (!username) return;
    const playerIdx = this.players.findIndex((player) => {
      return player.username === username;
    });

    if (playerIdx === -1) {
      this.players = [
        ...this.players,
        {
          socketId,
          username,
          isOwner: username === this.ownerName,
          isReady: false,
        },
      ];
      return;
    }

    // update socketId
    this.players[playerIdx].socketId = socketId;

    // socketId 다를 시 대처 필요
  }

  checkUser(username) {
    return this.players.some((player) => player.username === username);
  }

  exit({ socketId }) {
    this.players = this.players.filter(
      (player) => player.socketId !== socketId
    );
  }

  isEmpty() {
    return this.players.length === 0;
  }

  getReady({ socketId }) {
    this.players = this.players.map((player) =>
      player.socketId === socketId ? { ...player, isReady: true } : player
    );
  }
}

module.exports = Room;
