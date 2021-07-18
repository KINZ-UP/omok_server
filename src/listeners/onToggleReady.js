const { roomList } = require('./index');

function onToggleReady(socket) {
  return () => {
    const roomId = socket.joinedRoomId;
    const room = roomList.find((room) => room.id === roomId);
    if (!room) return;

    room.toggleReady(socket.username);

    socket.broadcast.to(roomId).emit('update', {
      type: 'TOGGLE_READY',
      payload: {
        username: socket.username,
      },
    });
  };
}

module.exports = onToggleReady;
