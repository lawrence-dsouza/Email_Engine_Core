const ImapService = require('../services/ImapService');
const socketIO = require('socket.io');
let io;

const initSockets = (server) => {
  io = socketIO(server);
  io.on('connection', (socket) => {
    console.log('Client connected');

    function handleEvent(type, data) {
      socket.emit(type, data);
    }

    // Only monitoring INBOX folder
    socket.on('monitor', (data) => {
      console.log('socket monitor recieved');

      const { userId, email, accessToken, provider } = data;
      const imap = new ImapService(provider, email, accessToken, userId, 'inbox');
      imap.monitor(handleEvent);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnect');
    });
  });

};


module.exports = { initSockets, io };
