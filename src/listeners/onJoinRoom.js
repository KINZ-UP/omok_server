const { roomList } = require('./index');
const responseJoinRoom = require('../lib/responseJoinRoom');
const updateRoomList = require('../lib/updateRoomList');

function onJoinRoom(socket, io) {
  return ({ roomId, username }) => {
    const room = roomList.find((room) => room.id === roomId);

    if (!room) {
      socket.emit('responseJoinRoom', {
        success: false,
        message: '존재하지 않는 방입니다.',
      });
      return;
    }

    const flag = room.join(socket.id, username);

    switch (flag.type) {
      case 'NEW_USER': {
        socket.join(room.id);
        socket.joinedRoomId = room.id;
        console.log('joinedRoomId', socket.joinedRoomId);
        responseJoinRoom(socket, room);

        socket.broadcast.to(room.id).emit('update', {
          type: 'NEW_USER',
          username: username,
        });

        updateRoomList(io, roomList);
        return;
      }

      case 'REPLACE': {
        socket.join(room.id);
        socket.joinedRoomId = room.id;
        responseJoinRoom(socket, room);

        const prevSocket = io.sockets.sockets.get(flag.prevSocketId);
        if (!prevSocket) return;
        prevSocket.leave(roomId);
        prevSocket.joinedRoomId = null;
        prevSocket.emit('update', { type: 'ANOTHER_CONNECTION' });
        return;
      }

      case 'FULL': {
        socket.emit('responseJoinRoom', {
          success: false,
          message: '정원이 초과되었습니다.',
        });
        return;
      }

      default: {
        socket.emit('responseJoinRoom', {
          success: false,
          message: '에러 발생',
        });
        return;
      }
    }
  };
}

module.exports = onJoinRoom;
