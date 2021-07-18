const { roomList } = require('./index');
const Room = require('../omok/Room');
const updateRoomList = require('../lib/updateRoomList');

function onCreateRoom(socket, io) {
  return ({ title, password, setting }) => {
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

    roomList.push(room);
    socket.emit('sendRoomId', room.id);
    updateRoomList(io, roomList);
  };
}

module.exports = onCreateRoom;
