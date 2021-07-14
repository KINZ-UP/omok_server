require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const mongoose = require('mongoose');
const app = express();
app.use(cors());

const socket = require('socket.io');
const server = http.createServer(app);
const io = socket(server, { cors: { origin: '*' } });

const Room = require('./omok/Room');
const responseJoinRoom = require('./lib/responseJoinRoom');
const updateRoomList = require('./lib/updateRoomList');

//Import Routes
const authRoute = require('./routes/auth');
const postRoute = require('./routes/posts');

// Connect to DB
mongoose.connect(
  process.env.MONGODB_CONNECT,
  { useNewUrlParser: true, useUnifiedTopology: true },
  () => console.log('connected to db!')
);

//Middleware
app.use(express.json());

//Route Middlewares
app.use('/api/user', authRoute);
app.use('/api/posts', postRoute);

//  Socket Logics

const roomList = [];
const onLeaveRoom = require('./lib/onLeaveRoom');
const onDisconnected = require('./lib/onDisconnected');

io.sockets.on('connection', function (socket) {
  socket.on('newUser', (username) => {
    socket.username = username;
    console.log(
      `socket_id: ${socket.id}, username: ${socket.username} is connected`
    );
    socket.broadcast.emit('updateTest', 'testMessage');
  });

  socket.on('requestRoomList', () => {
    updateRoomList(socket, roomList);
  });

  socket.on('onCreateRoom', ({ title, password, setting }) => {
    const { totalTime, numOfSection } = setting;
    const room = new Room({
      io,
      title,
      password,
      socketId: socket.id,
      username: socket.username,
      totalTime,
      numOfSection,
    });

    // socket.join(room.id);
    roomList.push(room);
    socket.emit('sendRoomId', room.id);
    updateRoomList(io, roomList);
  });

  socket.on('requestJoin', ({ roomId, password }) => {
    console.log('requestJoin');
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

    // room.join({ socketId: socket.id, username: socket.username });
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
  });

  socket.on('sendMessage', ({ roomId, message }) => {
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
  });

  socket.on('surrender', ({ roomId, loserIdx }) => {
    const room = roomList.find((room) => room.id === roomId);
    room.surrender(loserIdx);
    console.log(room.players[loserIdx].username, 'has surrendered');

    updateRoomList(io, roomList);
  });

  socket.on('onLeaveRoom', onLeaveRoom(io, socket, roomList));

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
  });

  socket.on('updateSetting', ({ roomId, totalTime, numOfSection }) => {
    const room = roomList.find((room) => room.id === roomId);
    if (!room) return;

    console.log('Updated Setting!');

    room.updateSetting({ totalTime, numOfSection });
    io.to(roomId).emit('update', {
      type: 'SETTING',
      payload: { totalTime, numOfSection },
    });

    updateRoomList(io, roomList);
  });

  socket.on('disconnect', onDisconnected(io, socket, roomList));
});

server.listen(4000, () => console.log('The server has been launched'));
