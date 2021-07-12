function updateRoomList(io, roomList) {
  io.emit(
    'sendRoomList',
    roomList.map((room) => {
      const { id, title, password, isStarted, players } = room;
      return { id, title, password, isStarted, currNum: players.length };
    })
  );
}

module.exports = updateRoomList;
