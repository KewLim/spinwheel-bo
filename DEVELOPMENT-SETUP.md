# 🚀 Lucky Taj Development Setup Guide

Full-stack development environment with **Socket.IO**, **Vite HMR**, and **Nodemon auto-restart**.

## 📁 Project Structure

```
luckytaj-backend-main/
├── server/                    # Backend (Node.js + Express + Socket.IO)
│   ├── routes/angpau.js
│   ├── models/GameSession.js
│   └── server.js             # Main server file with Socket.IO
│
├── client/                    # Frontend (Vue 3 + Vite + Socket.IO Client)
│   ├── src/
│   │   ├── components/
│   │   │   └── AngpauGame.vue
│   │   ├── App.vue
│   │   ├── main.js
│   │   └── socket.js         # Socket.IO client composable
│   ├── index.html
│   ├── vite.config.js        # Proxy + HMR config
│   └── package.json
│
├── package.json              # Root package (concurrently scripts)
├── nodemon.json              # Nodemon configuration
└── README.md
```

---

## 🛠️ Installation Steps

### 1. Setup Root Package

```bash
cd C:\Users\BDC Computer ll\Downloads\luckytaj-backend-main

# Copy the setup files
copy package-setup.json package.json

# Install root dependencies
npm install
```

This installs:
- `concurrently` - Run multiple npm scripts simultaneously
- `nodemon` - Auto-restart server on file changes
- `socket.io` - WebSocket server

### 2. Setup Client (Vite + Vue 3)

```bash
# Create client directory
mkdir client
cd client

# Copy client package.json
copy ..\client-package.json package.json

# Install client dependencies
npm install

# Create folder structure
mkdir src
mkdir src\components
mkdir public

# Copy configuration and source files
copy ..\client-vite.config.js vite.config.js
copy ..\client-index.html index.html
copy ..\client-main.js src\main.js
copy ..\client-App.vue src\App.vue
copy ..\client-socket.js src\socket.js
copy ..\client-AngpauGame.vue src\components\AngpauGame.vue
```

### 3. Update Server for Socket.IO

Open `server.js` and replace the `app.listen()` section with the code from `server-socket-example.js`:

```javascript
const { Server } = require('socket.io');
const http = require('http');

// Create HTTP server from Express app
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? ['https://www.luckytaj.com']
      : ['http://localhost:5173'],
    credentials: true
  }
});

// Socket.IO handlers (see server-socket-example.js for full code)
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  // ... event handlers
});

// Replace app.listen with server.listen
server.listen(3003, () => {
  console.log('Server running on port 3003');
});
```

---

## 🎮 Running the Development Environment

### Option 1: Run Both Servers Concurrently (Recommended)

```bash
# From root directory
npm run dev
```

This starts:
- **Backend** on `http://localhost:3003` (nodemon auto-restart)
- **Frontend** on `http://localhost:5173` (Vite HMR)

You'll see output like:
```
[0] [nodemon] watching: server routes models...
[0] 🚀 Server running on port 3003
[0] 🔌 Socket.IO ready
[1] VITE v5.0.12  ready in 450 ms
[1] ➜  Local:   http://localhost:5173/
```

### Option 2: Run Servers Separately

**Terminal 1 - Backend:**
```bash
npm run server:dev
```

**Terminal 2 - Frontend:**
```bash
npm run client:dev
```

---

## 🔄 How It Works

### Nodemon Auto-Restart
- Watches: `server/`, `routes/`, `models/`, `middleware/`
- Ignores: `client/`, `node_modules/`, `*.db`
- Delay: 1 second before restart
- On file change → Server restarts → Socket.IO clients auto-reconnect

### Vite Hot Module Replacement (HMR)
- Edit `.vue` files → Instant update (no page reload)
- Edit `.js` files → Fast refresh
- Preserves component state during updates
- CSS hot-reloading

### Socket.IO Auto-Reconnection
```javascript
// client/src/socket.js
const socket = io('http://localhost:3003', {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: Infinity
});
```

When nodemon restarts the backend:
1. Frontend detects disconnection
2. Waits 1 second
3. Attempts reconnection
4. Rejoins session room automatically

### Vite Proxy Configuration
```javascript
// client/vite.config.js
server: {
  proxy: {
    '/api': 'http://localhost:3003',
    '/socket.io': {
      target: 'http://localhost:3003',
      ws: true  // Enable WebSocket proxying
    }
  }
}
```

This allows frontend to make requests without CORS issues:
- `fetch('/api/angpau/config')` → proxied to `http://localhost:3003/api/angpau/config`
- `io()` → connects to `http://localhost:3003` via proxy

---

## 🧪 Testing the Angpau Feature

### 1. Generate a Game Link (Admin Panel)

