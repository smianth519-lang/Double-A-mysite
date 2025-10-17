// UI.js - User interface management and interactions
class UIManager {
    constructor() {
        this.selectedTowerType = null;
        this.selectedTower = null;
        this.isPlacingTower = false;
        this.tooltipVisible = false;
        this.notifications = [];
        this.maxNotifications = 5;
        
        // UI Elements
        this.elements = {
            health: document.getElementById('health'),
            money: document.getElementById('money'),
            wave: document.getElementById('wave'),
            score: document.getElementById('score'),
            startWaveBtn: document.getElementById('startWaveBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            speedBtn: document.getElementById('speedBtn'),
            sellTowerBtn: document.getElementById('sellTowerBtn'),
            upgradeTowerBtn: document.getElementById('upgradeTowerBtn'),
            restartBtn: document.getElementById('restartBtn'),
            gameMessage: document.getElementById('gameMessage'),
            pauseMenu: document.getElementById('pauseMenu'),
            resumeGameBtn: document.getElementById('resumeGameBtn'),
            pauseRestartBtn: document.getElementById('pauseRestartBtn'),
            backToGamesBtn: document.getElementById('backToGamesBtn'),
            exitToMenuBtn: document.getElementById('exitToMenuBtn'),
            startMenu: document.getElementById('startMenu'),
            startGameBtn: document.getElementById('startGameBtn'),
            instructionsBtn: document.getElementById('instructionsBtn'),
            backToGamesFromStartBtn: document.getElementById('backToGamesFromStartBtn'),
            instructionsMenu: document.getElementById('instructionsMenu'),
            startFromInstructionsBtn: document.getElementById('startFromInstructionsBtn'),
            backToStartMenuBtn: document.getElementById('backToStartMenuBtn')
        };
        
        // Initialize event listeners
        this.initializeEventListeners();
        
        console.log('UI Manager initialized');
    }
    
    initializeEventListeners() {
        // Tower shop interactions
        document.querySelectorAll('.tower-item').forEach(item => {
            item.addEventListener('mouseenter', (e) => this.showTowerTooltip(e, item.dataset.tower));
            item.addEventListener('mouseleave', () => this.hideTooltip());
            item.addEventListener('click', () => this.selectTowerType(item.dataset.tower));
        });
        
        // Game controls
        this.elements.startWaveBtn.addEventListener('click', () => this.startNextWave());
        this.elements.pauseBtn.addEventListener('click', () => this.togglePause());
        this.elements.speedBtn.addEventListener('click', () => this.changeGameSpeed());
        this.elements.sellTowerBtn.addEventListener('click', () => this.sellSelectedTower());
        this.elements.upgradeTowerBtn.addEventListener('click', () => this.upgradeSelectedTower());
        this.elements.restartBtn.addEventListener('click', () => this.restartGame());
        
        // Pause menu controls
        this.elements.resumeGameBtn.addEventListener('click', () => this.togglePause());
        this.elements.pauseRestartBtn.addEventListener('click', () => this.restartGame());
        this.elements.backToGamesBtn.addEventListener('click', () => this.backToGames());
        this.elements.exitToMenuBtn.addEventListener('click', () => this.exitToMainMenu());
        
        // Start menu controls
        this.elements.startGameBtn.addEventListener('click', () => this.startGame());
        this.elements.instructionsBtn.addEventListener('click', () => this.showInstructions());
        this.elements.backToGamesFromStartBtn.addEventListener('click', () => this.backToGames());
        
        // Instructions menu controls
        this.elements.startFromInstructionsBtn.addEventListener('click', () => this.startGame());
        this.elements.backToStartMenuBtn.addEventListener('click', () => this.showStartMenu());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Canvas interactions (handled in game.js but we can add UI feedback here)
        if (window.game && window.game.canvas) {
            window.game.canvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
        }
    }
    
    handleKeyboard(e) {
        if (!window.game) return;
        
        switch (e.key.toLowerCase()) {
            case ' ':
                e.preventDefault();
                this.togglePause();
                break;
            case 'escape':
                if (window.game.gameState === 'paused') {
                    e.preventDefault();
                    this.togglePause();
                } else if (window.game.isPlacingTower) {
                    window.game.cancelTowerPlacement();
                    this.updateTowerShop();
                }
                break;
            case '1':
                this.selectTowerType('basic');
                break;
            case '2':
                this.selectTowerType('cannon');
                break;
            case '3':
                this.selectTowerType('laser');
                break;
            case '4':
                this.selectTowerType('ice');
                break;
            case 's':
                if (window.game.selectedTower) {
                    this.sellSelectedTower();
                }
                break;
            case 'u':
                if (window.game.selectedTower) {
                    this.upgradeSelectedTower();
                }
                break;
            case 'enter':
                // Always allow starting new waves with Enter
                this.startNextWave();
                break;
        }
    }
    
    handleCanvasMouseMove(e) {
        if (!window.game) return;
        
        // Update cursor based on game state
        const canvas = window.game.canvas;
        
        if (window.game.isPlacingTower) {
            const canPlace = window.game.canPlaceTowerAt(window.game.mouseX, window.game.mouseY);
            canvas.style.cursor = canPlace ? 'crosshair' : 'not-allowed';
        } else {
            // Check if hovering over a tower
            let hoveringTower = false;
            for (let tower of window.game.towers) {
                const distance = Math.sqrt(
                    (window.game.mouseX - tower.x) ** 2 + 
                    (window.game.mouseY - tower.y) ** 2
                );
                if (distance < 30) {
                    hoveringTower = true;
                    break;
                }
            }
            canvas.style.cursor = hoveringTower ? 'pointer' : 'default';
        }
    }
    
    selectTowerType(towerType) {
        if (!window.game) return;
        
        const towerCosts = { basic: 125, cannon: 250, laser: 400, ice: 175 };
        const cost = towerCosts[towerType];
        
        if (window.game.playerMoney >= cost) {
            window.game.selectTowerType(towerType);
            this.updateTowerShop();
            this.showNotification(`Selected ${this.getTowerName(towerType)} ($${cost})`, 'info');
        } else {
            this.showNotification('Not enough money!', 'error');
            this.shakeMoney();
        }
    }
    
    getTowerName(towerType) {
        const names = {
            basic: 'Basic Tower',
            cannon: 'Cannon Tower',
            laser: 'Laser Tower',
            ice: 'Ice Tower'
        };
        return names[towerType] || 'Unknown Tower';
    }
    
    startNextWave() {
        if (!window.waveManager) return;
        
        // Always allow starting new waves - no restrictions!
        const success = window.waveManager.startWave(window.game.currentWave);
        if (success) {
            this.updateWaveButton();
            this.showNotification(`Wave ${window.game.currentWave} activated! (${window.waveManager.activeWaves.length} active)`, 'info');
        }
    }
    
    togglePause() {
        if (!window.game) return;
        
        if (window.game.gameState === 'playing') {
            window.game.gameState = 'paused';
            this.elements.pauseBtn.textContent = 'Resume';
            this.showPauseMenu();
        } else if (window.game.gameState === 'paused') {
            window.game.gameState = 'playing';
            this.elements.pauseBtn.textContent = 'Pause';
            this.hidePauseMenu();
        }
        
        console.log('Game paused state:', window.game.gameState);
    }
    
    changeGameSpeed() {
        if (!window.game) return;
        
        const speeds = [1, 2, 4];
        const currentIndex = speeds.indexOf(window.game.gameSpeed);
        window.game.gameSpeed = speeds[(currentIndex + 1) % speeds.length];
        this.elements.speedBtn.textContent = `Speed: ${window.game.gameSpeed}x`;
    }
    
    sellSelectedTower() {
        if (!window.game || !window.game.selectedTower) return;
        
        const tower = window.game.selectedTower;
        const sellPrice = tower.getSellPrice();
        
        window.game.sellSelectedTower();
        this.updateTowerControls();
        this.showNotification(`Tower sold for $${sellPrice}`, 'success');
    }
    
    upgradeSelectedTower() {
        if (!window.game || !window.game.selectedTower) return;
        
        const tower = window.game.selectedTower;
        const upgradeCost = tower.getUpgradeCost();
        
        if (window.game.playerMoney >= upgradeCost) {
            window.game.upgradeSelectedTower();
            this.updateTowerControls();
            this.showNotification(`Tower upgraded to Level ${tower.level}!`, 'success');
        } else {
            this.showNotification('Not enough money to upgrade!', 'error');
            this.shakeMoney();
        }
    }
    
    restartGame() {
        if (!window.game) return;
        
        // Hide pause menu if showing
        this.hidePauseMenu();
        this.hideGameMessage();
        
        window.game.restartGame();
        this.updateAllUI();
        this.showNotification('Game restarted', 'info');
    }
    
    updateAllUI() {
        this.updateStats();
        this.updateTowerShop();
        this.updateTowerControls();
        this.updateWaveButton();
        this.updatePauseButton();
        this.updateSpeedButton();
    }
    
    updateStats() {
        if (!window.game) return;
        
        this.elements.health.textContent = Math.max(0, window.game.playerHealth);
        this.elements.money.textContent = window.game.playerMoney;
        this.elements.wave.textContent = window.game.currentWave;
        this.elements.score.textContent = window.game.score;
        
        // Add visual feedback for low health
        if (window.game.playerHealth <= 20) {
            this.elements.health.classList.add('pulse');
            this.elements.health.style.color = '#ff4444';
        } else {
            this.elements.health.classList.remove('pulse');
            this.elements.health.style.color = '';
        }
    }
    
    updateTowerShop() {
        if (!window.game) return;
        
        const towerCosts = { basic: 125, cannon: 250, laser: 400, ice: 175 };
        
        document.querySelectorAll('.tower-item').forEach(item => {
            const towerType = item.dataset.tower;
            const cost = towerCosts[towerType];
            
            item.classList.remove('selected', 'disabled');
            
            if (window.game.playerMoney >= cost) {
                if (window.game.selectedTowerType === towerType) {
                    item.classList.add('selected');
                }
            } else {
                item.classList.add('disabled');
            }
        });
    }
    
    updateTowerControls() {
        if (!window.game) return;
        
        const tower = window.game.selectedTower;
        
        if (tower) {
            this.elements.sellTowerBtn.disabled = false;
            this.elements.sellTowerBtn.textContent = `Sell ($${tower.getSellValue()})`;
            
            if (tower.canUpgrade() && window.game.playerMoney >= tower.getUpgradeCost()) {
                this.elements.upgradeTowerBtn.disabled = false;
                this.elements.upgradeTowerBtn.textContent = `Upgrade Lv${tower.level}→${tower.level + 1} ($${tower.getUpgradeCost()})`;
            } else {
                this.elements.upgradeTowerBtn.disabled = true;
                this.elements.upgradeTowerBtn.textContent = tower.canUpgrade() ? 
                    `Upgrade Lv${tower.level}→${tower.level + 1} ($${tower.getUpgradeCost()})` : 'MAX LEVEL';
            }
        } else {
            this.elements.sellTowerBtn.disabled = true;
            this.elements.sellTowerBtn.textContent = 'Sell Tower';
            this.elements.upgradeTowerBtn.disabled = true;
            this.elements.upgradeTowerBtn.textContent = 'Upgrade Tower';
        }
    }
    
    updateWaveButton() {
        if (!window.waveManager) return;
        
        // Always enable the wave button for continuous activation
        this.elements.startWaveBtn.disabled = false;
        
        const activeWaves = window.waveManager.activeWaves.length;
        if (activeWaves > 0) {
            this.elements.startWaveBtn.textContent = `Start Wave ${window.game.currentWave} (${activeWaves} active)`;
        } else {
            this.elements.startWaveBtn.textContent = `Start Wave ${window.game.currentWave}`;
        }
    }
    
    updatePauseButton() {
        if (!window.game) return;
        
        this.elements.pauseBtn.textContent = window.game.gameState === 'paused' ? 'Resume' : 'Pause';
    }
    
    updateSpeedButton() {
        if (!window.game) return;
        
        this.elements.speedBtn.textContent = `Speed: ${window.game.gameSpeed}x`;
    }
    
    showTowerTooltip(e, towerType) {
        const towerInfo = TowerFactory.getTowerInfo(towerType);
        const cost = TowerFactory.getTowerCost(towerType);
        
        const tooltip = this.createTooltip(
            `<strong>${towerInfo.name}</strong><br>
             Cost: $${cost}<br>
             Damage: ${towerInfo.damage}<br>
             Range: ${towerInfo.range}<br>
             <em>${towerInfo.special}</em>`,
            e.clientX, e.clientY
        );
        
        document.body.appendChild(tooltip);
        this.tooltipVisible = true;
    }
    
    hideTooltip() {
        const tooltip = document.querySelector('.game-tooltip');
        if (tooltip) {
            tooltip.remove();
            this.tooltipVisible = false;
        }
    }
    
    createTooltip(content, x, y) {
        const tooltip = document.createElement('div');
        tooltip.className = 'game-tooltip';
        tooltip.innerHTML = content;
        
        tooltip.style.cssText = `
            position: fixed;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-size: 12px;
            z-index: 1000;
            pointer-events: none;
            border: 1px solid #444;
            max-width: 200px;
            left: ${x + 10}px;
            top: ${y - 10}px;
        `;
        
        return tooltip;
    }
    
    showNotification(message, type = 'info', duration = 3000) {
        const notification = this.createNotification(message, type);
        
        // Add to notifications array
        this.notifications.push(notification);
        
        // Remove oldest if too many
        if (this.notifications.length > this.maxNotifications) {
            const oldest = this.notifications.shift();
            if (oldest.element.parentNode) {
                oldest.element.remove();
            }
        }
        
        // Position notification
        this.positionNotifications();
        
        // Auto-remove after duration
        setTimeout(() => {
            this.removeNotification(notification);
        }, duration);
        
        return notification;
    }
    
    createNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        const colors = {
            info: '#4a90e2',
            success: '#2ecc71',
            error: '#e74c3c',
            warning: '#f39c12'
        };
        
        notification.style.cssText = `
            position: fixed;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 12px 20px;
            border-radius: 5px;
            font-weight: bold;
            z-index: 1001;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
            cursor: pointer;
        `;
        
        // Click to dismiss
        notification.addEventListener('click', () => {
            this.removeNotification({ element: notification });
        });
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 50);
        
