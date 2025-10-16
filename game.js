// Spelling Jump Adventure Game
class SpellingJumpGame {
    constructor() {
        console.log('Initializing SpellingJumpGame...');
        
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            throw new Error('Canvas element not found');
        }
        
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            throw new Error('Cannot get canvas context');
        }
        
        // Game state
        this.score = 0;
        this.level = 1;
        this.currentWordIndex = 0;
        this.gameRunning = true;
        this.coins = 0;
        this.stars = 0;
        this.streakCount = 0;
        this.maxStreak = 0;
        this.powerUpActive = false;
        this.powerUpCounter = 0;
        
        // Character properties
        this.character = {
            x: 100,
            y: 500,
            width: 40,
            height: 40,
            jumping: false,
            jumpHeight: 0,
            targetY: 500,
            worldY: 500 // Character's position in world coordinates
        };
        
        // Camera system
        this.camera = {
            y: 0,
            targetY: 0,
            smoothing: 0.1
        };
        
        // Platform generation settings
        this.platformSpacing = 80;
        
        // Word lists by difficulty
        this.wordLists = {
            1: [
                { word: 'CAT', hint: '🐱 A furry pet that meows' },
                { word: 'DOG', hint: '🐶 A loyal pet that barks' },
                { word: 'SUN', hint: '☀️ Bright star in the sky' },
                { word: 'BEE', hint: '🐝 Insect that makes honey' },
                { word: 'EGG', hint: '🥚 What chickens lay' }
            ],
            2: [
                { word: 'BIRD', hint: '🐦 Animal that can fly' },
                { word: 'FISH', hint: '🐠 Lives in water' },
                { word: 'TREE', hint: '🌳 Tall plant with leaves' },
                { word: 'MOON', hint: '🌙 Shines at night' },
                { word: 'STAR', hint: '⭐ Twinkles in the sky' }
            ],
            3: [
                { word: 'APPLE', hint: '🍎 Red fruit that\'s crunchy' },
                { word: 'HOUSE', hint: '🏠 Where people live' },
                { word: 'WATER', hint: '💧 Clear liquid we drink' },
                { word: 'HAPPY', hint: '😊 How you feel when smiling' },
                { word: 'RAINBOW', hint: '🌈 Colorful arc in the sky' }
            ],
            4: [
                { word: 'BUTTERFLY', hint: '🦋 Colorful flying insect' },
                { word: 'ELEPHANT', hint: '🐘 Large gray animal with trunk' },
                { word: 'CHOCOLATE', hint: '🍫 Sweet brown treat' },
                { word: 'BIRTHDAY', hint: '🎂 Special day once a year' },
                { word: 'ADVENTURE', hint: '🗺️ Exciting journey' }
            ]
        };
        
        this.currentWords = this.wordLists[1];
        this.currentWord = this.currentWords[0];
        
        // Text-to-speech setup
        this.speechEnabled = true;
        this.setupSpeech();
        
        // Initialize arrays first
        this.particles = [];
        this.collectables = [];
        this.clouds = [];
        this.platforms = [];
        
        // Goals and achievements
        this.goals = [
            { id: 'first_word', name: 'First Word!', description: 'Spell your first word', completed: false, reward: 'coin' },
            { id: 'reach_10m', name: 'Sky Walker', description: 'Reach 10 meters high', completed: false, reward: 'star' },
            { id: 'collect_5_coins', name: 'Coin Collector', description: 'Collect 5 coins', completed: false, reward: 'power_up' },
            { id: 'streak_5', name: 'Word Wizard', description: 'Get 5 words in a row correct', completed: false, reward: 'star' },
            { id: 'reach_25m', name: 'Cloud Jumper', description: 'Reach 25 meters high', completed: false, reward: 'star' },
            { id: 'collect_10_stars', name: 'Star Master', description: 'Collect 10 stars', completed: false, reward: 'power_up' },
            { id: 'reach_50m', name: 'Space Explorer', description: 'Reach 50 meters high', completed: false, reward: 'star' }
        ];
        
        // Initialize platform generation variables
        this.nextPlatformY = 520;
        this.platformCount = 0;
        
        // Generate initial content
        this.generateClouds();
        this.generateInitialPlatforms();
        
        console.log('Game initialization complete');
        this.init();
    }
    
    setupSpeech() {
        // Check if speech synthesis is supported
        if ('speechSynthesis' in window) {
            this.speechSynth = window.speechSynthesis;
            
            // Set up voice preferences (child-friendly voice)
            this.speechSynth.onvoiceschanged = () => {
                const voices = this.speechSynth.getVoices();
                
                // Try to find a child-friendly or clear voice
                this.selectedVoice = voices.find(voice => 
                    voice.name.includes('Child') || 
                    voice.name.includes('Kids') ||
                    voice.name.includes('Female') ||
                    voice.lang.startsWith('en')
                ) || voices[0];
                
                console.log('Selected voice:', this.selectedVoice?.name || 'Default');
            };
        } else {
            console.warn('Speech synthesis not supported');
            this.speechEnabled = false;
        }
    }
    
    speakWord(text, rate = 0.8, pitch = 1.2) {
        if (!this.speechEnabled || !this.speechSynth) {
            return;
        }
        
        // Cancel any current speech
        this.speechSynth.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Kid-friendly settings
        utterance.rate = rate; // Slightly slower
        utterance.pitch = pitch; // Slightly higher pitch
        utterance.volume = 0.8;
        
        if (this.selectedVoice) {
            utterance.voice = this.selectedVoice;
        }
        
        this.speechSynth.speak(utterance);
        console.log(`Speaking: "${text}"`);
    }
    
    generateInitialPlatforms() {
        // Generate starting platforms
        for (let i = 0; i < 15; i++) {
            this.generateNextPlatform();
        }
    }
    
    generateNextPlatform() {
        const platformTypes = ['#8B4513', '#8B4513', '#8B4513', '#32CD32', '#FFD700']; // Brown, green, gold
        const weights = [60, 20, 15, 4, 1]; // Probability weights
        
        // Choose platform color based on weights
        let color = '#8B4513'; // Default brown
        const rand = Math.random() * 100;
        let cumulative = 0;
        
        for (let i = 0; i < weights.length; i++) {
            cumulative += weights[i];
            if (rand <= cumulative) {
                color = platformTypes[i];
                break;
            }
        }
        
        // Generate platform position
        const x = Math.random() * (this.canvas.width - 120) + 10;
        const width = 100 + Math.random() * 50; // Variable width platforms
        
        this.platforms.push({
            x: x,
            y: this.nextPlatformY,
            width: width,
            height: 20,
            color: color,
            id: this.platformCount
        });
        
        // Generate collectables near this platform
        this.generateCollectables(x, width, this.nextPlatformY);
        
        this.nextPlatformY -= this.platformSpacing;
        this.platformCount++;
    }
    
    generateCollectables(platformX, platformWidth, platformY) {
        // 90% chance to spawn a collectable (increased for testing)
        if (Math.random() < 0.9) {
            const collectableTypes = [
                { type: 'coin', value: 10, color: '#FFD700', size: 15, probability: 0.6 },
                { type: 'star', value: 25, color: '#FF69B4', size: 18, probability: 0.3 },
                { type: 'power_up', value: 50, color: '#00FFFF', size: 20, probability: 0.1 }
            ];
            
            // Choose collectable type
            const rand = Math.random();
            let selectedType = collectableTypes[0]; // Default to coin
            let cumulative = 0;
            
            for (let type of collectableTypes) {
                cumulative += type.probability;
                if (rand <= cumulative) {
                    selectedType = type;
                    break;
                }
            }
            
            // Position collectable in center of platform, floating above it
            const x = platformX + (platformWidth - selectedType.size) / 2; // Center horizontally
            const y = platformY - 35; // Fixed height above platform
            
            const collectable = {
                x: x,
                y: y,
                type: selectedType.type,
                value: selectedType.value,
                color: selectedType.color,
                size: selectedType.size,
                collected: false,
                bobOffset: Math.random() * Math.PI * 2, // For floating animation
                id: `${selectedType.type}_${this.platformCount}_${Date.now()}`
            };
            
            this.collectables.push(collectable);
            console.log(`Generated ${selectedType.type} at platform ${this.platformCount}, position: ${x}, ${y}`);
        }
    }
    
    generateClouds() {
        // Generate background clouds at different heights
        for (let i = 0; i < 20; i++) {
            this.clouds.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * 2000 - 1000, // Spread clouds vertically
                size: Math.random() * 30 + 20,
                speed: Math.random() * 0.5 + 0.2
            });
        }
    }
    
    init() {
        console.log('Setting up game...');
        try {
            this.setupEventListeners();
            console.log('Event listeners set up');
            
            this.updateDisplay();
            console.log('Display updated');
            
            // Say the first word after a short delay to let everything load
            setTimeout(() => {
                this.speakWord(`Spell the word: ${this.currentWord.word}`);
            }, 1500);
            
            this.gameLoop();
            console.log('Game loop started');
        } catch (error) {
            console.error('Error in init:', error);
            throw error;
        }
    }
    
    setupEventListeners() {
        const userInput = document.getElementById('userInput');
        const submitBtn = document.getElementById('submitBtn');
        const newGameBtn = document.getElementById('newGameBtn');
        const hintBtn = document.getElementById('hintBtn');
        const playAgainBtn = document.getElementById('playAgainBtn');
        const speakBtn = document.getElementById('speakBtn');
        const toggleSpeechBtn = document.getElementById('toggleSpeechBtn');
        
        if (!userInput || !submitBtn) {
            console.error('Required UI elements not found');
            return;
        }
        
        // Submit word on button click or Enter key
        submitBtn.addEventListener('click', () => this.checkSpelling());
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.checkSpelling();
            }
        });
        
        // Auto-uppercase input
        userInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
        
        if (newGameBtn) {
            newGameBtn.addEventListener('click', () => this.newGame());
        }
        if (hintBtn) {
            hintBtn.addEventListener('click', () => this.showHint());
        }
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => this.playAgain());
        }
        if (speakBtn) {
            speakBtn.addEventListener('click', () => {
                this.speakWord(this.currentWord.word);
            });
        }
        if (toggleSpeechBtn) {
            toggleSpeechBtn.addEventListener('click', () => {
                this.speechEnabled = !this.speechEnabled;
                toggleSpeechBtn.textContent = this.speechEnabled ? '🔊 Speech: ON' : '🔇 Speech: OFF';
                toggleSpeechBtn.style.background = this.speechEnabled ? 
                    'linear-gradient(45deg, #32CD32, #228B22)' : 
                    'linear-gradient(45deg, #DC143C, #B22222)';
            });
        }
    }
    
    updateDisplay() {
        // Update individual elements to avoid overwriting the entire scoreBoard
        const scoreElement = document.getElementById('score');
        const levelElement = document.getElementById('level');
        
        if (scoreElement) scoreElement.textContent = this.score;
        if (levelElement) levelElement.textContent = this.level;
        
        document.getElementById('targetWord').textContent = this.currentWord.word;
        document.getElementById('wordHint').textContent = this.currentWord.hint;
        
        // Update collectables display in scoreBoard
        const scoreBoard = document.getElementById('scoreBoard');
        scoreBoard.innerHTML = `
            <span>Score: <span id="score">${this.score}</span></span>
            <span>Level: <span id="level">${this.level}</span></span>
            <span>💰 Coins: ${this.coins}</span>
            <span>⭐ Stars: ${this.stars}</span>
            <span>🔥 Streak: ${this.streakCount}</span>
        `;
    }
    
    checkSpelling() {
        const userInput = document.getElementById('userInput');
        const feedback = document.getElementById('feedback');
        const userWord = userInput.value.trim().toUpperCase();
        
        if (userWord === this.currentWord.word) {
            // Correct spelling!
            let basePoints = this.currentWord.word.length * 10;
            
            // Apply power-up multiplier if active
            if (this.powerUpActive) {
                basePoints *= 2;
            }
            
            this.score += basePoints;
            this.streakCount++;
            this.maxStreak = Math.max(this.maxStreak, this.streakCount);
            
            feedback.className = 'correct';
            let message = `🎉 Excellent! "${this.currentWord.word}" is correct! +${basePoints} points`;
            
            if (this.powerUpActive) {
                message += ` ⚡ (DOUBLED!)`;
            }
            
            feedback.innerHTML = message;
            
            // Say the word again to confirm correct spelling
            this.speakWord(`Great job! ${this.currentWord.word}`, 0.9, 1.3);
            
            // Check for streak bonus
            if (this.streakCount >= 3) {
                let bonus = this.streakCount * 5;
                if (this.powerUpActive) {
                    bonus *= 2;
                }
                this.score += bonus;
                feedback.innerHTML += `<br>🔥 ${this.streakCount} word streak! +${bonus} bonus points!`;
                
                // Extra encouragement for streaks
                setTimeout(() => {
                    this.speakWord(`Amazing! ${this.streakCount} in a row!`, 1.0, 1.4);
                }, 1000);
            }
            
            // Jump to next platform
            this.jumpToNextPlatform();
            
            // Add celebration particles
            this.addCelebrationParticles();
            
            // Check and collect nearby collectables
            this.collectNearbyItems();
            
            // Check goals
            this.checkGoals();
            
            // Move to next word
            this.nextWord();
            
        } else {
            // Incorrect spelling - break streak
            this.streakCount = 0;
            feedback.className = 'incorrect';
            feedback.innerHTML = `❌ Oops! Try again. The word is "${this.currentWord.word}"`;
            
            // Say the correct word to help them learn
            this.speakWord(`Try again. The word is ${this.currentWord.word}`, 0.8, 1.1);
            
            // Shake effect
            document.getElementById('targetWord').classList.add('bounce');
            setTimeout(() => {
                document.getElementById('targetWord').classList.remove('bounce');
            }, 600);
        }
        
        userInput.value = '';
        userInput.focus();
    }
    
    jumpToNextPlatform() {
        // Find the next higher platform
        let nextPlatform = null;
        let minDistance = Infinity;
        
        // Look for platforms above the current character position
        for (let platform of this.platforms) {
            const platformScreenY = platform.y + this.camera.y;
            if (platform.y < this.character.worldY - 10) { // Platform is above character
                const distance = this.character.worldY - platform.y;
                if (distance < minDistance && distance > 0) {
                    minDistance = distance;
                    nextPlatform = platform;
                }
            }
        }
        
        if (nextPlatform) {
            this.character.jumping = true;
            this.character.targetY = nextPlatform.y - this.character.height;
            this.character.x = nextPlatform.x + (nextPlatform.width - this.character.width) / 2;
            
            // Update camera target to follow character
            this.camera.targetY = -nextPlatform.y + this.canvas.height * 0.7;
            
            // Generate new platforms if we're getting high
            if (this.platformCount - this.currentWordIndex < 10) {
                for (let i = 0; i < 5; i++) {
                    this.generateNextPlatform();
                }
            }
        }
    }
    
    nextWord() {
        this.currentWordIndex++;
        
        // Reduce power-up counter
        if (this.powerUpActive && this.powerUpCounter > 0) {
            this.powerUpCounter--;
            if (this.powerUpCounter <= 0) {
                this.powerUpActive = false;
            }
        }
        
        // Check for level up every 5 words
        if (this.currentWordIndex % 5 === 0 && this.level < 4) {
            this.level++;
            this.currentWords = this.wordLists[this.level];
        }
        
        // Cycle through current level's words
        const wordIndex = this.currentWordIndex % this.currentWords.length;
        this.currentWord = this.currentWords[wordIndex];
        this.updateDisplay();
        
        // Say the new word
        setTimeout(() => {
            this.speakWord(this.currentWord.word);
        }, 500); // Small delay to let other sounds finish
        
        // Clear feedback after a delay
        setTimeout(() => {
            document.getElementById('feedback').className = '';
            document.getElementById('feedback').innerHTML = '';
        }, 3000);
    }
    
    showHint() {
        const feedback = document.getElementById('feedback');
        feedback.className = '';
        feedback.innerHTML = `💡 Hint: ${this.currentWord.hint}`;
        
        setTimeout(() => {
            feedback.innerHTML = '';
        }, 3000);
    }
    
    collectNearbyItems() {
        if (!this.collectables || !Array.isArray(this.collectables)) {
            return;
        }
        
        const collectDistance = 80; // Increased collection distance
        const characterCenterX = this.character.x + this.character.width / 2;
        const characterCenterY = this.character.worldY + this.character.height / 2;
        
        console.log(`Character at: ${characterCenterX}, ${characterCenterY}`);
        console.log(`Checking ${this.collectables.length} collectables`);
        
        this.collectables.forEach((item, index) => {
            if (item && !item.collected) {
                const itemCenterX = item.x + item.size / 2;
                const itemCenterY = item.y + item.size / 2;
                
                const distance = Math.sqrt(
                    Math.pow(characterCenterX - itemCenterX, 2) +
                    Math.pow(characterCenterY - itemCenterY, 2)
                );
                
                console.log(`Item ${index} at: ${itemCenterX}, ${itemCenterY}, distance: ${distance}`);
                
                if (distance < collectDistance) {
                    console.log(`Collecting item: ${item.type}`);
                    item.collected = true;
                    this.score += item.value;
                    
                    // Add to specific counters
                    if (item.type === 'coin') {
                        this.coins++;
                        console.log(`Coin collected! Total coins: ${this.coins}`);
                    } else if (item.type === 'star') {
                        this.stars++;
                        console.log(`Star collected! Total stars: ${this.stars}`);
                    } else if (item.type === 'power_up') {
                        // Power-up effects
                        this.applyPowerUp();
                        console.log('Power-up collected!');
                    }
                    
                    // Add collection particles
                    this.addCollectionParticles(item);
                    
                    // Update display immediately
                    this.updateDisplay();
                }
            }
        });
        
        // Remove collected items
        const originalCount = this.collectables.length;
        this.collectables = this.collectables.filter(item => item && !item.collected);
        const newCount = this.collectables.length;
        
        if (originalCount !== newCount) {
            console.log(`Removed ${originalCount - newCount} collected items`);
        }
    }
    
    applyPowerUp() {
        // Double points for next 3 words
        this.powerUpActive = true;
        this.powerUpCounter = 3;
        
        const feedback = document.getElementById('feedback');
        feedback.innerHTML += '<br>⚡ Power-Up! Double points for 3 words!';
    }
    
    addCollectionParticles(item) {
        if (!this.particles) {
            this.particles = [];
        }
        
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: item.x + item.size / 2,
                y: item.y + item.size / 2,
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * -3 - 1,
                color: item.color,
                life: 40
            });
        }
    }
    
    addCelebrationParticles() {
        if (!this.particles) {
            this.particles = [];
        }
        
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: this.character.x + this.character.width / 2,
                y: this.character.worldY + this.character.height / 2, // Use world coordinates
                vx: (Math.random() - 0.5) * 6,
                vy: Math.random() * -5 - 2,
                color: `hsl(${Math.random() * 360}, 70%, 60%)`,
                life: 60
            });
        }
    }
    
    checkGoals() {
        const height = Math.max(0, Math.floor((520 - this.character.worldY) / this.platformSpacing));
        
        this.goals.forEach(goal => {
            if (!goal.completed) {
                let completed = false;
                
                switch (goal.id) {
                    case 'first_word':
                        completed = this.currentWordIndex >= 1;
                        break;
                    case 'reach_10m':
                        completed = height >= 10;
                        break;
                    case 'collect_5_coins':
                        completed = this.coins >= 5;
                        break;
                    case 'streak_5':
                        completed = this.streakCount >= 5;
                        break;
                    case 'reach_25m':
                        completed = height >= 25;
                        break;
                    case 'collect_10_stars':
                        completed = this.stars >= 10;
                        break;
                    case 'reach_50m':
                        completed = height >= 50;
                        break;
                }
                
                if (completed) {
                    goal.completed = true;
                    this.showGoalCompleted(goal);
                    this.giveReward(goal.reward);
                }
            }
        });
    }
    
    showGoalCompleted(goal) {
        const feedback = document.getElementById('feedback');
        feedback.innerHTML += `<br>🏆 Goal Complete: ${goal.name}!`;
        
        // Announce the achievement
        setTimeout(() => {
            this.speakWord(`Goal completed! ${goal.name}!`, 1.0, 1.4);
        }, 500);
        
        // Add special celebration particles
        if (!this.particles) {
            this.particles = [];
        }
        
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: this.character.x + this.character.width / 2,
                y: this.character.worldY + this.character.height / 2,
                vx: (Math.random() - 0.5) * 8,
                vy: Math.random() * -6 - 3,
                color: '#FFD700',
                life: 80
            });
        }
    }
    
    giveReward(rewardType) {
        switch (rewardType) {
            case 'coin':
                this.coins += 5;
                break;
            case 'star':
                this.stars += 3;
                break;
            case 'power_up':
                this.applyPowerUp();
                break;
        }
    }
    
    gameWin() {
        const height = Math.max(0, Math.floor((520 - this.character.worldY) / this.platformSpacing));
        document.getElementById('finalScore').textContent = `Amazing! You climbed ${height} meters high with a score of ${this.score}!`;
        document.getElementById('gameOverModal').classList.remove('hidden');
    }
    
    newGame() {
        this.score = 0;
        this.level = 1;
        this.currentWordIndex = 0;
        this.coins = 0;
        this.stars = 0;
        this.streakCount = 0;
        this.maxStreak = 0;
        this.powerUpActive = false;
        this.powerUpCounter = 0;
        this.currentWords = this.wordLists[1];
        this.currentWord = this.currentWords[0];
        this.character.x = 100;
        this.character.y = 500;
        this.character.worldY = 500;
        this.character.targetY = 500;
        this.character.jumping = false;
        this.particles = [];
        this.collectables = [];
        
        // Reset goals
        this.goals.forEach(goal => goal.completed = false);
        
        // Reset camera
        this.camera.y = 0;
        this.camera.targetY = 0;
        
        // Reset platforms
        this.platforms = [];
        this.nextPlatformY = 520;
        this.platformCount = 0;
        this.generateInitialPlatforms();
        
        // Reset clouds
        this.clouds = [];
        this.generateClouds();
        
        document.getElementById('feedback').className = '';
        document.getElementById('feedback').innerHTML = '';
        document.getElementById('userInput').value = '';
        
        this.updateDisplay();
    }
    
    playAgain() {
        document.getElementById('gameOverModal').classList.add('hidden');
        this.newGame();
    }
    
    gameLoop() {
        try {
            this.update();
            this.draw();
        } catch (error) {
            console.error('Error in game loop:', error);
        }
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        // Update character jumping animation
        if (this.character.jumping) {
            const speed = 5;
            if (this.character.y > this.character.targetY) {
                this.character.y -= speed;
                this.character.worldY = this.character.y; // Update world position
                if (this.character.y <= this.character.targetY) {
                    this.character.y = this.character.targetY;
                    this.character.worldY = this.character.targetY;
                    this.character.jumping = false;
                }
            }
        }
        
        // Always check for collectables (not just when jumping)
        this.collectNearbyItems();
        
        // Update camera with smooth following
        const cameraDiff = this.camera.targetY - this.camera.y;
        this.camera.y += cameraDiff * this.camera.smoothing;
        
        // Update particles (adjust for camera movement)
        if (this.particles && Array.isArray(this.particles)) {
            this.particles = this.particles.filter(particle => {
                if (particle && typeof particle === 'object') {
                    particle.x += particle.vx || 0;
                    particle.y += particle.vy || 0;
                    particle.vy = (particle.vy || 0) + 0.2; // gravity
                    particle.life = (particle.life || 0) - 1;
                    return particle.life > 0;
                }
                return false;
            });
        } else {
            this.particles = [];
        }
        
        // Update collectables (floating animation)
        if (this.collectables && Array.isArray(this.collectables)) {
            this.collectables.forEach(item => {
                if (item && !item.collected) {
                    item.bobOffset = (item.bobOffset || 0) + 0.1;
                    // Add floating effect to collectables
                }
            });
        } else {
            this.collectables = [];
        }
        
        // Update clouds (parallax effect)
        if (this.clouds && Array.isArray(this.clouds)) {
            this.clouds.forEach(cloud => {
                if (cloud) {
                    cloud.x += cloud.speed || 0;
                    if (cloud.x > this.canvas.width + (cloud.size || 0)) {
                        cloud.x = -(cloud.size || 0);
                        cloud.y = Math.random() * 2000 - 1000 + this.camera.y * 0.1;
                    }
                }
            });
        } else {
            this.clouds = [];
        }
        
        // Remove platforms that are too far below
        if (this.platforms && Array.isArray(this.platforms)) {
            this.platforms = this.platforms.filter(platform => {
                if (platform && typeof platform.y === 'number') {
                    const screenY = platform.y + this.camera.y;
                    return screenY < this.canvas.height + 200;
                }
                return false;
            });
        } else {
            this.platforms = [];
        }
        
        // Remove collectables that are too far below
        if (this.collectables && Array.isArray(this.collectables)) {
            this.collectables = this.collectables.filter(item => {
                if (item && typeof item.y === 'number') {
                    const screenY = item.y + this.camera.y;
                    return screenY < this.canvas.height + 200 && !item.collected;
                }
                return false;
            });
        } else {
            this.collectables = [];
        }
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background gradient (changes color as you go higher)
        const heightFactor = Math.max(0, -this.camera.y / 1000);
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        
        if (heightFactor < 0.5) {
            // Lower atmosphere
            gradient.addColorStop(0, `hsl(200, ${70 - heightFactor * 40}%, ${75 + heightFactor * 10}%)`);
            gradient.addColorStop(1, `hsl(120, ${60 - heightFactor * 30}%, ${70 + heightFactor * 15}%)`);
        } else {
            // Higher atmosphere - more purple/space-like
            gradient.addColorStop(0, `hsl(240, ${50 + heightFactor * 30}%, ${40 + heightFactor * 20}%)`);
            gradient.addColorStop(1, `hsl(280, ${40 + heightFactor * 40}%, ${30 + heightFactor * 25}%)`);
        }
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw moving clouds with camera offset
        this.drawClouds();
        
        // Draw platforms with camera offset
        this.platforms.forEach((platform, index) => {
            const screenY = platform.y + this.camera.y;
            
            // Only draw platforms visible on screen
            if (screenY > -50 && screenY < this.canvas.height + 50) {
                this.ctx.fillStyle = platform.color;
                this.ctx.fillRect(platform.x, screenY, platform.width, platform.height);
                
                // Add platform shine effect for special platforms
                if (platform.color === '#FFD700') {
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    this.ctx.fillRect(platform.x, screenY, platform.width, 5);
                } else if (platform.color === '#32CD32') {
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                    this.ctx.fillRect(platform.x, screenY, platform.width, 3);
                }
                
                // Add platform ID for debugging (optional)
                if (platform.id % 5 === 0) {
                    this.ctx.fillStyle = '#FFFFFF';
                    this.ctx.font = 'bold 12px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(platform.id, platform.x + platform.width / 2, screenY + 15);
                }
            }
        });
        
        // Draw collectables with camera offset
        this.drawCollectables();
        
        // Draw character (always on screen)
        this.drawCharacter();
        
        // Debug: Draw collection area around character
        if (this.collectables && this.collectables.length > 0) {
            this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(
                this.character.x + this.character.width / 2,
                this.character.y + this.character.height / 2 + this.camera.y,
                80, // Collection distance
                0, 
                Math.PI * 2
            );
            this.ctx.stroke();
        }
        
        // Draw particles with camera offset
        if (this.particles && Array.isArray(this.particles)) {
            this.particles.forEach(particle => {
                if (particle && typeof particle.x === 'number' && typeof particle.y === 'number') {
                    const screenY = particle.y + this.camera.y;
                    this.ctx.globalAlpha = (particle.life || 0) / 60;
                    this.ctx.fillStyle = particle.color || '#FFFFFF';
                    this.ctx.beginPath();
                    this.ctx.arc(particle.x, screenY, 3, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.globalAlpha = 1;
                }
            });
        }
        
        // Draw UI elements
        this.drawHeightIndicator();
        this.drawGoalsPanel();
        
        // Draw progress indicator
        this.drawProgress();
    }
    
    drawCharacter() {
        const x = this.character.x;
        const y = this.character.y + this.camera.y; // Apply camera offset
        const size = this.character.width;
        
        // Character body (circle)
        this.ctx.fillStyle = '#FFB6C1';
        this.ctx.beginPath();
        this.ctx.arc(x + size/2, y + size/2, size/3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Character face
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        // Eyes
        this.ctx.arc(x + size/2 - 6, y + size/2 - 4, 2, 0, Math.PI * 2);
        this.ctx.arc(x + size/2 + 6, y + size/2 - 4, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Smile
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(x + size/2, y + size/2 + 2, 8, 0.2 * Math.PI, 0.8 * Math.PI);
        this.ctx.stroke();
        
        // Add jumping effect
        if (this.character.jumping) {
            this.ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(x + size/2, y + size/2, size/2 + 5, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawClouds() {
        // Draw moving clouds with parallax effect
        this.clouds.forEach(cloud => {
            const screenY = cloud.y + this.camera.y * 0.3; // Parallax effect
            
            // Only draw clouds visible on screen
            if (screenY > -cloud.size && screenY < this.canvas.height + cloud.size) {
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                
                // Draw cloud as multiple circles
                this.ctx.beginPath();
                this.ctx.arc(cloud.x - cloud.size * 0.3, screenY, cloud.size * 0.6, 0, Math.PI * 2);
                this.ctx.arc(cloud.x, screenY, cloud.size * 0.8, 0, Math.PI * 2);
                this.ctx.arc(cloud.x + cloud.size * 0.3, screenY, cloud.size * 0.6, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }
    
    drawCollectables() {
        if (!this.collectables || !Array.isArray(this.collectables)) {
            return;
        }
        
        this.collectables.forEach((item, index) => {
            if (item && !item.collected) {
                const screenY = item.y + this.camera.y + Math.sin(item.bobOffset || 0) * 3; // Floating effect
                const screenX = item.x;
                
                // Only draw collectables visible on screen
                if (screenY > -item.size && screenY < this.canvas.height + item.size &&
                    screenX > -item.size && screenX < this.canvas.width + item.size) {
                    // Draw glow effect
                    this.ctx.globalAlpha = 0.3;
                    this.ctx.fillStyle = item.color;
                    this.ctx.beginPath();
                    this.ctx.arc(item.x + item.size / 2, screenY + item.size / 2, item.size + 5, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.globalAlpha = 1;
                    
                    // Draw main collectable
                    this.ctx.fillStyle = item.color;
                    
                    if (item.type === 'coin') {
                        // Draw coin
                        this.ctx.beginPath();
                        this.ctx.arc(item.x + item.size / 2, screenY + item.size / 2, item.size / 2, 0, Math.PI * 2);
                        this.ctx.fill();
                        
                        // Add coin details
                        this.ctx.strokeStyle = '#B8860B';
                        this.ctx.lineWidth = 2;
                        this.ctx.stroke();
                        
                        this.ctx.fillStyle = '#B8860B';
                        this.ctx.font = 'bold 10px Arial';
                        this.ctx.textAlign = 'center';
                        this.ctx.fillText('$', item.x + item.size / 2, screenY + item.size / 2 + 3);
                        
                    } else if (item.type === 'star') {
                        // Draw star
                        this.drawStar(item.x + item.size / 2, screenY + item.size / 2, item.size / 2, item.color);
                        
                    } else if (item.type === 'power_up') {
                        // Draw power-up (diamond shape)
                        const centerX = item.x + item.size / 2;
                        const centerY = screenY + item.size / 2;
                        const radius = item.size / 2;
                        
                        this.ctx.beginPath();
                        this.ctx.moveTo(centerX, centerY - radius);
                        this.ctx.lineTo(centerX + radius, centerY);
                        this.ctx.lineTo(centerX, centerY + radius);
                        this.ctx.lineTo(centerX - radius, centerY);
                        this.ctx.closePath();
                        this.ctx.fill();
                        
                        // Add lightning symbol
                        this.ctx.fillStyle = '#FFFFFF';
                        this.ctx.font = 'bold 12px Arial';
                        this.ctx.textAlign = 'center';
                        this.ctx.fillText('⚡', centerX, centerY + 4);
                    }
                }
            }
        });
    }
    
    drawStar(x, y, radius, color) {
        this.ctx.save();
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        
        let firstPoint = true;
        for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
            const outerX = x + Math.cos(angle) * radius;
            const outerY = y + Math.sin(angle) * radius;
            
            const innerAngle = angle + Math.PI / 5;
            const innerX = x + Math.cos(innerAngle) * (radius * 0.5);
            const innerY = y + Math.sin(innerAngle) * (radius * 0.5);
            
            if (firstPoint) {
                this.ctx.moveTo(outerX, outerY);
                firstPoint = false;
            } else {
                this.ctx.lineTo(outerX, outerY);
            }
            this.ctx.lineTo(innerX, innerY);
        }
        
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();
    }
    
    drawHeightIndicator() {
        // Height indicator showing how high the player has climbed
        const height = Math.max(0, Math.floor((520 - this.character.worldY) / this.platformSpacing));
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 150, 30);
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Height: ${height}m`, 20, 30);
        
        // Power-up indicator
        if (this.powerUpActive) {
            this.ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
            this.ctx.fillRect(10, 45, 150, 25);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.fillText(`⚡ Power-Up: ${this.powerUpCounter} words`, 20, 62);
        }
    }
    
    drawGoalsPanel() {
        // Draw active goals panel
        const panelWidth = 250;
        const panelHeight = 120;
        const x = this.canvas.width - panelWidth - 10;
        const y = 60;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(x, y, panelWidth, panelHeight);
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('🏆 Active Goals:', x + 10, y + 20);
        
        // Show next 3 incomplete goals
        const incompleteGoals = this.goals.filter(goal => !goal.completed).slice(0, 3);
        incompleteGoals.forEach((goal, index) => {
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(`• ${goal.name}`, x + 10, y + 40 + index * 25);
            this.ctx.fillStyle = '#CCCCCC';
            this.ctx.font = '10px Arial';
            this.ctx.fillText(goal.description, x + 15, y + 55 + index * 25);
        });
    }
    
    drawProgress() {
        const barWidth = 200;
        const barHeight = 20;
        const x = this.canvas.width - barWidth - 20;
        const y = 20;
        
        // Progress bar background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(x - 5, y - 5, barWidth + 10, barHeight + 40);
        
        this.ctx.fillStyle = '#DDDDDD';
        this.ctx.fillRect(x, y, barWidth, barHeight);
        
        // Progress bar fill (based on words completed)
        const progress = (this.currentWordIndex % 10) / 10; // Show progress within current set of 10
        this.ctx.fillStyle = '#32CD32';
        this.ctx.fillRect(x, y, barWidth * progress, barHeight);
        
        // Progress text
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Words: ${this.currentWordIndex}`, x + barWidth/2, y + 35);
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    try {
        console.log('Starting Spelling Jump Game...');
        const game = new SpellingJumpGame();
        
        // Focus on input field
        const userInput = document.getElementById('userInput');
        if (userInput) {
            userInput.focus();
        }
        
        // Add some fun interactions
        const targetWord = document.getElementById('targetWord');
        if (targetWord) {
            targetWord.classList.add('pulse');
        }
        
        console.log('Game initialized successfully!');
    } catch (error) {
        console.error('Error initializing game:', error);
        
        // Show error message to user
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            gameContainer.innerHTML = `
                <div style="background: #ffebee; border: 1px solid #f44336; padding: 20px; margin: 20px; border-radius: 8px; color: #d32f2f;">
                    <h2>⚠️ Game Loading Error</h2>
                    <p>There was an error starting the game: ${error.message}</p>
                    <p>Please refresh the page and try again.</p>
                </div>
            `;
        }
    }
});