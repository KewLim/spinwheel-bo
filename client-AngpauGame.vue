<template>
  <div class="angpau-game">
    <div class="header">
      <h1>🧧 Lucky Taj Angpau Game</h1>
      <div class="connection-status" :class="{ connected }">
        {{ connected ? '🟢 Connected' : '🔴 Disconnected' }}
      </div>
    </div>

    <!-- Session Info -->
    <div v-if="sessionId" class="session-info">
      <p>📌 Session ID: <code>{{ sessionId }}</code></p>
      <p>🎲 Total Plays: {{ gamePlays.length }}</p>
    </div>

    <!-- Angpau Cards -->
    <div v-if="!prizeResult" class="angpau-container">
      <div
        v-for="(card, index) in 10"
        :key="index"
        class="angpau-card"
        @click="handleCardClick(index)"
        :class="{ flipped: selectedCard === index }"
      >
        <div class="card-front">
          <span class="angpau-icon">🧧</span>
          <p>{{ index + 1 }}</p>
        </div>
        <div class="card-back">
          <span class="prize">?</span>
        </div>
      </div>
    </div>

    <!-- Prize Result -->
    <div v-if="prizeResult" class="prize-modal">
      <div class="modal-content">
        <h2>🎉 Congratulations!</h2>
        <div class="prize-amount">{{ prizeResult.prize }}</div>
        <p>You selected card {{ prizeResult.cardIndex + 1 }}</p>

        <div class="other-prizes">
          <h3>Other cards had:</h3>
          <div class="prize-grid">
            <span v-for="(prize, i) in prizeResult.otherPrizes" :key="i" class="other-prize">
              {{ prize }}
            </span>
          </div>
        </div>

        <button @click="resetGame" class="btn-play-again">Play Again</button>
      </div>
    </div>

    <!-- Live Dashboard -->
    <div v-if="gamePlays.length > 0" class="live-dashboard">
      <h3>📊 Live Game Activity</h3>
      <div class="play-log">
        <div v-for="(play, i) in gamePlays.slice(0, 10)" :key="i" class="play-item">
          <span class="timestamp">{{ formatTime(play.timestamp) }}</span>
          <span class="card-num">Card {{ play.cardIndex + 1 }}</span>
          <span class="prize-won">{{ play.prize }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useSocket } from './socket.js'

const props = defineProps({
  initialSessionId: {
    type: String,
    default: null
  }
})

const { connected, sessionId, prizeResult, gamePlays, joinSession, playAngpau } = useSocket()
const selectedCard = ref(null)

onMounted(() => {
  // Get session ID from URL or props
  const urlParams = new URLSearchParams(window.location.search)
  const urlSessionId = urlParams.get('session') || props.initialSessionId

  if (urlSessionId) {
    joinSession(urlSessionId)
  } else {
    console.warn('No session ID provided')
  }
})

const handleCardClick = (index) => {
  if (selectedCard.value !== null) return // Already selected

  selectedCard.value = index
  playAngpau(index)
}

const resetGame = () => {
  prizeResult.value = null
  selectedCard.value = null
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString()
}
</script>

<style scoped>
.angpau-game {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.connection-status {
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: bold;
  background: #ffebee;
  color: #c62828;
}

.connection-status.connected {
  background: #e8f5e9;
  color: #2e7d32;
}

.session-info {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.angpau-container {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
  margin-bottom: 40px;
}

.angpau-card {
  aspect-ratio: 3/4;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  color: white;
  font-size: 18px;
}

.angpau-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 12px rgba(0,0,0,0.2);
}

.angpau-icon {
  font-size: 48px;
}

.prize-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 40px;
  border-radius: 16px;
  text-align: center;
  max-width: 500px;
}

.prize-amount {
  font-size: 72px;
  font-weight: bold;
  color: #ff6b6b;
  margin: 20px 0;
}

.other-prizes {
  margin-top: 30px;
}

.prize-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 15px;
}

.other-prize {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 8px;
  font-weight: bold;
}

.btn-play-again {
  margin-top: 30px;
  padding: 12px 32px;
  background: #ff6b6b;
  color: white;
  border: none;
  border-radius: 24px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-play-again:hover {
  background: #ee5a52;
}

.live-dashboard {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 12px;
  margin-top: 40px;
}

.play-log {
  margin-top: 15px;
}

.play-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background: white;
  margin-bottom: 8px;
  border-radius: 6px;
}

.timestamp {
  color: #666;
  font-size: 14px;
}

.prize-won {
  font-weight: bold;
  color: #ff6b6b;
}

@media (max-width: 768px) {
  .angpau-container {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