        return { element: notification, message, type };
    }
    
    removeNotification(notification) {
        const index = this.notifications.indexOf(notification);
        if (index !== -1) {
            this.notifications.splice(index, 1);
        }
        
        if (notification.element.parentNode) {
            notification.element.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.element.parentNode) {
                    notification.element.remove();
                }
                this.positionNotifications();
            }, 300);
        }
    }
    
    positionNotifications() {
        this.notifications.forEach((notification, index) => {
            const topPosition = 80 + (index * 60);
            notification.element.style.top = `${topPosition}px`;
        });
    }
    
    shakeMoney() {
        this.elements.money.parentElement.classList.add('shake');
        setTimeout(() => {
            this.elements.money.parentElement.classList.remove('shake');
        }, 500);
    }
    
    showGameMessage(title, message, showRestart = false) {
        document.getElementById('messageTitle').textContent = title;
        document.getElementById('messageText').textContent = message;
        
        if (showRestart) {
            this.elements.restartBtn.style.display = 'block';
        } else {
            this.elements.restartBtn.style.display = 'none';
        }
        
        this.elements.gameMessage.classList.remove('hidden');
    }
    
    hideGameMessage() {
        this.elements.gameMessage.classList.add('hidden');
    }
    
    showPauseMenu() {
        if (!window.game) return;
        
        // Update pause menu stats
        document.getElementById('pauseWave').textContent = window.game.currentWave;
        document.getElementById('pauseScore').textContent = window.game.score;
        document.getElementById('pauseMoney').textContent = window.game.playerMoney;
        
        // Show pause menu
        this.elements.pauseMenu.classList.remove('hidden');
    }
    
    hidePauseMenu() {
        this.elements.pauseMenu.classList.add('hidden');
    }
    
    exitToMainMenu() {
        // For now, just restart the game since we don't have a main menu
        // In a full implementation, this would navigate back to a main menu screen
        this.showGameMessage(
            'Exit to Main Menu',
            'This would normally take you to the main menu. For now, restart the game.',
            true
        );
        this.hidePauseMenu();
    }
    
    backToGames() {
        // Navigate back to the games.html page
        window.location.href = '../games.html';
    }
    
    showStartMenu() {
        this.elements.startMenu.classList.remove('hidden');
        this.elements.instructionsMenu.classList.add('hidden');
        this.elements.pauseMenu.classList.add('hidden');
        this.elements.gameMessage.classList.add('hidden');
    }
    
    hideStartMenu() {
        this.elements.startMenu.classList.add('hidden');
    }
    
    showInstructions() {
        this.elements.instructionsMenu.classList.remove('hidden');
        this.elements.startMenu.classList.add('hidden');
    }
    
    hideInstructions() {
        this.elements.instructionsMenu.classList.add('hidden');
    }
    
    startGame() {
        if (!window.game) return;
        
        // Hide all menus
        this.hideStartMenu();
        this.hideInstructions();
        this.hidePauseMenu();
        this.hideGameMessage();
        
        // Reset and start the game
        if (window.game.gameState === 'menu') {
            window.game.gameState = 'playing';
            window.game.playerHealth = 100;
            window.game.playerMoney = 750;
            window.game.currentWave = 1;
            window.game.score = 0;
            window.game.gameSpeed = 1;
            
            window.game.enemies = [];
            window.game.towers = [];
            window.game.projectiles = [];
            window.game.particles = [];
            
            window.game.selectedTower = null;
            window.game.selectedTowerType = null;
            window.game.isPlacingTower = false;
            
            if (window.waveManager) {
                window.waveManager.reset();
            }
            
            this.updateAllUI();
            this.showNotification('Game Started! Place towers to defend your base.', 'info');
        }
    }
    
    renderWaveAnnouncement(ctx, announcement) {
        if (!announcement || Date.now() - announcement.startTime > announcement.duration) {
            return false;
        }
        
        const elapsed = Date.now() - announcement.startTime;
        const alpha = Math.min(1, 1 - (elapsed / announcement.duration));
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Background
        ctx.fillStyle = announcement.isSpecial ? 
            'rgba(255, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, ctx.canvas.width, 100);
        
        // Text
        ctx.fillStyle = 'white';
        ctx.font = announcement.isSpecial ? 
            'bold 36px Arial' : 'bold 24px Arial';
        ctx.textAlign = 'center';
        
        const y = announcement.isSpecial ? 40 : 35;
        ctx.fillText(announcement.message, ctx.canvas.width / 2, y);
        
        // Wave number
        if (!announcement.isSpecial) {
            ctx.font = '18px Arial';
            ctx.fillText(`Get Ready!`, ctx.canvas.width / 2, y + 30);
        }
        
        ctx.restore();
        return true;
    }
    
    // Debug functions
    showDebugInfo(ctx) {
        if (!window.game) return;
        
        const debug = [
            `FPS: ${Math.round(1000 / window.game.deltaTime)}`,
            `Enemies: ${window.game.enemies.length}`,
            `Towers: ${window.game.towers.length}`,
            `Projectiles: ${window.game.projectiles.length}`,
            `Particles: ${window.game.particles.length}`,
            `Game State: ${window.game.gameState}`,
            `Mouse: ${Math.round(window.game.mouseX)}, ${Math.round(window.game.mouseY)}`
        ];
        
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 200, debug.length * 20 + 10);
        
        ctx.fillStyle = 'white';
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        
        debug.forEach((line, index) => {
            ctx.fillText(line, 15, 30 + index * 20);
        });
        
        ctx.restore();
    }
}

// Initialize UI manager
let uiManager;
document.addEventListener('DOMContentLoaded', () => {
    uiManager = new UIManager();
    window.uiManager = uiManager;
    console.log('UI Manager ready');
});
