// Add this to your existing server.js (after Express setup, before app.listen)

const { Server } = require('socket.io');
const http = require('http');

// Create HTTP server from Express app
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? ['https://www.luckytaj.com', 'https://luckytaj.space']
      : ['http://localhost:5173'], // Vite dev server
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  // Join a game session room
  socket.on('join-session', (sessionId) => {
    socket.join(`session:${sessionId}`);
    console.log(`🎮 Socket ${socket.id} joined session: ${sessionId}`);

    // Notify others in the room
    socket.to(`session:${sessionId}`).emit('player-joined', {
      socketId: socket.id,
      timestamp: new Date()
    });
  });

  // Handle game play event
  socket.on('play-angpau', async (data) => {
    const { sessionId, cardIndex } = data;
    console.log(`🎲 Play event: session=${sessionId}, card=${cardIndex}`);

    try {
      // Load session config from database
      const GameSession = require('./models/GameSession');
      const session = await GameSession.findBySessionId(sessionId);

      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      // Calculate prize based on probability
      const prize = selectPrizeByWeight(session.prizeTiers);

      // Emit result to the player
      socket.emit('prize-result', {
        sessionId,
        cardIndex,
        prize,
        otherPrizes: session.otherPrizeAmounts
      });

      // Broadcast to session room (for live dashboard)
      io.to(`session:${sessionId}`).emit('game-played', {
        socketId: socket.id,
        cardIndex,
        prize,
        timestamp: new Date()
      });

      // Increment play count
      await session.incrementPlayCount();

    } catch (error) {
      console.error('Error handling play-angpau:', error);
      socket.emit('error', { message: 'Game error' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Helper function for weighted random selection
function selectPrizeByWeight(tiers) {
  const totalWeight = tiers.reduce((sum, tier) => sum + tier.weight, 0);
  let random = Math.random() * totalWeight;

  for (const tier of tiers) {
    random -= tier.weight;
    if (random <= 0) {
      return tier.amount;
    }
  }
  return tiers[0].amount;
}

// Replace app.listen with server.listen
const PORT = process.env.PORT || 3003;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 Socket.IO ready for connections`);
  console.log(`📡 Admin panel: http://localhost:${PORT}/admin`);
  console.log(`🎮 API: http://localhost:${PORT}/api/`);
}).on('error', (err) => {
  console.error('❌ Server failed to start:', err);
  process.exit(1);
});

// Export io for use in routes if needed
module.exports = { app, io, server };
