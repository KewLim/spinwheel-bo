// ===== PRIZE CONFIGURATION =====
// These will be dynamically loaded from backend
let cardConfigs = [
    { amount: '₹8', probability: 0 },
    { amount: '₹50', probability: 0 },
    { amount: '₹100', probability: 0 },
    { amount: '₹300', probability: 0 },
    { amount: '₹1000', probability: 0 },
    { amount: '₹3000', probability: 0 },
    { amount: '₹800', probability: 0 },
    { amount: '₹5000', probability: 0 },
    { amount: '₹2000', probability: 0 },
    { amount: '₹1500', probability: 0 }
];
// =======================================

let gameActive = false; // Start inactive until shuffle completes
let selectedIndex = null;
let gamePhase = 'initial'; // 'initial', 'shuffling', 'ready', 'playing'
let currentSessionId = null;
let hasPlayed = false;

// Function to check if session/game has been played
function checkPlayedStatus() {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session');
    
    if (sessionId) {
        // Check localStorage for this specific session
        const playedKey = `angpau_played_${sessionId}`;
        if (localStorage.getItem(playedKey)) {
            showAlreadyPlayedModal();
            return true;
        }
    } else {
        // Check localStorage for general game state
        if (localStorage.getItem('angpau_played_general')) {
            showAlreadyPlayedModal();
            return true;
        }
    }
    
    return false;
}

// Function to mark session/game as played
function markAsPlayed(sessionId = null) {
    if (sessionId) {
        localStorage.setItem(`angpau_played_${sessionId}`, 'true');
        localStorage.setItem(`angpau_played_${sessionId}_timestamp`, new Date().toISOString());
    } else {
        localStorage.setItem('angpau_played_general', 'true');
        localStorage.setItem('angpau_played_general_timestamp', new Date().toISOString());
    }
    hasPlayed = true;
}

// Function to load configuration from backend
async function loadGameConfiguration() {
    try {
        // First check if game has been played locally
        if (checkPlayedStatus()) {
            return; // Stop execution if already played
        }
        
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session');
        currentSessionId = sessionId;
        
        let response;
        if (sessionId) {
            // Load specific session configuration
            response = await fetch(`/api/angpau/session/${sessionId}`);
        } else {
            // Load default configuration
            response = await fetch('/api/angpau/config');
        }
        
        if (response.ok) {
            const config = await response.json();
            if (config.cardConfigs) {
                cardConfigs = config.cardConfigs;
            }
            console.log('Configuration loaded:', config);
        } else if (response.status === 403) {
            // Handle already played scenario
            const errorData = await response.json();
            if (errorData.alreadyPlayed) {
                markAsPlayed(sessionId); // Store locally too
                showAlreadyPlayedModal();
                throw new Error('Session already played'); // Stop further initialization
            }
        } else {
            console.error('Failed to load configuration, using defaults');
        }
    } catch (error) {
        console.error('Error loading configuration:', error);
        
        // Check if it's a fetch error with 403 status
        if (error.response && error.response.status === 403) {
            showAlreadyPlayedModal();
            return;
        }
        
        console.log('Using default configuration');
    }
}

// Function to select user prize based on weighted probability
function selectUserPrize() {
    const totalProbability = cardConfigs.reduce((sum, card) => sum + card.probability, 0);
    
    // If all probabilities are 0, select randomly with equal probability
    if (totalProbability === 0) {
        const randomIndex = Math.floor(Math.random() * cardConfigs.length);
        return cardConfigs[randomIndex].amount;
    }
    
    const randomValue = Math.random() * totalProbability;
    
    let currentProbability = 0;
    for (const card of cardConfigs) {
        currentProbability += card.probability;
        if (randomValue <= currentProbability) {
            return card.amount;
        }
    }
    
    // Fallback to first card if something goes wrong
    return cardConfigs[0].amount;
}

// Nepalese names and phone number generation
const nepaleseNames = [
    'Prabin T*****',
    'Suman S*****', 
    'Rajesh K*****',
    'Deepak A*****',
    'Binod R*****',
    'Sunil M*****',
    'Ramesh L*****',
    'Krishna B*****',
    'Santosh G*****',
    'Dipesh T*****',
    'Nabin P*****',
    'Bishal S*****',
    'Roshan K*****',
    'Saroj A*****',
    'Manoj R*****'
];

