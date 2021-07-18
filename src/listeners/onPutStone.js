const { roomList } = require('./index');
const updateRoomList = require('../lib/updateRoomList');

function onPutStone(socket, io) {
  return (position) => {
    const roomId = socket.joinedRoomId;
    const room = roomList.find((room) => room.id === roomId);
    if (!room) return;

    const { x, y } = position;
    if (room.board.grid[y][x] !== 0) {
      io.to(roomId).emit('game', {
        type: 'PUT_STONE_ERROR',
        payload: { message: 'OCCUPIED' },
      });
      return;
    }

    if (room.isBlack() && room.board.isDoubleThree(x, y)) {
      io.to(roomId).emit('game', {
        type: 'PUT_STONE_ERROR',
        payload: { message: '그 위치에는 착수할 수 없습니다.' },
      });
      return;
    }

    room.putStone(x, y);

    if (!room.isStarted) {
      updateRoomList(io, roomList);
    }
  };
}

module.exports = onPutStone;
