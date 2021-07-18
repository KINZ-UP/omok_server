const { roomList } = require('./index');
const updateRoomList = require('../lib/updateRoomList');

function onUpdateSetting(socket, io) {
  return ({ totalTime, numOfSection }) => {
    const roomId = socket.joinedRoomId;
    const room = roomList.find((room) => room.id === roomId);
    if (!room) return;

    room.updateSetting({ totalTime, numOfSection });
    io.to(roomId).emit('update', {
      type: 'SETTING',
      payload: { totalTime, numOfSection },
    });

    updateRoomList(io, roomList);
  };
}

module.exports = onUpdateSetting;