// Function to generate random Nepalese phone number
function generateNepalesePhone() {
    const prefixes = ['163', '164', '165', '166', '167', '168'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomDigits = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `+977 ${randomPrefix}*****`;
}

// Function to generate random winner
function generateRandomWinner() {
    const name = nepaleseNames[Math.floor(Math.random() * nepaleseNames.length)];
    const phone = generateNepalesePhone();
    const prize = cardConfigs[Math.floor(Math.random() * cardConfigs.length)].amount;
    
    return { name, phone, prize };
}

// Function to add winner to the list
function addWinner(winner) {
    const winnersList = document.getElementById('winnersList');
    
    const winnerItem = document.createElement('div');
    winnerItem.className = 'winner-item';
    
    winnerItem.innerHTML = `
        <div class="winner-info">
            <div class="winner-name">${winner.name}</div>
            <div class="winner-phone">${winner.phone}</div>
        </div>
        <div class="winner-prize">${winner.prize}</div>
    `;
    
    // Add to top of list
    winnersList.insertBefore(winnerItem, winnersList.firstChild);
    
    // Remove oldest winner if more than 8 winners
    if (winnersList.children.length > 8) {
        winnersList.removeChild(winnersList.lastChild);
    }
}

// Initial game setup - show all rewards
function showInitialRewards() {
    const angpaus = document.querySelectorAll('.angpau');
    
    // Get all card amounts and shuffle them for display
    const allCardAmounts = cardConfigs.map(card => card.amount);
    const shuffledPrizes = [...allCardAmounts].sort(() => Math.random() - 0.5);
    
    angpaus.forEach((angpau, index) => {
        const prizeElement = angpau.querySelector('.prize-amount');
        prizeElement.textContent = shuffledPrizes[index];
        angpau.classList.add('flipped'); // Show back side initially
    });
}

// Shuffle animation function
function startShuffleAnimation() {
    gamePhase = 'shuffling';
    const angpaus = document.querySelectorAll('.angpau');
    const grid = document.querySelector('.angpau-grid');
    const gridRect = grid.getBoundingClientRect();
    const centerX = gridRect.width / 2;
    const centerY = gridRect.height / 2;
    
    grid.classList.add('shuffling');
    
    // First flip all cards to front
    setTimeout(() => {
        angpaus.forEach(angpau => {
            angpau.classList.remove('flipped');
        });
    }, 500);
    
    // Then animate to center
    setTimeout(() => {
        angpaus.forEach((angpau, index) => {
            const rect = angpau.getBoundingClientRect();
            const gridRect = angpau.parentElement.getBoundingClientRect();
            const currentX = rect.left - gridRect.left + rect.width / 2;
            const currentY = rect.top - gridRect.top + rect.height / 2;
            
            const deltaX = centerX - currentX;
            const deltaY = centerY - currentY;
            
            angpau.style.setProperty('--shuffle-x', `${deltaX}px`);
            angpau.style.setProperty('--shuffle-y', `${deltaY}px`);
            
            angpau.classList.add('shuffling', 'shuffle-center');
        });
    }, 200);
    
    // Then animate back to positions
    setTimeout(() => {
        angpaus.forEach(angpau => {
            angpau.classList.remove('shuffle-center');
            angpau.classList.add('shuffle-return');
        });
    }, 1500);
    
    // Complete shuffle animation
    setTimeout(() => {
        angpaus.forEach(angpau => {
            angpau.classList.remove('shuffling', 'shuffle-return');
            angpau.style.removeProperty('--shuffle-x');
            angpau.style.removeProperty('--shuffle-y');
        });
        grid.classList.remove('shuffling');
        
        // Game is now ready
        gamePhase = 'ready';
        gameActive = true;
        
        // Show refresh button and start pointer animation
        document.querySelector('.refresh-btn').classList.add('show');
        startHandPointerAnimation();
    }, 3500);
}

// Function to start winner generation
function startWinnerGeneration() {
    // Add initial winners
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            addWinner(generateRandomWinner());
        }, i * 500);
    }
    
    // Continue adding winners every 3-7 seconds
    setInterval(() => {
        addWinner(generateRandomWinner());
    }, Math.random() * 4000 + 3000); // 3-7 seconds
}

