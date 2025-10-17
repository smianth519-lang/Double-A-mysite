// Waves.js - Enemy wave spawning and progression system
class WaveManager {
    constructor() {
        this.currentWaveNumber = 0;
        this.activeWaves = []; // Array to track multiple active waves
        this.waveIdCounter = 0; // Unique ID for each wave
        
        // Wave difficulty scaling - BRUTAL NUMBERS
        this.baseEnemyCount = 12;
        this.enemyCountIncrease = 5;
        this.maxEnemiesPerWave = 60;
        this.wavePrepareTime = 200; // Reduced prepare time for rapid activation
        
        // Special wave configurations
        this.specialWaves = {
            5: { type: 'boss', message: 'Boss Wave!' },
            10: { type: 'boss', message: 'Major Boss Wave!' },
            15: { type: 'boss', message: 'Elite Boss Wave!' },
            20: { type: 'final', message: 'Final Boss Wave!' }
        };
        
        console.log('Wave Manager initialized');
    }
    
    startWave(waveNumber) {
        // Create a new wave instance
        const waveId = this.waveIdCounter++;
        const newWave = new ActiveWave(waveId, waveNumber, this);
        
        // Add to active waves list
        this.activeWaves.push(newWave);
        
        // Update current wave number
        this.currentWaveNumber = Math.max(this.currentWaveNumber, waveNumber);
        
        // Show wave announcement
        this.announceWave(waveNumber, waveId);
        
        console.log(`Started wave ${waveNumber} (ID: ${waveId}). Active waves: ${this.activeWaves.length}`);
        
        // Show immediate feedback
        if (window.game) {
            window.game.showMessage(`Wave ${waveNumber} activated! (${this.activeWaves.length} waves active)`, 'info');
        }
        
        // Start wave after preparation time
        setTimeout(() => {
            newWave.beginSpawning();
        }, this.wavePrepareTime);
        
        return true;
    }
    
    configureWave(waveNumber) {
        // Determine enemy types for this wave
        this.waveEnemyTypes = EnemyFactory.getEnemyTypeForWave(waveNumber);
        
        // Calculate number of enemies
        this.enemiesToSpawn = Math.min(
            this.baseEnemyCount + Math.floor((waveNumber - 1) * this.enemyCountIncrease),
            this.maxEnemiesPerWave
        );
        
        // Special wave modifications
        if (this.specialWaves[waveNumber]) {
            this.configureSpecialWave(waveNumber);
        }
        
        // Adjust spawn delay based on wave difficulty - FASTER SPAWNING
        this.spawnDelay = Math.max(150, 800 - (waveNumber * 60)); // Ultra-fast spawn rate
        
        // Reset counters
        this.enemiesSpawned = 0;
        this.lastSpawnTime = 0;
    }
    
    configureSpecialWave(waveNumber) {
        const special = this.specialWaves[waveNumber];
        
        switch (special.type) {
            case 'boss':
                this.waveEnemyTypes = ['heavy', 'boss', 'armored'];
                this.enemiesToSpawn = 3;
                if (waveNumber >= 15) {
                    // Elite boss waves have heavy escorts
                    this.waveEnemyTypes = ['heavy', 'armored', 'boss', 'flying', 'heavy'];
                    this.enemiesToSpawn = 5;
                }
                break;
                
            case 'final':
                this.waveEnemyTypes = ['heavy', 'boss', 'armored', 'boss', 'flying'];
                this.enemiesToSpawn = 5;
                this.spawnDelay = 1000; // Slower spawn for dramatic effect
                break;
        }
    }
    
    beginWaveSpawning() {
        this.isPreparing = false;
        this.isWaveActive = true;
        this.waveStartTime = Date.now();
        this.lastSpawnTime = Date.now();
        
        console.log(`Wave ${this.currentWave} started!`);
        
        // Update UI
        if (window.game) {
            window.game.updateUI();
        }
    }
    
    update(deltaTime) {
        // Update all active waves
        for (let i = this.activeWaves.length - 1; i >= 0; i--) {
            const wave = this.activeWaves[i];
            wave.update(deltaTime);
            
            // Remove completed waves
            if (wave.isComplete()) {
                this.completeWave(wave);
                this.activeWaves.splice(i, 1);
            }
        }
    }
    
