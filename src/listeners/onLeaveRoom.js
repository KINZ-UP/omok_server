const { roomList } = require('./index');
const updateRoomList = require('../lib/updateRoomList');

function onLeaveRoom(socket, io) {
  return () => {
    const roomId = socket.joinedRoomId;
    socket.leave(roomId);
    socket.joinedRoomId = null;

    const { username } = socket;
    console.log(username, 'has left the room', roomId);

    const idx = roomList.findIndex((room) => room.id === roomId);
    if (idx === -1) return;

    const room = roomList[idx];
    room.exit({ username });

    if (room.isEmpty()) {
      roomList.splice(idx, 1);
    }

    socket.broadcast.to(roomId).emit('update', {
      type: 'EXIT_USER',
      payload: { players: room.players, exitUser: username },
    });

    updateRoomList(io, roomList);
  };
}

module.exports = onLeaveRoom;