// Hand pointer animation functions
let currentActivePointer = null;
let pointerInterval = null;

function showRandomHandPointer() {
    // Hide current pointer if exists
    if (currentActivePointer) {
        currentActivePointer.classList.remove('show');
    }
    
    // Only show pointer on non-flipped angpaus
    const availableAngpaus = document.querySelectorAll('.angpau:not(.flipped)');
    if (availableAngpaus.length === 0) return;
    
    // Select random angpau
    const randomIndex = Math.floor(Math.random() * availableAngpaus.length);
    const selectedAngpau = availableAngpaus[randomIndex];
    const handPointer = selectedAngpau.querySelector('.hand-pointer');
    
    if (handPointer) {
        handPointer.classList.add('show');
        currentActivePointer = handPointer;
    }
}

function startHandPointerAnimation() {
    // Show initial pointer after 1 second
    setTimeout(() => {
        showRandomHandPointer();
    }, 1500);
    
    // Switch to different angpau every 3 seconds
    pointerInterval = setInterval(() => {
        showRandomHandPointer();
    }, 6000);
}

function stopHandPointerAnimation() {
    if (currentActivePointer) {
        currentActivePointer.classList.remove('show');
        currentActivePointer = null;
    }
    if (pointerInterval) {
        clearInterval(pointerInterval);
        pointerInterval = null;
    }
}

// Initialize the game
function initGame() {
    const angpaus = document.querySelectorAll('.angpau');

    angpaus.forEach((angpau, index) => {
        // Add click event listener
        angpau.addEventListener('click', () => handleAngpauClick(angpau, index));
        
        // Add hand pointer element
        const handPointer = document.createElement('div');
        handPointer.className = 'hand-pointer';
        angpau.appendChild(handPointer);
    });
}

// Function to submit game result to backend
async function submitGameResult(prizeAmount) {
    if (!currentSessionId) {
        // No session ID, just mark locally for general games
        markAsPlayed();
        return;
    }
    
    try {
        const response = await fetch(`/api/angpau/session/${currentSessionId}/play`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prizeAmount: prizeAmount
            })
        });
        
        if (response.ok) {
            // Mark as played locally
            markAsPlayed(currentSessionId);
            console.log('Game result submitted successfully');
        } else if (response.status === 403) {
            // Already played on server
            const errorData = await response.json();
            markAsPlayed(currentSessionId);
            showAlreadyPlayedModal();
        } else {
            console.error('Failed to submit game result:', response.status);
            // Still mark as played locally to prevent replaying
            markAsPlayed(currentSessionId);
        }
    } catch (error) {
        console.error('Error submitting game result:', error);
        // Still mark as played locally to prevent replaying
        markAsPlayed(currentSessionId);
    }
}

// Handle angpau click
function handleAngpauClick(clickedAngpau, index) {
    if (!gameActive || hasPlayed) return;

    // Stop hand pointer animation
    stopHandPointerAnimation();

    // Mark game as inactive to prevent multiple clicks
    gameActive = false;
    selectedIndex = index;

    // Add selected class to the clicked angpau
    clickedAngpau.classList.add('selected');

    // User gets prize based on weighted probability
    const prizeAmount = selectUserPrize();

    // Submit game result to backend immediately
    submitGameResult(prizeAmount);

    // Set the selected angpau's prize to the calculated amount
    const selectedPrizeElement = clickedAngpau.querySelector('.prize-amount');
    selectedPrizeElement.textContent = prizeAmount;

    // FIRST: Flip the selected angpau to show user's prize
    setTimeout(() => {
        clickedAngpau.classList.add('flipped');
    }, 500);

    // THEN: Flip all OTHER angpau cards with staggered timing to show different amounts
    const allAngpaus = document.querySelectorAll('.angpau');
    let otherIndex = 0;
    let maxDelay = 0;

    // Get all card amounts except the selected one for display
    const displayAmounts = cardConfigs.map(card => card.amount).filter(amount => amount !== prizeAmount);

    allAngpaus.forEach((angpau, i) => {
        if (angpau !== clickedAngpau) {
            // Assign different prize amounts to non-selected angpaus
            const prizeElement = angpau.querySelector('.prize-amount');
            prizeElement.textContent = displayAmounts[otherIndex % displayAmounts.length];
            otherIndex++;

            const delay = 1200 + (otherIndex * 200);
            maxDelay = Math.max(maxDelay, delay);

            setTimeout(() => {
                angpau.classList.add('flipped');
                angpau.classList.add('disabled');
            }, delay);
        }
    });

    // FINALLY: Show the modal after everything has flipped
    setTimeout(() => {
        showModal(prizeAmount);
    }, maxDelay + 800);
}

