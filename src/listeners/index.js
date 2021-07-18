const roomList = [];
module.exports.roomList = roomList;

const onNewUser = require('./onNewUser');
const onRequestRoomList = require('./onRequestRoomList');
const onCreateRoom = require('./onCreateRoom');
const onRequestJoin = require('./onRequestJoin');
const onJoinRoom = require('./onJoinRoom');
const onSendMessage = require('./onSendMessage');
const onToggleReady = require('./onToggleReady');
const onStartGame = require('./onStartGame');
const onSurrender = require('./onSurrender');
const onLeaveRoom = require('./onLeaveRoom');
const onPutStone = require('./onPutStone');
const onUpdateSetting = require('./onUpdateSetting');
const onDisconnected = require('./onDisconnected');

module.exports = (io) => {
  io.sockets.on('connection', function (socket) {
    socket.on('newUser', onNewUser(socket));
    socket.on('requestRoomList', onRequestRoomList(socket));
    socket.on('createRoom', onCreateRoom(socket, io));
    socket.on('requestJoin', onRequestJoin(socket));
    socket.on('joinRoom', onJoinRoom(socket, io));
    socket.on('sendMessage', onSendMessage(socket));
    socket.on('toggleReady', onToggleReady(socket));
    socket.on('startGame', onStartGame(socket, io));
    socket.on('surrender', onSurrender(socket, io));
    socket.on('leaveRoom', onLeaveRoom(socket, io));
    socket.on('putStone', onPutStone(socket, io));
    socket.on('updateSetting', onUpdateSetting(socket, io));
    socket.on('disconnect', onDisconnected(socket, io));
  });
};
