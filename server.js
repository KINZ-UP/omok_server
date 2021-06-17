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
    if (room.players.length >= 2) {
      socket.emit('responseJoinRoom', {
        success: false,
        message: '정원이 초과되었습니다.',
      });
      return;
    }

    socket.join(room.id);
    room.join(socket.id, username);
    const { title, players, isStarted } = room;
    socket.emit('responseJoinRoom', {
      success: true,
      data: { title, players, isStarted },
    });

    io.emit(
      'sendRoomList',
      roomList.map((room) => {
        const { id, title, isStarted, players } = room;
        return { id, title, isStarted, currNum: players.length };
      })
    );
  });

  socket.on('onLeaveRoom', ({ roomId }) => {
    socket.leave(roomId);
    const room = roomList.find((room) => room.id === roomId);
    room.exit({ socketId: socket.id });
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

  socket.on('roomMessage', (message) => {
    console.log(message);
    console.log(io.sockets.adapter.rooms);
    console.log(socket.adapter.rooms);
    socket.to('room01').emit('message', message);
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
