const express = require('express');
const http = require('http');
const {Server} = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const rooms = new Map();
const games = new Map();

// HTTP endpoint for getting room list
app.get('/rooms', (req, res) => {
  res.json(Array.from(rooms.keys()));
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('create-room', (roomId) => {
    console.log('Creating room:', roomId);
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {id: roomId, players: []});
      socket.join(roomId);
      io.emit('room-list', Array.from(rooms.keys()));
    }
  });

  socket.on('join-room', ({roomId, player}) => {
    console.log(`Player ${player.name} joining room ${roomId}`);
    if (rooms.has(roomId)) {
      socket.join(roomId);
      const room = rooms.get(roomId);
      if (!room.players.find(p => p.id === player.id)) {
        room.players.push(player);
      }
      io.to(roomId).emit('room-players', room.players);

      // If a game already exists for this room, add the player to the game as well
      if (games.has(roomId)) {
        const game = games.get(roomId);
        if (!game.spieler.find(s => s.name === player.name)) {
          // Create a new Spieler object for the game
          const newSpieler = {
            name: player.name,
            points: 0,
            cards: [],
            selectedCards: [],
            catLord: false,
            ready: false
          };

          // Deal initial cards if the game has an answerset
          if (game.answerset && game.answerset.length >= 10) {
            newSpieler.cards = game.answerset.splice(0, 10);
          }

          game.spieler.push(newSpieler);
          io.to(roomId).emit('game', game);
          // Also update the map with the new player
          games.set(roomId, game);
        } else {
          // Player already in game, but send the game state anyway to sync
          socket.emit('game', games.get(roomId));
        }
      }
    }
  });

  socket.on('setGame', (roomId, game) => {
    console.log('Setting game for room:', roomId);
    games.set(roomId, game);
    io.to(roomId).emit('game', game);
  });

  socket.on('updateGame', (game) => {
    if (game && game.gameHash) {
      console.log('Updating game for room:', game.gameHash);
      games.set(game.gameHash, game);
      io.to(game.gameHash).emit('game', game);
    }
  });

  socket.on('getGame', (roomId) => {
    console.log('Getting game for room:', roomId);
    const game = games.get(roomId);
    if (game) {
      socket.emit('game', game);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
