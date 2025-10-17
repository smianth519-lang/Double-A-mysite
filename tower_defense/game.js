class TowerDefenseGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.gameState = 'menu'; // menu, playing, paused, gameOver, victory
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
        
        // Setup responsive canvas for mobile
        this.setupResponsiveCanvas();
        
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
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        
        // Tower shop events
        document.querySelectorAll('.tower-item').forEach(item => {
            item.addEventListener('click', () => this.selectTowerType(item.dataset.tower));
            item.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.selectTowerType(item.dataset.tower);
            });
        });
        
        // Control buttons (UI manager will handle these)
        // Removed duplicate event listeners - UI manager handles all button interactions
        
        // Prevent zoom on double tap
        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        });
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
    
    // Touch event handlers for mobile support
    handleTouchStart(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.handleTouchMove(e); // Update position
            this.lastTouchTime = Date.now();
        }
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            
            // Account for canvas scaling
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            
            this.mouseX = (touch.clientX - rect.left) * scaleX;
            this.mouseY = (touch.clientY - rect.top) * scaleY;
            
            // Find hovered tower for tooltip
            this.hoveredTower = null;
            for (const tower of this.towers) {
                const distance = Math.sqrt(
                    Math.pow(this.mouseX - tower.x, 2) + 
                    Math.pow(this.mouseY - tower.y, 2)
                );
                if (distance <= 30) {
                    this.hoveredTower = tower;
                    break;
                }
            }
        }
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        if (this.gameState !== 'playing') return;
        
        const touchDuration = Date.now() - (this.lastTouchTime || 0);
        
        // Only trigger on short taps (not drags)
        if (touchDuration < 300) {
            if (this.isPlacingTower && this.selectedTowerType) {
                this.placeTower(this.mouseX, this.mouseY);
            } else {
                this.selectTowerAtPosition(this.mouseX, this.mouseY);
            }
        }
        
        // Handle long press for tower deselection (similar to right-click)
        if (touchDuration > 500) {
            this.cancelTowerPlacement();
        }
    }
    
    setupResponsiveCanvas() {
        // Set up responsive canvas behavior
        const resizeCanvas = () => {
            const container = document.getElementById('gameCanvasContainer');
            if (!container) return;
            
            const containerRect = container.getBoundingClientRect();
            const aspectRatio = 1000 / 600; // Original canvas aspect ratio
            
            if (window.innerWidth <= 768) {
                // Mobile: make canvas fit container width
                const maxWidth = Math.min(containerRect.width - 20, window.innerWidth - 20);
                const newHeight = maxWidth / aspectRatio;
                
                this.canvas.style.width = maxWidth + 'px';
                this.canvas.style.height = newHeight + 'px';
                this.canvas.style.maxWidth = '100%';
            } else {
                // Desktop: use fixed size
                this.canvas.style.width = '1000px';
                this.canvas.style.height = '600px';
            }
        };
        
        // Initial resize
        resizeCanvas();
        
        // Resize on window resize
        window.addEventListener('resize', resizeCanvas);
        
        // Resize on orientation change (mobile)
        window.addEventListener('orientationchange', () => {
            setTimeout(resizeCanvas, 100);
        });
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
        this.gameState = 'menu';
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
        
        // Show start menu instead of immediately starting
        if (window.uiManager) {
            window.uiManager.showStartMenu();
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
        
        // Draw game state overlays (pause menu handled by UI manager now)
        // Removed simple pause overlay - now using proper pause menu
    }
    
    drawBackground() {
        // Base terrain gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#4a5d3a');    // Darker forest green at top
        gradient.addColorStop(0.3, '#3d4f2f');  // Medium green
        gradient.addColorStop(0.7, '#2c3e22');  // Darker terrain
        gradient.addColorStop(1, '#1a2515');    // Very dark at bottom
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw battlefield decorations
        this.drawMountains();
        this.drawTrees();
        this.drawRocks();
        this.drawBunkers();
        this.drawCraters();
        this.drawGrass();
        this.drawClouds();
        this.drawWarAmbience();
    }
    
    drawMountains() {
        // Distant mountains silhouette
        this.ctx.fillStyle = 'rgba(60, 80, 50, 0.6)';
        this.ctx.beginPath();
        this.ctx.moveTo(0, 120);
        
        // Create mountain peaks
        for (let i = 0; i <= this.canvas.width; i += 60) {
            const peakHeight = 80 + Math.sin(i * 0.01) * 30;
            this.ctx.lineTo(i + 30, peakHeight);
            this.ctx.lineTo(i + 60, 120);
        }
        
        this.ctx.lineTo(this.canvas.width, 120);
        this.ctx.lineTo(this.canvas.width, 0);
        this.ctx.lineTo(0, 0);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawTrees() {
        // Scattered trees around the battlefield
        const treePositions = [
            {x: 80, y: 200, size: 1.2},
            {x: 200, y: 100, size: 0.8},
            {x: 320, y: 180, size: 1.0},
            {x: 500, y: 120, size: 1.5},
            {x: 720, y: 160, size: 0.9},
            {x: 850, y: 90, size: 1.1},
            {x: 950, y: 200, size: 1.3},
            {x: 50, y: 400, size: 0.7},
            {x: 300, y: 450, size: 1.0},
            {x: 600, y: 480, size: 0.8},
            {x: 900, y: 420, size: 1.2}
        ];
        
        treePositions.forEach(tree => {
            this.drawSingleTree(tree.x, tree.y, tree.size);
        });
    }
    
    drawSingleTree(x, y, scale = 1) {
        const baseSize = 20 * scale;
        
        // Tree trunk
        this.ctx.fillStyle = '#4a3c28';
        this.ctx.fillRect(x - 3 * scale, y, 6 * scale, 25 * scale);
        
        // Tree foliage (multiple layers for depth)
        this.ctx.fillStyle = '#1a4a1a';
        this.ctx.beginPath();
        this.ctx.arc(x, y - 5 * scale, baseSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#2d5a2d';
        this.ctx.beginPath();
        this.ctx.arc(x - 5 * scale, y - 8 * scale, baseSize * 0.8, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#0f2f0f';
        this.ctx.beginPath();
        this.ctx.arc(x + 5 * scale, y - 8 * scale, baseSize * 0.7, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawRocks() {
        // Scattered rocks and boulders
        const rockPositions = [
            {x: 150, y: 300, size: 1.0},
            {x: 400, y: 250, size: 1.5},
            {x: 600, y: 350, size: 0.8},
            {x: 750, y: 300, size: 1.2},
            {x: 100, y: 500, size: 0.9},
            {x: 550, y: 520, size: 1.1},
            {x: 800, y: 480, size: 0.7}
        ];
        
        rockPositions.forEach(rock => {
            this.drawSingleRock(rock.x, rock.y, rock.size);
        });
    }
    
    drawSingleRock(x, y, scale = 1) {
        // Rock shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(x + 2, y + 15 * scale, 12 * scale, 6 * scale, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Main rock
        this.ctx.fillStyle = '#666666';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, 10 * scale, 12 * scale, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Rock highlight
        this.ctx.fillStyle = '#888888';
        this.ctx.beginPath();
        this.ctx.ellipse(x - 3 * scale, y - 4 * scale, 4 * scale, 5 * scale, 0, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawBunkers() {
        // Military bunkers/fortifications
        const bunkerPositions = [
            {x: 120, y: 350, type: 'small'},
            {x: 450, y: 400, type: 'large'},
            {x: 780, y: 380, type: 'small'},
            {x: 250, y: 150, type: 'small'}
        ];
        
        bunkerPositions.forEach(bunker => {
            this.drawSingleBunker(bunker.x, bunker.y, bunker.type);
        });
    }
    
    drawSingleBunker(x, y, type = 'small') {
        const size = type === 'large' ? 1.5 : 1.0;
        
        // Bunker shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctx.fillRect(x + 2, y + 2, 30 * size, 20 * size);
        
        // Main bunker structure
        this.ctx.fillStyle = '#555555';
        this.ctx.fillRect(x, y, 30 * size, 20 * size);
        
        // Bunker entrance
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(x + 5 * size, y + 5 * size, 8 * size, 10 * size);
        
        // Camouflage netting
        this.ctx.strokeStyle = 'rgba(100, 120, 80, 0.6)';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x + i * 6 * size, y - 2);
            this.ctx.lineTo(x + (i + 1) * 6 * size, y + 5);
            this.ctx.stroke();
        }
        
        // Sandbags
        this.ctx.fillStyle = '#8B7355';
        for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.arc(x - 5 + i * 8, y + 18 * size, 4, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawCraters() {
        // Battle damage craters
        const craterPositions = [
            {x: 180, y: 280, size: 0.8},
            {x: 350, y: 320, size: 1.2},
            {x: 650, y: 280, size: 1.0},
            {x: 820, y: 320, size: 0.9},
            {x: 480, y: 180, size: 0.6}
        ];
        
        craterPositions.forEach(crater => {
            this.drawSingleCrater(crater.x, crater.y, crater.size);
        });
    }
    
    drawSingleCrater(x, y, scale = 1) {
        // Crater rim (raised earth)
        this.ctx.fillStyle = '#4a3c28';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 18 * scale, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Crater depression
        this.ctx.fillStyle = '#2a1f15';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 12 * scale, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Crater center (deep)
        this.ctx.fillStyle = '#1a120a';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 6 * scale, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Scattered debris
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const distance = 15 + Math.random() * 10;
            const debrisX = x + Math.cos(angle) * distance * scale;
            const debrisY = y + Math.sin(angle) * distance * scale;
            
            this.ctx.fillStyle = '#666666';
            this.ctx.fillRect(debrisX, debrisY, 2 * scale, 2 * scale);
        }
    }
    
    drawGrass() {
        // Grass patches and vegetation
        this.ctx.fillStyle = 'rgba(34, 139, 34, 0.3)';
        
        // Random grass patches
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const size = Math.random() * 3 + 1;
            
            // Avoid drawing grass on the path
            let onPath = false;
            for (let j = 0; j < this.path.length - 1; j++) {
                const pathX = this.path[j].x;
                const pathY = this.path[j].y;
                const distance = Math.sqrt((x - pathX) ** 2 + (y - pathY) ** 2);
                if (distance < 20) {
                    onPath = true;
                    break;
                }
            }
            
            if (!onPath) {
                this.ctx.fillRect(x, y, size, size);
            }
        }
        
        // Grass tufts
        this.ctx.strokeStyle = 'rgba(50, 150, 50, 0.4)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            
            // Check if not on path
            let onPath = false;
            for (let j = 0; j < this.path.length - 1; j++) {
                const pathX = this.path[j].x;
                const pathY = this.path[j].y;
                const distance = Math.sqrt((x - pathX) ** 2 + (y - pathY) ** 2);
                if (distance < 25) {
                    onPath = true;
                    break;
                }
            }
            
            if (!onPath) {
                this.ctx.beginPath();
                this.ctx.moveTo(x, y);
                this.ctx.lineTo(x + Math.random() * 4 - 2, y - Math.random() * 6 - 2);
                this.ctx.stroke();
            }
        }
    }
    
    drawClouds() {
        // Sky clouds for atmosphere
        const clouds = [
            {x: 100, y: 40, size: 1.0},
            {x: 300, y: 20, size: 1.5},
            {x: 600, y: 35, size: 0.8},
            {x: 850, y: 15, size: 1.2}
        ];
        
        clouds.forEach(cloud => {
            this.drawSingleCloud(cloud.x, cloud.y, cloud.size);
        });
    }
    
    drawSingleCloud(x, y, scale = 1) {
        this.ctx.fillStyle = 'rgba(220, 220, 220, 0.4)';
        
        // Cloud puffs
        const puffs = [
            {offsetX: 0, offsetY: 0, size: 15},
            {offsetX: 20, offsetY: -5, size: 20},
            {offsetX: 40, offsetY: 0, size: 18},
            {offsetX: 60, offsetY: -3, size: 15},
            {offsetX: 15, offsetY: 8, size: 12},
            {offsetX: 35, offsetY: 10, size: 14}
        ];
        
        puffs.forEach(puff => {
            this.ctx.beginPath();
            this.ctx.arc(
                x + puff.offsetX * scale, 
                y + puff.offsetY * scale, 
                puff.size * scale, 
                0, 
                Math.PI * 2
            );
            this.ctx.fill();
        });
    }
    
    drawWarAmbience() {
        // Add subtle war atmosphere effects
        
        // Distant smoke columns
        this.ctx.fillStyle = 'rgba(100, 100, 100, 0.2)';
        for (let i = 0; i < 3; i++) {
            const x = 200 + i * 300;
            const smokeHeight = 80 + Math.sin(Date.now() * 0.001 + i) * 10;
            
            this.ctx.beginPath();
            this.ctx.moveTo(x, smokeHeight);
            this.ctx.quadraticCurveTo(x + 15, smokeHeight - 30, x + 10, smokeHeight - 60);
            this.ctx.quadraticCurveTo(x - 10, smokeHeight - 90, x + 5, 0);
            this.ctx.lineTo(x - 5, 0);
            this.ctx.quadraticCurveTo(x - 15, smokeHeight - 90, x - 5, smokeHeight - 60);
            this.ctx.quadraticCurveTo(x - 10, smokeHeight - 30, x - 10, smokeHeight);
            this.ctx.closePath();
            this.ctx.fill();
        }
        
        // Atmospheric particles (dust, debris)
        this.ctx.fillStyle = 'rgba(139, 128, 109, 0.15)';
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height * 0.7; // Upper portion of screen
            const size = Math.random() * 2 + 0.5;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
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
        this.gameState = 'menu'; // Start in menu state
        this.updateUI();
        requestAnimationFrame(this.gameLoop);
        
        // Show start menu when game loads
        setTimeout(() => {
            if (window.uiManager) {
                window.uiManager.showStartMenu();
            }
        }, 100);
        
        console.log('Game started - showing start menu!');
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



