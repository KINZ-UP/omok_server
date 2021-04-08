const express = require("express");
const socket = require("socket.io");
const http = require("http");
const app = express();
const server = http.createServer(app);
const io = socket(server, { cors: { origin: "*" } });

io.sockets.on("connection", function (socket) {
  socket.on("newUser", function (name) {
    console.log(name, +" 님이 접속하였습니다.");

    socket.name = name;

    io.sockets.emit("update", {
      type: "connect",
      name: "SERVER",
      message: name + " 님이 접속하였습니다.",
    });
  });

  socket.on("message", function (data) {
    data.name = socket.name;
    console.log(data);

    socket.broadcast.emit("update", data);
  });

  socket.on("disconnect", function () {
    console.log(socket.name + " 님이 나가셨습니다.");

    socket.broadcast.emit("update", {
      type: "disconnect",
      name: "SERVER",
      message: socket.name + " 님이 나가셨습니다.",
    });
  });
});
server.listen(8080, () => console.log("The server has been launched"));
