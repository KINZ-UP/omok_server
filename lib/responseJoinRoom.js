function responseJoinRoom(socket, room) {
  const { title, players, isStarted, turnIdx, board } = room;
  socket.emit('responseJoinRoom', {
    success: true,
    data: {
      title,
      players,
      isStarted,
      turnIdx,
      history: board ? board.history : [],
    },
  });
}

module.exports = responseJoinRoom;
