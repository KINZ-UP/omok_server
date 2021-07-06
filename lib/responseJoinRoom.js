function responseJoinRoom(socket, room) {
  const { players, isStarted, turnIdx, totalTime, numOfSection, board } = room;
  socket.emit('responseJoinRoom', {
    success: true,
    data: {
      players,
      isStarted,
      turnIdx,
      totalTime,
      numOfSection,
      history: board ? board.history : [],
    },
  });
}

module.exports = responseJoinRoom;
