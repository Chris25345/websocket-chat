const express = require('express');
const http = require('http')
const path = require('path');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');


const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = 3000 ?? process.env.PORT;

app.use(express.static(path.join(__dirname, 'public')));
const botName = 'ChatCord Bot'

//Run when a client connects
io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);

    // Welcome current user
    socket.emit('message', formatMessage(botName, 'Welcome to ChatCord!')); // single client

    // Broadcast when a user conncets
    socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat`)); // everyone exept the client

    // Send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  // Listen for chatMessage
  socket.on('chatMessage', (msg) => {
    const user = getCurrentUser(socket.id)
    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });

  // Runs when a client disconnects
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));
      // Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });

  // io.emit() // all the clients
})

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
})
