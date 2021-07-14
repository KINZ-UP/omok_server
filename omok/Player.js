const DISCONNECTION_TIMEOUT_LIMIT = 10000;

class Player {
  constructor(socketId, username, isOwner) {
    this.username = username;
    this.socketId = socketId;
    this.isOwner = isOwner;
    this.isReady = isOwner;
    this.isFirst = isOwner;
    this.isTurn = false;
    this.timeoutId = null;
  }

  setAsOwner() {
    this.isOwner = true;
    this.isReady = true;
    this.isFirst = true;
  }

  toggleReady() {
    this.isReady = !this.isReady;
  }

  onGameEnd() {
    this.isFirst = !this.isFirst;
    this.isReady = this.isOwner;
  }

  onDisconnected(timeoutCallback) {
    this.timeoutId = setTimeout(timeoutCallback, DISCONNECTION_TIMEOUT_LIMIT);
  }

  resetTimeout() {
    if (!this.timeoutId) return;
    clearTimeout(this.timeoutId);
  }
}

module.exports = Player;
