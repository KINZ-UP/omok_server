const { roomList } = require('./index');
const onLeaveRoom = require('./onLeaveRoom');

function onDisconnected(socket, io) {
  return () => {
    const roomId = socket.joinedRoomId;
    const room = roomList.find((room) => room.id === roomId);
    if (!room) return;

    room.onUserDisconnected(socket.username, onLeaveRoom(socket, io));
  };
}

module.exports = onDisconnected;
