const { roomList } = require('./index');

function onRequestJoin(socket) {
  return ({ roomId, password }) => {
    const room = roomList.find((room) => room.id === roomId);
    if (!room) {
      socket.emit('responseRequestJoin', {
        success: false,
        message: '존재하지 않는 방입니다.',
      });
      return;
    }

    if (room.password != password) {
      socket.emit('responseRequestJoin', {
        success: false,
        message: '비밀번호를 확인하세요.',
      });
      return;
    }

    if (
      room.players.length >= 2 &&
      room.players.every((player) => player.username !== socket.username)
    ) {
      socket.emit('responseRequestJoin', {
        success: false,
        message: '정원이 초과되었습니다.',
      });
      return;
    }

    socket.emit('responseRequestJoin', { success: true });
  };
}

module.exports = onRequestJoin;
