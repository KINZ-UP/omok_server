require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const mongoose = require('mongoose');
const app = express();
app.use(cors());

const socket = require('socket.io');
const server = http.createServer(app);
const io = socket(server, { cors: { origin: '*' } });

//Import Routes
const authRoute = require('./routes/auth');
const postRoute = require('./routes/posts');

// Connect to DB
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

//  Socket Logics
const initListeners = require('./listeners');
initListeners(io);

server.listen(4000, () => console.log('The server has been launched'));
