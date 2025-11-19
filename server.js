const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import database adapter for SQLite support
const dbAdapter = require('./database-adapter');

const authRoutes = require('./routes/auth');
const bannerRoutes = require('./routes/banners');
const commentRoutes = require('./routes/comments');
const videoRoutes = require('./routes/video');
const gamesRoutes = require('./routes/games');
const winnersRoutes = require('./routes/winners');
const jackpotRoutes = require('./routes/jackpot');
const metricsRoutes = require('./routes/metrics');
const otpRoutes = require('./routes/otp');
const angpauRoutes = require('./routes/angpau');
const { startDailyRefreshScheduler } = require('./services/dailyRefresh');

const app = express();

// Trust proxy for deployment platforms (Render, Heroku, etc.)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? [
        'https://www.luckytaj.com',
        'https://luckytaj.space',
        'https://luckytaj-backend.onrender.com',
        'https://admin-panel-luckytaj.onrender.com'
    ] : true,
    credentials: true
}));

// Rate limiting - More lenient for auth endpoints
const authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 50, // increased to 50 login attempts per 5 minutes for admin panel
    message: { error: 'Too many login attempts, please try again in 5 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

// General API rate limiting - more lenient
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // increased from 100 to 500 requests per windowMs
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply specific rate limiting to auth endpoints
app.use('/api/auth/login', authLimiter);
app.use('/api/', apiLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve game images
app.use('/images', express.static(path.join(__dirname, 'images')));

// Serve favicon files
app.use('/luckytaj-favicon', express.static(path.join(__dirname, 'luckytaj-favicon')));
app.use('/favicon', express.static(path.join(__dirname, 'favicon')));

// Serve admin panel static files (CSS, JS, etc.)
app.use('/admin/assets', express.static(path.join(__dirname, 'admin-panel')));

// Serve test files
app.use('/tests', express.static(path.join(__dirname, 'tests')));

// Serve documentation
app.use('/docs', express.static(path.join(__dirname, 'docs')));

// Serve main frontend files
app.use(express.static(__dirname, { 
    ignore: ['node_modules', 'admin-panel', 'uploads', 'models', 'routes', 'middleware', 'scripts', 'tests', 'docs', 'temp']
}));

// Database connection
const DB_TYPE = process.env.DB_TYPE || 'sqlite';

async function initializeDatabase() {
    try {
        if (DB_TYPE === 'sqlite') {
            await dbAdapter.connect();
            console.log('✅ Database initialized successfully (SQLite)');
            // Start the daily games refresh scheduler
            startDailyRefreshScheduler();
        } else {
            const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/luckytaj-admin';
            await mongoose.connect(MONGO_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                connectTimeoutMS: 10000,
                serverSelectionTimeoutMS: 5000,
            });
            console.log('✅ Connected to MongoDB');
            console.log('Database:', MONGO_URI.includes('mongodb.net') ? 'MongoDB Atlas (Cloud)' : 'Local MongoDB');
            // Start the daily games refresh scheduler
            startDailyRefreshScheduler();
        }
    } catch (err) {
        console.error('❌ Database connection error:', err.message);
        console.log('⚠️  Server will continue without database connection');
        console.log('💡 Make sure database configuration is correct');
    }
}

// Initialize database
initializeDatabase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/videos', videoRoutes); // Add direct /api/videos route for easy access
app.use('/api/games', gamesRoutes);
app.use('/api/winners', winnersRoutes);
app.use('/api/jackpot', jackpotRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/angpau', angpauRoutes);

// Serve admin panel
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-panel', 'index.html'));
});

// Serve static files for angpau game first
app.use('/angpau', express.static(path.join(__dirname, 'random-angpau'), {
    index: false  // Disable automatic index.html serving
}));

// Then serve the main angpau page
app.get('/angpau', (req, res) => {
    res.sendFile(path.join(__dirname, 'random-angpau', 'index.html'));
});

// Serve old angpau design (for comparison/backup)
app.use('/angpau-classic', express.static(path.join(__dirname, 'admin-panel', 'angpau')));
app.get('/angpau-classic', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-panel', 'angpau', 'index.html'));
});


// Backend API root endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'Lucky Taj Admin Backend API',
        status: 'running',
        endpoints: {
            admin: '/admin',
            api: '/api/',
            health: '/health'
        }
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV,
        jwtConfigured: !!process.env.JWT_SECRET,
        dbConfigured: !!process.env.MONGODB_URI
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message 
    });
});

// Socket.IO Setup
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

const PORT = process.env.PORT || 3003;

server.listen(PORT, () => {
    console.log(`🚀 Admin backend server running on port ${PORT}`);
    console.log(`🔌 Socket.IO ready for connections`);
    console.log(`📡 Admin panel available at: http://localhost:${PORT}/admin`);
    console.log(`🎮 API endpoints available at: http://localhost:${PORT}/api/`);
}).on('error', (err) => {
    console.error('❌ Server failed to start:', err);
    process.exit(1);
});


