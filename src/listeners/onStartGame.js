const { roomList } = require('./index');
const updateRoomList = require('../lib/updateRoomList');

function onStartGame(socket, io) {
  return () => {
    const roomId = socket.joinedRoomId;
    const room = roomList.find((room) => room.id === roomId);
    if (!room) return;

    if (!room.canStart()) {
      io.to(roomId).emit('update', {
        type: 'START_ERROR',
        payload: { message: '게임을 시작할 수 없습니다.' },
      });
      return;
    }

    room.start();

    io.to(roomId).emit('update', {
      type: 'START',
      payload: { turnIdx: room.turnIdx },
    });

    updateRoomList(io, roomList);
    console.log(`Room ${roomId} has started the game`);
  };
}

module.exports = onStartGame;