    get isAnyWaveActive() {
        return this.activeWaves.length > 0;
    }
    
    get totalActiveEnemies() {
        if (!window.game) return 0;
        return window.game.enemies.length;
    }
    
    completeWave(wave) {
        // Award bonus money for completing wave
        const waveBonus = this.calculateWaveBonus(wave.waveNumber);
        if (window.game) {
            window.game.addMoney(waveBonus);
            window.game.showMessage(`Wave ${wave.waveNumber} Complete! Bonus: $${waveBonus}`, 'success');
            
            // Only increment wave number if this was the highest wave
            if (wave.waveNumber >= window.game.currentWave) {
                window.game.currentWave++;
                window.game.updateUI();
            }
        }
        
        console.log(`Wave ${wave.waveNumber} (ID: ${wave.id}) completed! Bonus: $${waveBonus}. Active waves: ${this.activeWaves.length - 1}`);
        
        // Check for victory condition
        if (wave.waveNumber >= 20 && this.activeWaves.length <= 1) {
            if (window.game) {
                window.game.checkVictory();
            }
        }
    }
    
    calculateWaveBonus(waveNumber) {
        // Base bonus increases with wave number
        let bonus = 20 + (waveNumber * 10);
        
        // Special wave bonuses
        if (this.specialWaves[waveNumber]) {
            bonus *= 2;
        }
        
        // Difficulty multiplier
        if (waveNumber >= 15) bonus *= 1.5;
        if (waveNumber >= 10) bonus *= 1.3;
        
        return Math.floor(bonus);
    }
    
    announceWave(waveNumber, waveId) {
        if (!window.game) return;
        
        let message = `Wave ${waveNumber} Incoming!`;
        
        if (this.specialWaves[waveNumber]) {
            message = this.specialWaves[waveNumber].message;
        }
        
        // Add info about multiple active waves
        if (this.activeWaves.length > 0) {
            message += ` (Wave ${this.activeWaves.length + 1} active)`;
        }
        
        // Show message
        console.log(`${message} (ID: ${waveId})`);
        
        // Visual announcement
        this.showWaveAnnouncement(message, waveNumber);
    }
    
    showWaveAnnouncement(message, waveNumber) {
        // Create visual wave announcement
        const announcement = {
            message: message,
            wave: waveNumber,
            startTime: Date.now(),
            duration: 3000,
            isSpecial: this.specialWaves[waveNumber] !== undefined
        };
        
        if (window.game) {
            window.game.waveAnnouncement = announcement;
        }
    }
    
    getNextWaveInfo(waveNumber = this.currentWave + 1) {
        const enemyTypes = EnemyFactory.getEnemyTypeForWave(waveNumber);
        const enemyCount = Math.min(
            this.baseEnemyCount + Math.floor((waveNumber - 1) * this.enemyCountIncrease),
            this.maxEnemiesPerWave
        );
        
        let difficulty = 'Normal';
        if (this.specialWaves[waveNumber]) {
            difficulty = 'BOSS';
        } else if (waveNumber >= 15) {
            difficulty = 'Hard';
        } else if (waveNumber >= 10) {
            difficulty = 'Medium';
        }
        
        return {
            waveNumber,
            enemyTypes,
            enemyCount,
            difficulty,
            bonus: this.calculateWaveBonus()
        };
    }
    
    getWaveProgress() {
        if (!this.isWaveActive) return null;
        
        const enemiesRemaining = window.game ? window.game.enemies.length : 0;
        const totalProgress = this.enemiesToSpawn;
        const spawnProgress = this.enemiesSpawned;
        const killProgress = this.enemiesToSpawn - enemiesRemaining;
        
        return {
            wave: this.currentWave,
            spawned: `${spawnProgress}/${totalProgress}`,
            killed: `${killProgress}/${totalProgress}`,
            remaining: enemiesRemaining,
            spawnComplete: spawnProgress >= totalProgress,
            waveComplete: killProgress >= totalProgress && enemiesRemaining === 0
        };
    }
    
