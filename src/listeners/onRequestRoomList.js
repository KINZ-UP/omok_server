const { roomList } = require('.');
const updateRoomList = require('../lib/updateRoomList');

function onRequestRoomList(socket) {
  return () => {
    updateRoomList(socket, roomList);
  };
}

module.exports = onRequestRoomList;
