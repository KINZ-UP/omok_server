function onNewUser(socket) {
  return (username) => {
    socket.username = username;
    console.log(
      `socket_id: ${socket.id}, username: ${socket.username} is connected`
    );
    socket.broadcast.emit('updateTest', 'testMessage');
  };
}

module.exports = onNewUser;