    getTimeUntilNextSpawn() {
        if (!this.isWaveActive || this.enemiesSpawned >= this.enemiesToSpawn) {
            return 0;
        }
        
        const timeSinceLastSpawn = Date.now() - this.lastSpawnTime;
        return Math.max(0, this.spawnDelay - timeSinceLastSpawn);
    }
    
    reset() {
        this.currentWaveNumber = 0;
        this.activeWaves = [];
        this.waveIdCounter = 0;
        
        console.log('Wave Manager reset');
    }
    
    // Emergency functions
    skipCurrentWave() {
        if (this.isWaveActive && window.game) {
            // Remove all enemies
            window.game.enemies = [];
            this.completeWave();
        }
    }
    
    forceStartWave(waveNumber) {
        this.reset();
        this.startWave(waveNumber);
    }
}

// Wave difficulty calculator
class WaveDifficulty {
    static calculateDifficulty(waveNumber) {
        let difficulty = 1.0;
        
        // Base scaling
        difficulty += (waveNumber - 1) * 0.15;
        
        // Exponential scaling after wave 10
        if (waveNumber > 10) {
            difficulty *= Math.pow(1.1, waveNumber - 10);
        }
        
        // Special wave multipliers
        if (waveNumber % 5 === 0) {
            difficulty *= 1.5; // Boss waves
        }
        
        return difficulty;
    }
    
    static getRecommendedTowerCount(waveNumber) {
        return Math.ceil(2 + waveNumber * 0.8);
    }
    
    static getWaveDescription(waveNumber) {
        const descriptions = {
            1: "Welcome to Tower Defense! Basic enemies approach.",
            5: "First boss incoming! Prepare your defenses.",
            10: "Major boss wave! Multiple threats detected.",
            15: "Elite forces mobilizing. Extreme caution advised.",
            20: "Final assault! All enemy types converging."
        };
        
        return descriptions[waveNumber] || `Wave ${waveNumber} - Escalating threat level.`;
    }
}

// Wave statistics tracker
class WaveStats {
    constructor() {
        this.waveData = {};
        this.totalWavesCompleted = 0;
        this.totalEnemiesKilled = 0;
        this.totalMoneyEarned = 0;
    }
    
    recordWaveStart(waveNumber, enemyCount) {
        this.waveData[waveNumber] = {
            startTime: Date.now(),
            enemyCount: enemyCount,
            enemiesKilled: 0,
            moneyEarned: 0,
            towersBuilt: 0,
            completed: false
        };
    }
    
    recordWaveComplete(waveNumber, stats) {
        if (this.waveData[waveNumber]) {
            this.waveData[waveNumber].completed = true;
            this.waveData[waveNumber].endTime = Date.now();
            this.waveData[waveNumber].duration = 
                this.waveData[waveNumber].endTime - this.waveData[waveNumber].startTime;
            
            Object.assign(this.waveData[waveNumber], stats);
            
            this.totalWavesCompleted++;
        }
    }
    
    getWaveStats(waveNumber) {
        return this.waveData[waveNumber] || null;
    }
    
    getAllStats() {
        return {
            totalWaves: this.totalWavesCompleted,
            totalEnemies: this.totalEnemiesKilled,
            totalMoney: this.totalMoneyEarned,
            averageWaveTime: this.calculateAverageWaveTime(),
            waveData: this.waveData
        };
    }
    
    calculateAverageWaveTime() {
        const completedWaves = Object.values(this.waveData)
            .filter(wave => wave.completed && wave.duration);
        
        if (completedWaves.length === 0) return 0;
        
        const totalTime = completedWaves.reduce((sum, wave) => sum + wave.duration, 0);
        return Math.floor(totalTime / completedWaves.length);
    }
}

// Individual Wave Class for tracking multiple concurrent waves
class ActiveWave {
    constructor(id, waveNumber, waveManager) {
        this.id = id;
        this.waveNumber = waveNumber;
        this.waveManager = waveManager;
        
        // Wave state
        this.isSpawning = false;
        this.enemiesSpawned = 0;
        this.enemiesToSpawn = 0;
        this.spawnDelay = 800;
        this.lastSpawnTime = 0;
        this.waveEnemyTypes = [];
        this.spawnStartTime = 0;
        
        // Configure this wave
        this.configure();
    }
    
