// client/src/socket.js
import { io } from 'socket.io-client'
import { ref, onUnmounted } from 'vue'

// Socket instance (singleton)
let socket = null

/**
 * Initialize Socket.IO connection
 * Auto-reconnects when backend restarts (nodemon)
 */
export function initSocket() {
  if (socket) return socket

  socket = io('http://localhost:3003', {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity
  })

  // Connection events
  socket.on('connect', () => {
    console.log('✅ Connected to Socket.IO server:', socket.id)
  })

  socket.on('disconnect', (reason) => {
    console.log('❌ Disconnected:', reason)
  })

  socket.on('reconnect', (attemptNumber) => {
    console.log(`🔄 Reconnected after ${attemptNumber} attempts`)
  })

  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log(`⏳ Reconnecting... attempt ${attemptNumber}`)
  })

  socket.on('error', (error) => {
    console.error('Socket error:', error)
  })

  return socket
}

/**
 * Vue composable for using Socket.IO in components
 */
export function useSocket() {
  const connected = ref(false)
  const sessionId = ref(null)
  const prizeResult = ref(null)
  const gamePlays = ref([])

  // Initialize socket
  const socketInstance = initSocket()

  // Update connection status
  socketInstance.on('connect', () => {
    connected.value = true
  })

  socketInstance.on('disconnect', () => {
    connected.value = false
  })

  // Join a game session
  const joinSession = (id) => {
    sessionId.value = id
    socketInstance.emit('join-session', id)
    console.log(`Joined session: ${id}`)
  }

  // Play the game
  const playAngpau = (cardIndex) => {
    if (!sessionId.value) {
      console.error('No session joined')
      return
    }

    socketInstance.emit('play-angpau', {
      sessionId: sessionId.value,
      cardIndex
    })
  }

  // Listen for prize result
  socketInstance.on('prize-result', (data) => {
    console.log('Prize result:', data)
    prizeResult.value = data
  })

  // Listen for other players' games (dashboard)
  socketInstance.on('game-played', (data) => {
    console.log('Game played by another user:', data)
    gamePlays.value.unshift(data)
  })

  // Cleanup on component unmount
  onUnmounted(() => {
    if (sessionId.value) {
      socketInstance.off('prize-result')
      socketInstance.off('game-played')
    }
  })

  return {
    socket: socketInstance,
    connected,
    sessionId,
    prizeResult,
    gamePlays,
    joinSession,
    playAngpau
  }
}
