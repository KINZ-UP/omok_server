function updateRoomList(io, roomList) {
  io.emit(
    'sendRoomList',
    roomList.map((room) => {
      const { id, title, isStarted, players } = room;
      return { id, title, isStarted, currNum: players.length };
    })
  );
}

module.exports = updateRoomList;
