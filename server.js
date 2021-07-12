require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const app = express();

const socket = require('socket.io');
const server = http.createServer(app);
const io = socket(server, { cors: { origin: '*' } });
const onSocketConnection = require('./lib/onSocketConnection');

//Import Routes
const authRoute = require('./routes/auth');
const postRoute = require('./routes/posts');
const roomRoute = require('./routes/rooms');

//Connect to DB
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
app.use('/api/rooms', roomRoute);

//  Socket Logics
io.sockets.on('connection', onSocketConnection);

server.listen(8000, () => console.log('The server has been launched'));

module.exports.io = io;