    configure() {
        // Determine enemy types for this wave
        this.waveEnemyTypes = EnemyFactory.getEnemyTypeForWave(this.waveNumber);
        
        // Calculate number of enemies
        this.enemiesToSpawn = Math.min(
            this.waveManager.baseEnemyCount + Math.floor((this.waveNumber - 1) * this.waveManager.enemyCountIncrease),
            this.waveManager.maxEnemiesPerWave
        );
        
        // Special wave modifications
        if (this.waveManager.specialWaves[this.waveNumber]) {
            this.configureSpecialWave();
        }
        
        // Adjust spawn delay based on wave difficulty
        this.spawnDelay = Math.max(300, 1200 - (this.waveNumber * 40));
        
        console.log(`Configured wave ${this.waveNumber} (ID: ${this.id}) with ${this.enemiesToSpawn} enemies`);
    }
    
    configureSpecialWave() {
        const special = this.waveManager.specialWaves[this.waveNumber];
        
        switch (special.type) {
            case 'boss':
                this.waveEnemyTypes = ['heavy', 'boss', 'armored'];
                this.enemiesToSpawn = 3;
                if (this.waveNumber >= 15) {
                    this.waveEnemyTypes = ['heavy', 'armored', 'boss', 'flying', 'heavy'];
                    this.enemiesToSpawn = 5;
                }
                break;
                
            case 'final':
                this.waveEnemyTypes = ['heavy', 'boss', 'armored', 'boss', 'flying'];
                this.enemiesToSpawn = 5;
                this.spawnDelay = 2000;
                break;
        }
    }
    
    beginSpawning() {
        this.isSpawning = true;
        this.spawnStartTime = Date.now();
        this.lastSpawnTime = Date.now();
        
        console.log(`Wave ${this.waveNumber} (ID: ${this.id}) spawning started!`);
    }
    
    update(deltaTime) {
        if (!this.isSpawning) return;
        
        const currentTime = Date.now();
        
        // Spawn enemies
        if (this.shouldSpawnEnemy(currentTime)) {
            this.spawnNextEnemy();
        }
    }
    
    shouldSpawnEnemy(currentTime) {
        return this.enemiesSpawned < this.enemiesToSpawn &&
               currentTime - this.lastSpawnTime >= this.spawnDelay;
    }
    
    spawnNextEnemy() {
        if (!window.game) return;
        
        // Determine enemy type for this spawn
        const enemyTypeIndex = this.enemiesSpawned % this.waveEnemyTypes.length;
        const enemyType = this.waveEnemyTypes[enemyTypeIndex];
        
        // Create enemy with wave level for speed scaling
        const enemy = EnemyFactory.createEnemy(enemyType, -50, 300, this.waveNumber);
        
        // Add some randomization to spawn position
        enemy.y += (Math.random() - 0.5) * 40;
        
        // Mark enemy with wave ID for tracking
        enemy.waveId = this.id;
        enemy.waveNumber = this.waveNumber;
        
        // Add to game
        window.game.enemies.push(enemy);
        
        // Update counters
        this.enemiesSpawned++;
        this.lastSpawnTime = Date.now();
        
        console.log(`Spawned ${enemyType} from wave ${this.waveNumber} (${this.enemiesSpawned}/${this.enemiesToSpawn})`);
    }
    
    isComplete() {
        if (!window.game) return false;
        
        // Wave is complete when all enemies are spawned
        // We don't wait for them to be killed since multiple waves can overlap
        return this.enemiesSpawned >= this.enemiesToSpawn;
    }
    
    getProgress() {
        return {
            waveNumber: this.waveNumber,
            id: this.id,
            spawned: this.enemiesSpawned,
            total: this.enemiesToSpawn,
            complete: this.isComplete()
        };
    }
}

// Initialize wave manager
let waveManager;
document.addEventListener('DOMContentLoaded', () => {
    waveManager = new WaveManager();
    window.waveManager = waveManager;
    console.log('Wave Manager ready');
});
