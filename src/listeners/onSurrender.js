const { roomList } = require('./index');
const updateRoomList = require('../lib/updateRoomList');

function onSurrender(socket, io) {
  return (loserIdx) => {
    const roomId = socket.joinedRoomId;
    const room = roomList.find((room) => room.id === roomId);
    if (!room) return;

    room.surrender(loserIdx);
    console.log(room.players[loserIdx].username, 'has surrendered');
    updateRoomList(io, roomList);
  };
}

module.exports = onSurrender;
