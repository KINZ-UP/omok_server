const onLeaveRoom = require('./onLeaveRoom');

function onDisconnected(io, socket, roomList) {
  return () => {
    if (!socket.joinedRoomId) return;

    const room = roomList.find((room) => room.id === socket.joinedRoomId);
    if (!room) return;

    room.onUserDisconnected(socket.username, onLeaveRoom(io, socket, roomList));
  };
}

module.exports = onDisconnected;