```bash
# Open admin panel
http://localhost:3003/admin

# Login: admin@luckytaj.com / Admin@123456
# Go to Angpau tab
# Configure prize tiers
# Click "Generate Link"
# Copy the session URL
```

### 2. Test with Vue Frontend

```bash
# Open Vite dev server
http://localhost:5173/?session=YOUR_SESSION_ID

# Example:
http://localhost:5173/?session=abc123def456
```

### 3. Watch Live Events

Open browser console (F12) to see:
```
✅ Connected to Socket.IO server: xYz123
Joined session: abc123def456
Prize result: { sessionId: "abc...", prize: "₹50", ... }
```

Backend console shows:
```
✅ Client connected: xYz123
🎮 Socket xYz123 joined session: abc123def456
🎲 Play event: session=abc123def456, card=3
```

### 4. Test Auto-Reconnection

1. Edit `server.js` (add a comment)
2. Nodemon restarts backend
3. Frontend console shows:
   ```
   ❌ Disconnected: transport close
   ⏳ Reconnecting... attempt 1
   🔄 Reconnected after 1 attempts
   ```
4. Game continues working seamlessly

### 5. Test Hot Module Replacement

1. Edit `client/src/components/AngpauGame.vue`
2. Change card color: `background: #ff6b6b` → `background: #4CAF50`
3. Save file
4. Browser updates instantly **without reload**
5. Socket connection remains active

---

## 📊 Available Scripts

### Root (package.json)
```json
{
  "dev": "concurrently \"npm run server:dev\" \"npm run client:dev\"",
  "server:dev": "nodemon server/server.js",
  "client:dev": "cd client && npm run dev",
  "install:all": "npm install && cd client && npm install"
}
```

### Client (client/package.json)
```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
}
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3003
taskkill /F /PID <PID>

# Or change port in .env
PORT=3004
```

### Socket.IO Not Connecting
1. Check CORS settings in `server.js`
2. Verify Vite proxy in `client/vite.config.js`
3. Check browser console for errors

### HMR Not Working
1. Clear browser cache
2. Restart Vite: `Ctrl+C` → `npm run client:dev`
3. Check `vite.config.js` HMR settings

### Nodemon Not Restarting
1. Check `nodemon.json` watch paths
2. Ensure file changes are saved
3. Try manual restart: `rs` in nodemon terminal

---

## 📦 Dependencies Reference

### Root
- `concurrently` - Run scripts in parallel
- `nodemon` - Auto-restart on file changes
- `socket.io` - WebSocket server

### Client
- `vue` - Frontend framework
- `socket.io-client` - WebSocket client
- `vite` - Build tool with HMR
- `@vitejs/plugin-vue` - Vue 3 support for Vite

### Server (existing)
- `express` - Web framework
- `sqlite3` - Database
- `jsonwebtoken` - Authentication
- `cors` - Cross-origin resource sharing

---

## 🎯 Next Steps

1. **Add More Socket Events**
   - `session-stats` - Real-time statistics
   - `admin-message` - Broadcast from admin panel
   - `player-count` - Show active players

2. **Enhance Dashboard**
   - Create admin dashboard at `/dashboard`
   - Show live game activity
   - Real-time charts with Chart.js

3. **Add Persistence**
   - Store game results in database
   - Track user sessions
   - Analytics and reporting

4. **Production Build**
   ```bash
   # Build client
   cd client && npm run build

   # Serve from Express
   app.use(express.static('client/dist'))
   ```

---

## 📝 Example Socket.IO Events

### Client → Server
```javascript
socket.emit('join-session', sessionId);
socket.emit('play-angpau', { sessionId, cardIndex });
```

### Server → Client
```javascript
socket.emit('prize-result', { prize, otherPrizes });
socket.to(`session:${id}`).emit('game-played', { ... });
```

### Rooms
- `session:abc123` - All players in a game session
- Broadcasting to rooms enables live dashboards

---

## ✅ Verification Checklist

- [ ] Root dependencies installed (`npm install`)
- [ ] Client dependencies installed (`cd client && npm install`)
- [ ] `nodemon.json` configured
- [ ] `client/vite.config.js` created
- [ ] Server updated with Socket.IO
- [ ] Can run `npm run dev` successfully
- [ ] Backend on port 3003
- [ ] Frontend on port 5173
- [ ] Socket.IO connects successfully
- [ ] Game link generation works
- [ ] HMR updates Vue components instantly
- [ ] Nodemon restarts on server changes
- [ ] Socket auto-reconnects after restart

---

## 🎉 Success!

You now have a fully working development environment with:
- ✅ Socket.IO real-time communication
- ✅ Vite HMR for instant frontend updates
- ✅ Nodemon auto-restart for backend changes
- ✅ Concurrent dev servers
- ✅ Auto-reconnection on server restart
- ✅ Proxy for seamless API/WebSocket requests

Happy coding! 🚀
