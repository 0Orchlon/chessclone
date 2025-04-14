const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { Chess } = require("chess.js");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // allow frontend access
    methods: ["GET", "POST"],
  },
});

const matches = {};

io.on("connection", (socket) => {
  console.log(`New client connected: ${socket.id}`);

  // Create match
  socket.on("createMatch", () => {
    const matchId = Math.random().toString(36).substr(2, 6);
    const game = new Chess();

    matches[matchId] = {
      players: [socket.id],
      game,
    };

    socket.join(matchId);
    socket.emit("matchCreated", matchId);
    console.log(`Match created: ${matchId}`);
  });

  // Join match
  socket.on("joinMatch", (matchId) => {
    const match = matches[matchId];

    if (!match) {
      socket.emit("error", "Match not found");
      return;
    }

    if (match.players.length >= 2) {
      socket.emit("error", "Match is full");
      return;
    }

    match.players.push(socket.id);
    socket.join(matchId);

    // Inform joining player
    socket.emit("matchJoined", matchId);

    // Inform host (optional)
    const hostId = match.players[0];
    io.to(hostId).emit("opponentJoined");

    // Send initial state to both
    sendGameState(matchId);
    console.log(`Player joined match: ${matchId}`);
  });

  // Make a move
  socket.on("makeMove", ({ matchId, from, to, promotion }) => {
    const match = matches[matchId];
    if (!match) return;

    const game = match.game;
    const move = game.move({ from, to, promotion });

    if (move) {
      sendGameState(matchId);
    } else {
      socket.emit("error", "Invalid move");
    }
  });

  socket.on("getMatches", () => {
    const availableMatches = Object.keys(matches).filter(
      (id) => matches[id].players.length < 2
    );
    socket.emit("matchList", availableMatches);
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
    // Remove player from matches
    for (const matchId in matches) {
      const match = matches[matchId];
      const index = match.players.indexOf(socket.id);
      if (index !== -1) {
        match.players.splice(index, 1);
        // Optionally delete match if empty
        if (match.players.length === 0) {
          delete matches[matchId];
          console.log(`Match deleted: ${matchId}`);
        }
      }
    }
  });
});

function sendGameState(matchId) {
  const match = matches[matchId];
  if (!match) return;

  const fen = match.game.fen();
  const board = match.game.board();
  const currentPlayer = match.game.turn();
  const isGameOver = match.game.isGameOver();

  io.to(matchId).emit("gameState", {
    fen,
    board,
    currentPlayer,
    isGameOver,
  });
}

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
