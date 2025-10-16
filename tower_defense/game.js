// Game.js - Main game engine and core systems
class TowerDefenseGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.gameState = 'playing'; // playing, paused, gameOver, victory
        this.gameSpeed = 1;
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Game stats
        this.playerHealth = 100;
        this.playerMoney = 750;
        this.currentWave = 1;
        this.score = 0;
        
        // Game objects
        this.enemies = [];
        this.towers = [];
        this.projectiles = [];
        this.particles = [];
        
        // Input handling
        this.mouseX = 0;
        this.mouseY = 0;
        this.selectedTowerType = null;
        this.selectedTower = null;
        this.isPlacingTower = false;
        
        // Path for enemies (simple zigzag path)
        this.path = this.generatePath();
        
        // Initialize game systems
        this.initializeEventListeners();
        this.gameLoop = this.gameLoop.bind(this);
        
        console.log('Tower Defense Game initialized!');
    }
    
    generatePath() {
        const path = [];
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        // Create a winding path from left to right
        path.push({ x: -50, y: canvasHeight / 2 });
        path.push({ x: 150, y: canvasHeight / 2 });
        path.push({ x: 150, y: 150 });
        path.push({ x: 400, y: 150 });
        path.push({ x: 400, y: canvasHeight - 150 });
        path.push({ x: 650, y: canvasHeight - 150 });
        path.push({ x: 650, y: 250 });
        path.push({ x: 850, y: 250 });
        path.push({ x: 850, y: canvasHeight / 2 });
        path.push({ x: canvasWidth + 50, y: canvasHeight / 2 });
        
        return path;
    }
    
    initializeEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('click', (e) => this.handleMouseClick(e));
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.cancelTowerPlacement();
        });
        
        // Tower shop events
        document.querySelectorAll('.tower-item').forEach(item => {
            item.addEventListener('click', () => this.selectTowerType(item.dataset.tower));
        });
        
        // Control buttons
        document.getElementById('startWaveBtn').addEventListener('click', () => this.startNextWave());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('speedBtn').addEventListener('click', () => this.changeGameSpeed());
        document.getElementById('sellTowerBtn').addEventListener('click', () => this.sellSelectedTower());
        document.getElementById('upgradeTowerBtn').addEventListener('click', () => this.upgradeSelectedTower());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        
        // Account for canvas scaling
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        this.mouseX = (e.clientX - rect.left) * scaleX;
        this.mouseY = (e.clientY - rect.top) * scaleY;
        
        // Find hovered tower for tooltip
        this.hoveredTower = null;
        for (const tower of this.towers) {
            const distance = Math.sqrt(
                Math.pow(this.mouseX - tower.x, 2) + 
                Math.pow(this.mouseY - tower.y, 2)
            );
            if (distance <= 30) { // Tower hitbox radius
                this.hoveredTower = tower;
                break;
            }
        }
    }
    
    handleMouseClick(e) {
        if (this.gameState !== 'playing') return;
        
        // Recalculate mouse coordinates for precise clicking
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        const clickX = (e.clientX - rect.left) * scaleX;
        const clickY = (e.clientY - rect.top) * scaleY;
        
        if (this.isPlacingTower && this.selectedTowerType) {
            this.placeTower(clickX, clickY);
        } else {
            this.selectTowerAtPosition(clickX, clickY);
        }
    }
    
    selectTowerType(towerType) {
        // Deselect all tower items
        document.querySelectorAll('.tower-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        const towerCosts = { basic: 125, cannon: 250, laser: 400, ice: 175 };
        
        if (this.playerMoney >= towerCosts[towerType]) {
            this.selectedTowerType = towerType;
            this.isPlacingTower = true;
            this.selectedTower = null;
            
            // Highlight selected tower
            document.querySelector(`[data-tower="${towerType}"]`).classList.add('selected');
            
            this.updateUI();
        } else {
            this.showMessage('Not enough money!', 'error');
        }
    }
    
    placeTower(x, y) {
        if (!this.canPlaceTowerAt(x, y)) {
            this.showMessage('Cannot place tower here!', 'error');
            return;
        }
        
        const towerCosts = { basic: 125, cannon: 250, laser: 400, ice: 175 };
        const cost = towerCosts[this.selectedTowerType];
        
        if (this.playerMoney >= cost) {
            const tower = new Tower(x, y, this.selectedTowerType);
            this.towers.push(tower);
            this.playerMoney -= cost;
            this.score += 10;
            
            this.cancelTowerPlacement();
            this.updateUI();
            
            console.log(`Placed ${this.selectedTowerType} tower at (${x}, ${y})`);
        }
    }
    
    canPlaceTowerAt(x, y) {
        const minDistance = 60;
        
        // Check distance from path
        for (let i = 0; i < this.path.length - 1; i++) {
            const pathPoint1 = this.path[i];
            const pathPoint2 = this.path[i + 1];
            
            const distance = this.distanceToLineSegment(x, y, pathPoint1.x, pathPoint1.y, pathPoint2.x, pathPoint2.y);
            if (distance < 40) return false;
        }
        
        // Check distance from other towers
        for (let tower of this.towers) {
            const distance = Math.sqrt((x - tower.x) ** 2 + (y - tower.y) ** 2);
            if (distance < minDistance) return false;
        }
        
        // Check if within canvas bounds
        if (x < 30 || x > this.canvas.width - 30 || y < 30 || y > this.canvas.height - 30) {
            return false;
        }
        
        return true;
    }
    
    distanceToLineSegment(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
        
        const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (length * length)));
        const projectionX = x1 + t * dx;
        const projectionY = y1 + t * dy;
        
        return Math.sqrt((px - projectionX) ** 2 + (py - projectionY) ** 2);
    }
    
    selectTowerAtPosition(x, y) {
        this.selectedTower = null;
        
        for (let tower of this.towers) {
            const distance = Math.sqrt((x - tower.x) ** 2 + (y - tower.y) ** 2);
            if (distance < 30) {
                this.selectedTower = tower;
                break;
            }
        }
        
        this.updateUI();
    }
    
    cancelTowerPlacement() {
        this.isPlacingTower = false;
        this.selectedTowerType = null;
        
        document.querySelectorAll('.tower-item').forEach(item => {
            item.classList.remove('selected');
        });
    }
    
    startNextWave() {
        if (window.waveManager) {
            const success = window.waveManager.startWave(this.currentWave);
            if (success) {
                // Don't increment currentWave here - let the wave manager handle it
                this.updateUI();
            }
        }
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            document.getElementById('pauseBtn').textContent = 'Resume';
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            document.getElementById('pauseBtn').textContent = 'Pause';
        }
    }
    
    changeGameSpeed() {
        const speeds = [1, 2, 4];
        const currentIndex = speeds.indexOf(this.gameSpeed);
        this.gameSpeed = speeds[(currentIndex + 1) % speeds.length];
        document.getElementById('speedBtn').textContent = `Speed: ${this.gameSpeed}x`;
    }
    
    sellSelectedTower() {
        if (this.selectedTower) {
            const sellPrice = Math.floor(this.selectedTower.totalCost * 0.7);
            this.playerMoney += sellPrice;
            this.score += 5;
            
            const index = this.towers.indexOf(this.selectedTower);
            this.towers.splice(index, 1);
            this.selectedTower = null;
            
            this.updateUI();
            this.showMessage(`Tower sold for $${sellPrice}`, 'success');
        }
    }
    
    upgradeSelectedTower() {
        if (this.selectedTower && this.selectedTower.canUpgrade()) {
            const upgradeCost = this.selectedTower.getUpgradeCost();
            
            if (this.playerMoney >= upgradeCost) {
                this.playerMoney -= upgradeCost;
                this.selectedTower.upgrade();
                this.score += 20;
                
                this.updateUI();
                this.showMessage('Tower upgraded!', 'success');
            } else {
                this.showMessage('Not enough money to upgrade!', 'error');
            }
        }
    }
    
    takeDamage(damage) {
        this.playerHealth -= damage;
        this.updateUI();
        
        // Shake effect
        document.getElementById('gameContainer').classList.add('shake');
        setTimeout(() => {
            document.getElementById('gameContainer').classList.remove('shake');
        }, 500);
        
        if (this.playerHealth <= 0) {
            this.gameOver();
        }
    }
    
    addMoney(amount) {
        this.playerMoney += amount;
        this.score += amount * 2;
        this.updateUI();
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        document.getElementById('messageTitle').textContent = 'Game Over!';
        document.getElementById('messageText').textContent = `You survived ${this.currentWave - 1} waves and scored ${this.score} points.`;
        document.getElementById('gameMessage').classList.remove('hidden');
    }
    
    checkVictory() {
        if (this.currentWave > 20) {
            this.gameState = 'victory';
            document.getElementById('messageTitle').textContent = 'Victory!';
            document.getElementById('messageText').textContent = `Congratulations! You defended your base and scored ${this.score} points!`;
            document.getElementById('gameMessage').classList.remove('hidden');
        }
    }
    
    restartGame() {
        this.gameState = 'playing';
        this.playerHealth = 100;
        this.playerMoney = 750;
        this.currentWave = 1;
        this.score = 0;
        this.gameSpeed = 1;
        
        this.enemies = [];
        this.towers = [];
        this.projectiles = [];
        this.particles = [];
        
        this.selectedTower = null;
        this.selectedTowerType = null;
        this.isPlacingTower = false;
        
        document.getElementById('gameMessage').classList.add('hidden');
        document.getElementById('pauseBtn').textContent = 'Pause';
        document.getElementById('speedBtn').textContent = 'Speed: 1x';
        
        if (window.waveManager) {
            window.waveManager.reset();
        }
        
        this.updateUI();
    }
    
    showMessage(message, type = 'info') {
        // Use UI manager for notifications if available
        if (window.uiManager) {
            window.uiManager.showNotification(message, type);
        } else {
            // Fallback to console logging
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
    
    updateUI() {
        // Delegate to UI manager if available
        if (window.uiManager) {
            window.uiManager.updateAllUI();
        } else {
            // Fallback to direct UI updates
            document.getElementById('health').textContent = Math.max(0, this.playerHealth);
            document.getElementById('money').textContent = this.playerMoney;
            document.getElementById('wave').textContent = this.currentWave;
            document.getElementById('score').textContent = this.score;
            
            // Update tower shop availability
            const towerCosts = { basic: 125, cannon: 250, laser: 400, ice: 175 };
            document.querySelectorAll('.tower-item').forEach(item => {
                const towerType = item.dataset.tower;
                const cost = towerCosts[towerType];
                
                if (this.playerMoney >= cost) {
                    item.classList.remove('disabled');
                } else {
                    item.classList.add('disabled');
                }
            });
            
            // Update tower control buttons
            const sellBtn = document.getElementById('sellTowerBtn');
            const upgradeBtn = document.getElementById('upgradeTowerBtn');
            
            if (this.selectedTower) {
                sellBtn.disabled = false;
                upgradeBtn.disabled = !this.selectedTower.canUpgrade() || 
                                      this.playerMoney < this.selectedTower.getUpgradeCost();
            } else {
                sellBtn.disabled = true;
                upgradeBtn.disabled = true;
            }
        }
    }
    
    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        const adjustedDeltaTime = deltaTime * this.gameSpeed;
        
        // Update wave manager
        if (window.waveManager) {
            window.waveManager.update(adjustedDeltaTime);
        }
        
        // Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(adjustedDeltaTime, this.path);
            
            if (enemy.health <= 0) {
                this.addMoney(enemy.reward);
                this.enemies.splice(i, 1);
                this.spawnDeathParticles(enemy.x, enemy.y);
            } else if (enemy.reachedEnd) {
                this.takeDamage(enemy.damage);
                this.enemies.splice(i, 1);
            }
        }
        
        // Update towers
        for (let tower of this.towers) {
            tower.update(adjustedDeltaTime, this.enemies, this.projectiles);
        }
        
        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            projectile.update(adjustedDeltaTime, this.enemies);
            
            if (projectile.shouldRemove) {
                this.projectiles.splice(i, 1);
            }
        }
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update(adjustedDeltaTime);
            
            if (particle.shouldRemove) {
                this.particles.splice(i, 1);
            }
        }
        
        // Check victory condition
        this.checkVictory();
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background pattern
        this.drawBackground();
        
        // Draw path
        this.drawPath();
        
        // Draw towers
        for (let tower of this.towers) {
            tower.render(this.ctx);
        }
        
        // Draw selected tower range
        if (this.selectedTower) {
            this.drawTowerRange(this.selectedTower);
        }
        
        // Draw enemies
        for (let enemy of this.enemies) {
            enemy.render(this.ctx);
        }
        
        // Draw projectiles
        for (let projectile of this.projectiles) {
            projectile.render(this.ctx);
        }
        
        // Draw particles
        for (let particle of this.particles) {
            particle.render(this.ctx);
        }
        
        // Draw tower placement preview
        if (this.isPlacingTower && this.selectedTowerType) {
            this.drawTowerPlacementPreview();
        }
        
        // Draw tower tooltip
        if (this.hoveredTower && !this.isPlacingTower) {
            this.drawTowerTooltip(this.hoveredTower);
        }
        
        // Debug: Draw mouse cursor position (remove this later)
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        this.ctx.beginPath();
        this.ctx.arc(this.mouseX, this.mouseY, 5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw game state overlays
        if (this.gameState === 'paused') {
            this.drawPauseOverlay();
        }
    }
    
    drawBackground() {
        // Draw grass texture
        this.ctx.fillStyle = '#2c5234';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Add some texture
        this.ctx.fillStyle = 'rgba(34, 139, 34, 0.1)';
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            this.ctx.fillRect(x, y, 2, 2);
        }
    }
    
    drawPath() {
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 30;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.ctx.beginPath();
        for (let i = 0; i < this.path.length; i++) {
            if (i === 0) {
                this.ctx.moveTo(this.path[i].x, this.path[i].y);
            } else {
                this.ctx.lineTo(this.path[i].x, this.path[i].y);
            }
        }
        this.ctx.stroke();
        
        // Draw path border
        this.ctx.strokeStyle = '#654321';
        this.ctx.lineWidth = 34;
        this.ctx.stroke();
        
        // Draw path center
        this.ctx.strokeStyle = '#D2B48C';
        this.ctx.lineWidth = 26;
        this.ctx.stroke();
    }
    
    drawTowerRange(tower) {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        this.ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
    }
    
    drawTowerPlacementPreview() {
        if (!this.canPlaceTowerAt(this.mouseX, this.mouseY)) {
            this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
        } else {
            this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.7)';
            this.ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
        }
        
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        
        this.ctx.beginPath();
        this.ctx.arc(this.mouseX, this.mouseY, 25, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
    }
    
    drawPauseOverlay() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
    }
    
    spawnDeathParticles(x, y) {
        for (let i = 0; i < 8; i++) {
            const particle = new Particle(
                x + (Math.random() - 0.5) * 20,
                y + (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 100,
                (Math.random() - 0.5) * 100,
                '#ff4444',
                1000
            );
            this.particles.push(particle);
        }
    }
    
    gameLoop(currentTime) {
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(this.deltaTime);
        this.render();
        
        requestAnimationFrame(this.gameLoop);
    }
    
    start() {
        this.updateUI();
        requestAnimationFrame(this.gameLoop);
        console.log('Game started!');
    }
    
    drawTowerTooltip(tower) {
        const padding = 10;
        const lineHeight = 16;
        let lines = [
            `${tower.type.toUpperCase()} TOWER - Level ${tower.level}/${tower.maxLevel}`,
            `Damage: ${tower.damage} (Base: ${tower.baseDamage})`,
            `Range: ${tower.range} (Base: ${tower.baseRange})`,
            `Fire Rate: ${(1000/tower.fireRate).toFixed(1)}/sec`,
        ];
        
        if (tower.canUpgrade()) {
            lines.push('', `Upgrade Cost: $${tower.getUpgradeCost()}`);
            lines.push(`Next Level: +40% damage, +15% range`);
        } else {
            lines.push('', 'MAX LEVEL REACHED');
        }
        
        lines.push('', `Sell Value: $${tower.getSellValue()}`);
        
        // Calculate tooltip dimensions
        this.ctx.font = '12px Arial';
        const maxWidth = Math.max(...lines.map(line => this.ctx.measureText(line).width));
        const tooltipWidth = maxWidth + padding * 2;
        const tooltipHeight = lines.length * lineHeight + padding * 2;
        
        // Position tooltip near mouse
        let tooltipX = this.mouseX + 15;
        let tooltipY = this.mouseY - tooltipHeight - 15;
        
        // Keep tooltip on screen
        if (tooltipX + tooltipWidth > this.canvas.width) {
            tooltipX = this.mouseX - tooltipWidth - 15;
        }
        if (tooltipY < 0) {
            tooltipY = this.mouseY + 15;
        }
        
        // Draw tooltip background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
        
        // Draw tooltip border
        this.ctx.strokeStyle = tower.color;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
        
        // Draw tooltip text
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        
        lines.forEach((line, index) => {
            if (line.includes('Upgrade Cost') || line.includes('Next Level')) {
                this.ctx.fillStyle = '#ffd700';
            } else if (line.includes('MAX LEVEL')) {
                this.ctx.fillStyle = '#ff6666';
            } else if (line.includes('Sell Value')) {
                this.ctx.fillStyle = '#66ff66';
            } else {
                this.ctx.fillStyle = 'white';
            }
            
            this.ctx.fillText(line, tooltipX + padding, tooltipY + padding + (index + 1) * lineHeight);
        });
    }
}

// Particle class for visual effects
class Particle {
    constructor(x, y, vx, vy, color, lifetime) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.lifetime = lifetime;
        this.maxLifetime = lifetime;
        this.shouldRemove = false;
    }
    
    update(deltaTime) {
        this.x += this.vx * deltaTime / 1000;
        this.y += this.vy * deltaTime / 1000;
        this.lifetime -= deltaTime;
        
        if (this.lifetime <= 0) {
            this.shouldRemove = true;
        }
    }
    
    render(ctx) {
        const alpha = this.lifetime / this.maxLifetime;
        ctx.fillStyle = this.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
        
        const size = 4 * alpha;
        ctx.fillRect(this.x - size / 2, this.y - size / 2, size, size);
    }
}

// Initialize game when page loads
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new TowerDefenseGame();
    window.game = game; // Make it globally accessible
    
    // Start the game after all scripts are loaded
    setTimeout(() => {
        game.start();
    }, 100);
});