const express = require('express');
const socket = require('socket.io');
const http = require('http');
const app = express();
const server = http.createServer(app);
const io = socket(server, { cors: { origin: '*' } });

const Room = require('./Room');

let roomList = [];

io.sockets.on('connection', function (socket) {
  socket.on('newUser', (username) => {
    socket.username = username;
    console.log(
      `socket_id: ${socket.id}, username: ${socket.username} is connected`
    );

    socket.broadcast.emit('updateTest', 'testMessage');
  });

  socket.on('requestRoomList', () => {
    socket.emit(
      'sendRoomList',
      roomList.map((room) => {
        const { id, title, isStarted, players } = room;
        return { id, title, isStarted, currNum: players.length };
      })
    );
  });

  socket.on('onCreateRoom', ({ title, password }) => {
    const room = new Room({
      title,
      password,
      socketId: socket.id,
      username: socket.username,
    });

    // socket.join(room.id);
    roomList = [...roomList, room];
    socket.emit('sendRoomId', room.id);
    io.emit(
      'sendRoomList',
      roomList.map((room) => {
        const { id, title, isStarted, players } = room;
        return { id, title, isStarted, currNum: players.length };
      })
    );
  });

  socket.on('requestJoin', ({ roomId, password }) => {
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

    if (room.players.length >= 2) {
      socket.emit('responseRequestJoin', {
        success: false,
        message: '정원이 초과되었습니다.',
      });
      return;
    }

    if (room.players.some((player) => player.username === socket.username)) {
      socket.emit('responseRequestJoin', {
        success: false,
        message: '이미 참가한 방입니다.',
      });
    }

    room.join({ socketId: socket.id, username: socket.username });
    socket.emit('responseRequestJoin', { success: true });
  });

  socket.on('requestRoomId', () => {
    const room = roomList.find((room) =>
      room.players.some((player) => player.username === socket.username)
    );
    if (!room) {
      socket.emit('responseRequestRoomId', {
        success: false,
        message: '참여 중인 방이 없습니다..',
      });
      return;
    }
    socket.emit('responseRequestRoomId', { success: true, roomId: room.id });
  });

  socket.on('joinRoom', ({ roomId, username }) => {
    const room = roomList.find((room) => room.id === roomId);

    if (!room) {
      socket.emit('responseJoinRoom', {
        success: false,
        message: '존재하지 않는 방입니다.',
      });
      return;
    }

    socket.join(room.id);
    room.join(socket.id, username);

    const { title, players, isStarted, turnIdx, board } = room;
    socket.emit('responseJoinRoom', {
      success: true,
      data: {
        title,
        players,
        isStarted,
        turnIdx,
        history: board ? board.history : [],
      },
    });

    socket.broadcast.to(room.id).emit('update', {
      type: 'NEW_USER',
      username: username,
    });

    io.emit(
      'sendRoomList',
      roomList.map((room) => {
        const { id, title, isStarted, players } = room;
        return { id, title, isStarted, currNum: players.length };
      })
    );
  });

  socket.on('sendMessage', ({ roomId, message }) => {
    console.log(message);
    console.log(roomId);
    socket.broadcast.to(roomId).emit('update', {
      type: 'MESSAGE',
      payload: {
        username: socket.username,
        content: message,
      },
    });
  });

  socket.on('toggleReady', (roomId) => {
    console.log('toggle ready', roomId);
    const room = roomList.find((room) => room.id === roomId);
    room.toggleReady(socket.username);

    socket.broadcast.to(roomId).emit('update', {
      type: 'TOGGLE_READY',
      payload: {
        username: socket.username,
      },
    });
  });

  socket.on('startGame', (roomId) => {
    const room = roomList.find((room) => room.id === roomId);
    room.start();
    io.to(roomId).emit('update', {
      type: 'START',
      payload: { turnIdx: room.turnIdx },
    });
    console.log(`Room ${roomId} has started the game`);
  });

  socket.on('surrender', (roomId) => {
    const room = roomList.find((room) => room.id === roomId);
    const { winner, loser } = room.end({ loser: socket.username });
    io.to(roomId).emit('update', { type: 'END', payload: { winner, loser } });
  });

  socket.on('onLeaveRoom', ({ roomId }) => {
    socket.leave(roomId);
    const { username } = socket;
    console.log(username, 'has left the room', roomId);
    const room = roomList.find((room) => room.id === roomId);
    room.exit({ username });
    if (room.isEmpty()) {
      roomList = roomList.filter((room) => room.id !== roomId);
    }

    io.emit(
      'sendRoomList',
      roomList.map((room) => {
        const { id, title, isStarted, players } = room;
        return { id, title, isStarted, currNum: players.length };
      })
    );
  });

  socket.on('putStone', ({ roomId, position }) => {
    console.log('PUT_STONE', roomId, position);
    const { x, y } = position;
    const room = roomList.find((room) => room.id === roomId);
    if (room.board.grid[y][x] !== 0) {
      io.to(roomId).emit('game', {
        type: 'PUT_STONE_ERROR',
        payload: { message: 'OCCUPIED' },
      });
      return;
    }

    if (room.board.isDoubleThree(x, y)) {
      io.to(roomId).emit('game', {
        type: 'PUT_STONE_ERROR',
        payload: { message: 'DOUBLE_THREE' },
      });
      return;
    }

    const flag = room.putStone(x, y);
    const turnIdx = room.turnIdx;

    io.to(roomId).emit('game', {
      type: 'PUT_STONE',
      payload: { x, y, turnIdx },
    });

    if (!flag) return;
    const winnerIdx = room.end(room.turnIdx);

    io.to(roomId).emit('update', {
      type: 'END',
      payload: { winnerIdx },
    });
  });

  socket.on('rollback', ({ roomId }) => {
    console.log('rollback request');
    socket.broadcast.to(roomId).emit('update', {
      type: 'REQUEST_ROLLBACK',
    });
  });

  socket.on('approveRollback', ({ roomId, color }) => {
    const room = roomList.find((room) => room.id === roomId);
    const remainLength = room.board.rollback(color);
    socket.to(roomId).emit('update', {
      type: 'ROLLBACK',
      payload: { remainLength },
    });
  });

  socket.on('declineRollback', ({ roomId }) => {
    console.log(socket.username, 'has declined rollback request');
    socket.to(roomId).emit('update', {
      type: 'DECLINE_ROLLBACK',
    });
  });

  socket.on('disconnect', function () {
    console.log(socket.name + ' 님이 나가셨습니다.');

    socket.broadcast.emit('update', {
      type: 'disconnect',
      name: 'SERVER',
      message: socket.name + ' 님이 나가셨습니다.',
    });
  });
});

server.listen(8000, () => console.log('The server has been launched'));
