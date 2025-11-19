// ===== PRIZE CONFIGURATION =====
// These will be dynamically loaded from backend
let userPrizeAmount = '₹80';
let otherPrizeAmounts = [
    '₹1000',
    '₹3000',
    '₹800',
    '₹5000',
    '₹2000',
    '₹1500',
    '₹4000',
    '₹2500',
    '₹3500'
];
let prizeTiers = [
    { amount: '₹8', weight: 70 },
    { amount: '₹50', weight: 20 },
    { amount: '₹100', weight: 8 },
    { amount: '₹300', weight: 2 }
];
// =======================================

let gameActive = false; // Start inactive until shuffle completes
let selectedIndex = null;
let gamePhase = 'initial'; // 'initial', 'shuffling', 'ready', 'playing'

// Function to load configuration from backend
async function loadGameConfiguration() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session');
        
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
            if (config.prizeTiers) {
                prizeTiers = config.prizeTiers;
            }
            if (config.otherPrizeAmounts) {
                otherPrizeAmounts = config.otherPrizeAmounts;
            }
            console.log('Configuration loaded:', config);
        } else {
            console.error('Failed to load configuration, using defaults');
        }
    } catch (error) {
        console.error('Error loading configuration:', error);
        console.log('Using default configuration');
    }
}

// Function to select user prize based on weighted probability
function selectUserPrize() {
    const totalWeight = prizeTiers.reduce((sum, tier) => sum + tier.weight, 0);
    const randomValue = Math.random() * totalWeight;
    
    let currentWeight = 0;
    for (const tier of prizeTiers) {
        currentWeight += tier.weight;
        if (randomValue <= currentWeight) {
            return tier.amount;
        }
    }
    
    // Fallback to first tier if something goes wrong
    return prizeTiers[0].amount;
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
    const prize = otherPrizeAmounts[Math.floor(Math.random() * otherPrizeAmounts.length)];
    
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
    // Mix one random prize tier amount with other amounts for display
    const randomTierPrize = prizeTiers[Math.floor(Math.random() * prizeTiers.length)].amount;
    const shuffledPrizes = [...otherPrizeAmounts, randomTierPrize].sort(() => Math.random() - 0.5);
    
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

// Handle angpau click
function handleAngpauClick(clickedAngpau, index) {
    if (!gameActive) return;

    // Stop hand pointer animation
    stopHandPointerAnimation();

    // Mark game as inactive to prevent multiple clicks
    gameActive = false;
    selectedIndex = index;

    // Add selected class to the clicked angpau
    clickedAngpau.classList.add('selected');

    // User gets prize based on weighted probability
    const prizeAmount = selectUserPrize();

    // Set the selected angpau's prize to the calculated amount
    const selectedPrizeElement = clickedAngpau.querySelector('.prize-amount');
    selectedPrizeElement.textContent = prizeAmount;

    // FIRST: Flip the selected angpau to show user's prize
    setTimeout(() => {
        clickedAngpau.classList.add('flipped');
    }, 500);

    // THEN: Flip all OTHER angpau cards with staggered timing to show higher amounts
    const allAngpaus = document.querySelectorAll('.angpau');
    let otherIndex = 0;
    let maxDelay = 0;

    allAngpaus.forEach((angpau, i) => {
        if (angpau !== clickedAngpau) {
            // Assign higher prize amounts to non-selected angpaus
            const prizeElement = angpau.querySelector('.prize-amount');
            prizeElement.textContent = otherPrizeAmounts[otherIndex];
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
    // First load configuration from backend
    await loadGameConfiguration();
    
    initGame();
    startWinnerGeneration();
    
    // Start the initial sequence
    setTimeout(() => {
        showInitialRewards();
        setTimeout(() => {
            startShuffleAnimation();
        }, 2000);
    }, 1000);
});