// Show modal with prize
function showModal(amount) {
    const modal = document.getElementById('prizeModal');
    const prizeAmountElement = document.getElementById('prizeAmount');

    prizeAmountElement.textContent = amount;
    modal.classList.add('show');
}

// Hide modal
function hideModal() {
    const modal = document.getElementById('prizeModal');
    modal.classList.remove('show');
}

// Reset the game
function resetGame() {
    // Check if game has been played - if so, show modal instead
    if (hasPlayed || checkPlayedStatus()) {
        showAlreadyPlayedModal();
        return;
    }
    
    // Hide modal
    hideModal();
    
    // Stop hand pointer animation
    stopHandPointerAnimation();
    
    // Hide refresh button
    document.querySelector('.refresh-btn').classList.remove('show');

    // Reset all angpau cards
    const allAngpaus = document.querySelectorAll('.angpau');
    allAngpaus.forEach(angpau => {
        angpau.classList.remove('flipped', 'selected', 'disabled');
    });

    // Reset game state
    gameActive = false;
    gamePhase = 'initial';
    selectedIndex = null;
    
    // Start the sequence again
    setTimeout(() => {
        showInitialRewards();
        setTimeout(() => {
            startShuffleAnimation();
        }, 2000);
    }, 500);
}

// Close modal when clicking outside of it
window.addEventListener('click', (event) => {
    const modal = document.getElementById('prizeModal');
    if (event.target === modal) {
        hideModal();
    }
});

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    // First check if game has been played
    if (checkPlayedStatus()) {
        // Game already played, don't initialize
        return;
    }
    
    // First load configuration from backend
    try {
        await loadGameConfiguration();
        
        // Only initialize game if configuration loaded successfully and not already played
        if (!hasPlayed) {
            initGame();
            startWinnerGeneration();
            
            // Add event listeners for buttons
            const refreshBtn = document.getElementById('refreshBtn');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', resetGame);
            }
            
            const contactBtn = document.getElementById('contactBtn');
            if (contactBtn) {
                contactBtn.addEventListener('click', () => {
                    window.open('https://nepalwin.com', '_blank');
                });
            }
            
            // Start the initial sequence
            setTimeout(() => {
                showInitialRewards();
                setTimeout(() => {
                    startShuffleAnimation();
                }, 2000);
            }, 1000);
        }
        
    } catch (error) {
        console.error('Failed to initialize game:', error);
        // If there's an error and we can't load config, don't start the game
    }
});

// ==================== Already Played Modal Functions ====================

function showAlreadyPlayedModal() {
    const modal = document.getElementById('alreadyPlayedModal');
    if (modal) {
        modal.classList.add('show');
        
        // Hide the main game content
        const container = document.querySelector('.container');
        if (container) {
            container.style.filter = 'blur(5px)';
            container.style.pointerEvents = 'none';
        }
        
        // Disable any ongoing animations or interactions
        gameActive = false;
        stopHandPointerAnimation();
    }
}

function openLivechat() {
    // Open live chat or WhatsApp - replace with your actual contact method
    window.open('https://nepalwin.com/livechat', '_blank');
}

function openWebsite() {
    // Open main website
    window.open('https://nepalwin.com', '_blank');
}
