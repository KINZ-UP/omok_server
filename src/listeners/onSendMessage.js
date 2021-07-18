function onSendMessage(socket) {
  return (message) => {
    const roomId = socket.joinedRoomId;
    socket.broadcast.to(roomId).emit('update', {
      type: 'MESSAGE',
      payload: {
        username: socket.username,
        content: message,
      },
    });
  };
}

module.exports = onSendMessage;
