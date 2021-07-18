function updateRoomList(io, roomList) {
  io.emit(
    'sendRoomList',
    roomList.map((room) => {
      const {
        id,
        title,
        password,
        isStarted,
        players,
        totalTime,
        numOfSection,
      } = room;
      return {
        id,
        title,
        password,
        isStarted,
        currNum: players.length,
        totalTime,
        numOfSection,
      };
    })
  );
}

module.exports = updateRoomList;
