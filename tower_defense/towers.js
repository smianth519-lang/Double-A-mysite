class Tower {
    constructor(x, y, type = 'basic') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.level = 1;
        
        // Initialize tower properties based on type
        this.initializeTowerType();
        
        // Shooting properties
        this.lastShotTime = 0;
        this.target = null;
        this.angle = 0;
        
        // Animation properties
        this.shootAnimation = 0;
        this.rotationAnimation = 0;
        
        // Upgrade tracking
        this.totalCost = this.cost;
    }
    
    initializeTowerType() {
        const towerTypes = {
            basic: {
                damage: 20,
                range: 80,
                fireRate: 800, // milliseconds between shots
                projectileSpeed: 300,
                projectileType: 'bullet',
                color: '#4a90e2',
                cost: 125,
                upgradeCost: 75,
                maxLevel: 5
            },
            cannon: {
                damage: 50,
                range: 70,
                fireRate: 1500,
                projectileSpeed: 200,
                projectileType: 'cannonball',
                explosionRadius: 40,
                color: '#e74c3c',
                cost: 250,
                upgradeCost: 125,
                maxLevel: 4
            },
            laser: {
                damage: 35,
                range: 100,
                fireRate: 200,
                projectileSpeed: 800,
                projectileType: 'laser',
                color: '#9b59b6',
                cost: 400,
                upgradeCost: 200,
                maxLevel: 4
            },
            ice: {
                damage: 15,
                range: 75,
                fireRate: 1000,
                projectileSpeed: 250,
                projectileType: 'ice',
                slowAmount: 0.5,
                slowDuration: 2000,
                color: '#3498db',
                cost: 175,
                upgradeCost: 100,
                maxLevel: 5
            }
        };
        
        const towerData = towerTypes[this.type] || towerTypes.basic;
        
        this.baseDamage = towerData.damage;
        this.damage = this.baseDamage;
        this.baseRange = towerData.range;
        this.range = this.baseRange;
        this.baseFireRate = towerData.fireRate;
        this.fireRate = this.baseFireRate;
        this.projectileSpeed = towerData.projectileSpeed;
        this.projectileType = towerData.projectileType;
        this.explosionRadius = towerData.explosionRadius || 0;
        this.slowAmount = towerData.slowAmount || 0;
        this.slowDuration = towerData.slowDuration || 0;
        this.color = towerData.color;
        this.cost = towerData.cost;
        this.upgradeCost = towerData.upgradeCost;
        this.maxLevel = towerData.maxLevel;
    }
    
    canUpgrade() {
        return this.level < this.maxLevel;
    }
    
    getUpgradeCost() {
        if (!this.canUpgrade()) return 0;
        return Math.floor(this.upgradeCost * Math.pow(1.5, this.level - 1));
    }
    
    upgrade() {
        if (!this.canUpgrade()) return false;
        
        const cost = this.getUpgradeCost();
        if (window.game && window.game.money >= cost) {
            // Deduct cost
            window.game.money -= cost;
            this.totalCost += cost;
            
            // Increase level
            this.level++;
            
            // Apply upgrade bonuses
            this.applyUpgradeBonus();
            
            // Update UI
            if (window.game.ui) {
                window.game.ui.updateDisplay();
                window.game.showMessage(`Tower upgraded to Level ${this.level}!`, 'success');
            }
            
            return true;
        }
        return false;
    }
    
    applyUpgradeBonus() {
        const levelMultiplier = this.level;
        
        // Damage increases by 40% per level
        this.damage = Math.floor(this.baseDamage * (1 + (levelMultiplier - 1) * 0.4));
        
        // Range increases by 15% per level
        this.range = Math.floor(this.baseRange * (1 + (levelMultiplier - 1) * 0.15));
        
        // Fire rate improves by 20% per level (lower is faster)
        this.fireRate = Math.floor(this.baseFireRate * (1 - (levelMultiplier - 1) * 0.15));
        
        // Special bonuses per tower type
        switch (this.type) {
            case 'cannon':
                // Explosion radius increases
                if (this.explosionRadius) {
                    this.explosionRadius += 8 * (levelMultiplier - 1);
                }
                break;
            case 'laser':
                // Laser gets piercing ability at higher levels
                if (this.level >= 3) {
                    this.piercing = true;
                }
                break;
            case 'ice':
                // Slow effect becomes stronger
                if (this.slowAmount) {
                    this.slowAmount = Math.min(0.8, 0.5 + (levelMultiplier - 1) * 0.1);
                    this.slowDuration += 500 * (levelMultiplier - 1);
                }
                break;
        }
    }
    
    getSellValue() {
        return Math.floor(this.totalCost * 0.7); // 70% return on investment
    }
    
    sell() {
        if (window.game) {
            const sellValue = this.getSellValue();
            window.game.money += sellValue;
            if (window.game.ui) {
                window.game.ui.updateDisplay();
                window.game.showMessage(`Tower sold for $${sellValue}`, 'info');
            }
        }
    }
    
    update(deltaTime, enemies, projectiles) {
        // Find target
        this.findTarget(enemies);
        
        // Rotate towards target
        if (this.target) {
            const targetAngle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
            this.angle = this.lerp(this.angle, targetAngle, 0.1);
        }
        
        // Shoot at target
        if (this.canShoot() && this.target) {
            this.shoot(projectiles);
        }
        
        // Update animations
        if (this.shootAnimation > 0) {
            this.shootAnimation -= deltaTime;
        }
        
        this.rotationAnimation += deltaTime / 1000;
    }
    
    findTarget(enemies) {
        let closestEnemy = null;
        let closestDistance = Infinity;
        
        for (let enemy of enemies) {
            // Skip flying enemies for ground-only towers
            if (enemy.flying && this.type !== 'laser') {
                continue;
            }
            
            const distance = this.getDistanceTo(enemy.x, enemy.y);
            
            if (distance <= this.range) {
                // Prioritize enemies further along the path
                const priority = enemy.pathIndex + enemy.pathProgress;
                const adjustedDistance = distance - (priority * 10);
                
                if (adjustedDistance < closestDistance) {
                    closestDistance = adjustedDistance;
                    closestEnemy = enemy;
                }
            }
        }
        
        // Lose target if it's out of range or destroyed
        if (this.target && !enemies.includes(this.target)) {
            this.target = null;
        }
        
        if (this.target && this.getDistanceTo(this.target.x, this.target.y) > this.range) {
            this.target = null;
        }
        
        // Set new target
        if (closestEnemy) {
            this.target = closestEnemy;
        }
    }
    
    canShoot() {
        return Date.now() - this.lastShotTime > this.fireRate;
    }
    
    shoot(projectiles) {
        if (!this.target) return;
        
        this.lastShotTime = Date.now();
        this.shootAnimation = 200; // Animation duration
        
        // Lead the target for moving enemies
        const leadPosition = this.calculateLeadPosition(this.target);
        
        const projectile = new Projectile(
            this.x, 
            this.y, 
            leadPosition.x, 
            leadPosition.y,
            this.projectileType,
            this.damage,
            this.projectileSpeed,
            {
                explosionRadius: this.explosionRadius,
                slowAmount: this.slowAmount,
                slowDuration: this.slowDuration,
                tower: this
            }
        );
        
        projectiles.push(projectile);
        
        // Special effects for different tower types
        this.createMuzzleFlash();
    }
    
    calculateLeadPosition(target) {
        if (!target) return { x: this.x, y: this.y };
        
        // Simple predictive targeting
        const timeToHit = this.getDistanceTo(target.x, target.y) / this.projectileSpeed;
        const targetSpeed = target.speed * (1 - target.slowEffect * 0.7);
        
        // Predict where the target will be
        const futureX = target.x + Math.cos(target.direction) * targetSpeed * timeToHit / 1000;
        const futureY = target.y + Math.sin(target.direction) * targetSpeed * timeToHit / 1000;
        
        return { x: futureX, y: futureY };
    }
    
    createMuzzleFlash() {
        // This could create particle effects - for now just log
        // console.log(`${this.type} tower fired!`);
    }
    
    upgrade() {
        if (!this.canUpgrade()) return false;
        
        this.level++;
        this.totalCost += this.getUpgradeCost();
        
        // Improve stats based on level
        const improvementFactor = 1 + (this.level - 1) * 0.3;
        this.damage = Math.floor(this.baseDamage * improvementFactor);
        this.range = Math.floor(this.baseRange * (1 + (this.level - 1) * 0.15));
        this.fireRate = Math.floor(this.baseFireRate / (1 + (this.level - 1) * 0.2));
        
        return true;
    }
    
    canUpgrade() {
        return this.level < this.maxLevel;
    }
    
    getUpgradeCost() {
        return Math.floor(this.upgradeCost * Math.pow(1.5, this.level - 1));
    }
    
    getSellPrice() {
        return Math.floor(this.totalCost * 0.7);
    }
    
    getDistanceTo(x, y) {
        return Math.sqrt((this.x - x) ** 2 + (this.y - y) ** 2);
    }
    
    lerp(a, b, factor) {
        // Handle angle wrapping
        let diff = b - a;
        if (diff > Math.PI) diff -= Math.PI * 2;
        if (diff < -Math.PI) diff += Math.PI * 2;
        return a + diff * factor;
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Draw tower base
        this.renderBase(ctx);
        
        // Draw tower turret (rotated)
        ctx.save();
        ctx.rotate(this.angle);
        this.renderTurret(ctx);
        ctx.restore();
        
        // Draw upgrade indicators
        this.renderUpgradeIndicators(ctx);
        
        // Draw range if selected
        if (window.game && window.game.selectedTower === this) {
            this.renderRange(ctx);
        }
        
        ctx.restore();
    }
    
    renderBase(ctx) {
        const baseSize = 25;
        
        // Base shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.arc(3, 3, baseSize + 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Concrete foundation
        ctx.fillStyle = '#666666';
        ctx.beginPath();
        ctx.arc(0, 0, baseSize + 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Main turret base (octagonal for military look)
        ctx.fillStyle = this.darkenColor(this.color, 0.2);
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const x = Math.cos(angle) * baseSize;
            const y = Math.sin(angle) * baseSize;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        
        // Armored plating gradient
        const gradient = ctx.createRadialGradient(-5, -5, 0, 0, 0, baseSize);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.7, this.darkenColor(this.color, 0.1));
        gradient.addColorStop(1, this.darkenColor(this.color, 0.4));
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, baseSize - 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Rivets and details
        ctx.fillStyle = this.darkenColor(this.color, 0.6);
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI * 2) / 6;
            const x = Math.cos(angle) * (baseSize - 8);
            const y = Math.sin(angle) * (baseSize - 8);
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Central hub
        ctx.fillStyle = this.darkenColor(this.color, 0.3);
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Hub highlight
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(-2, -2, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Armor plating outline
        ctx.strokeStyle = this.darkenColor(this.color, 0.7);
        ctx.lineWidth = 2 + (this.level - 1) * 0.5;
        ctx.beginPath();
        ctx.arc(0, 0, baseSize - 2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Upgrade indicators on base
        for (let i = 0; i < this.level && i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5;
            const x = Math.cos(angle) * (baseSize - 5);
            const y = Math.sin(angle) * (baseSize - 5);
            
            ctx.fillStyle = '#ffd700';
            ctx.strokeStyle = '#b8860b';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        
        // Upgrade glow effect for higher level towers
        if (this.level >= 3) {
            ctx.save();
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 15 + (this.level * 3);
            ctx.globalAlpha = 0.4;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, baseSize + 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }
    
    renderTurret(ctx) {
        const turretLength = 45; // Increased from 30 for better visibility
        const turretWidth = 18;  // Increased from 12 for better visibility
        
        // Recoil animation
        if (this.shootAnimation > 0) {
            const recoil = (this.shootAnimation / 200) * 8; // Increased recoil effect
            ctx.translate(-recoil, 0);
        }
        
        switch (this.type) {
            case 'basic':
                this.renderBasicTurret(ctx, turretLength, turretWidth);
                break;
            case 'cannon':
                this.renderCannonTurret(ctx, turretLength, turretWidth);
                break;
            case 'laser':
                this.renderLaserTurret(ctx, turretLength, turretWidth);
                break;
            case 'ice':
                this.renderIceTurret(ctx, turretLength, turretWidth);
                break;
        }
    }
    
    renderBasicTurret(ctx, turretLength, turretWidth) {
        // Add glow effect for better visibility
        ctx.shadowColor = this.brightenColor(this.color, 0.4);
        ctx.shadowBlur = 10;
        
        // Turret mount (larger and more visible)
        ctx.fillStyle = this.darkenColor(this.color, 0.2);
        ctx.strokeStyle = this.brightenColor(this.color, 0.3);
        ctx.lineWidth = 2;
        ctx.fillRect(-12, -12, 24, 24);
        ctx.strokeRect(-12, -12, 24, 24);
        
        // Reset shadow for main elements
        ctx.shadowBlur = 0;
        
        // Main barrel assembly with gradient
        const barrelGradient = ctx.createLinearGradient(0, -turretWidth/2, 0, turretWidth/2);
        barrelGradient.addColorStop(0, this.brightenColor(this.color, 0.2));
        barrelGradient.addColorStop(0.5, this.color);
        barrelGradient.addColorStop(1, this.darkenColor(this.color, 0.2));
        
        ctx.fillStyle = barrelGradient;
        ctx.strokeStyle = this.darkenColor(this.color, 0.4);
        ctx.lineWidth = 2;
        ctx.fillRect(0, -turretWidth / 2, turretLength, turretWidth);
        ctx.strokeRect(0, -turretWidth / 2, turretLength, turretWidth);
        
        // Barrel reinforcement rings (more prominent)
        ctx.fillStyle = this.darkenColor(this.color, 0.3);
        ctx.strokeStyle = this.brightenColor(this.color, 0.2);
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            const x = 6 + i * 8;
            ctx.fillRect(x, -turretWidth / 2 - 2, 3, turretWidth + 4);
            ctx.strokeRect(x, -turretWidth / 2 - 2, 3, turretWidth + 4);
        }
        
        // Muzzle brake (more detailed)
        ctx.fillStyle = this.darkenColor(this.color, 0.4);
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 2;
        ctx.fillRect(turretLength - 4, -turretWidth / 2 - 3, 8, turretWidth + 6);
        ctx.strokeRect(turretLength - 4, -turretWidth / 2 - 3, 8, turretWidth + 6);
        
        // Barrel tip with bright interior
        ctx.fillStyle = '#222222';
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(turretLength, 0, turretWidth / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Inner barrel glow
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.arc(turretLength, 0, turretWidth / 2 - 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Muzzle flash
        if (this.shootAnimation > 0) {
            ctx.fillStyle = '#ffff00';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ff6600';
            ctx.beginPath();
            ctx.arc(turretLength + 8, 0, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        
        // Sight system
        ctx.strokeStyle = this.darkenColor(this.color, 0.6);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(5, -turretWidth / 2 - 3);
        ctx.lineTo(15, -turretWidth / 2 - 5);
        ctx.stroke();
    }
    
    renderCannonTurret(ctx, turretLength, turretWidth) {
        const cannonWidth = 18;
        
        // Heavy turret mount
        ctx.fillStyle = this.darkenColor(this.color, 0.3);
        ctx.fillRect(-12, -12, 24, 24);
        
        // Hydraulic supports
        ctx.fillStyle = '#555555';
        ctx.fillRect(-10, -6, 15, 4);
        ctx.fillRect(-10, 2, 15, 4);
        
        // Main cannon barrel
        ctx.fillStyle = this.color;
        ctx.fillRect(0, -cannonWidth / 2, turretLength, cannonWidth);
        
        // Breach assembly
        ctx.fillStyle = this.darkenColor(this.color, 0.2);
        ctx.fillRect(-8, -cannonWidth / 2 - 2, 12, cannonWidth + 4);
        
        // Barrel bands (structural reinforcement)
        ctx.fillStyle = '#444444';
        for (let i = 0; i < 4; i++) {
            const x = 5 + i * 6;
            ctx.fillRect(x, -cannonWidth / 2 - 3, 3, cannonWidth + 6);
        }
        
        // Muzzle compensator
        ctx.fillStyle = this.darkenColor(this.color, 0.5);
        ctx.fillRect(turretLength - 8, -cannonWidth / 2 - 4, 12, cannonWidth + 8);
        
        // Bore
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(turretLength, 0, cannonWidth / 2 - 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Muzzle blast
        if (this.shootAnimation > 0) {
            const blastIntensity = this.shootAnimation / 200;
            ctx.fillStyle = `rgba(255, 170, 0, ${blastIntensity})`;
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ff6600';
            ctx.beginPath();
            ctx.arc(turretLength + 15, 0, 12 * blastIntensity, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            // Smoke puffs
            ctx.fillStyle = 'rgba(100, 100, 100, 0.6)';
            for (let i = 0; i < 3; i++) {
                const smokeX = turretLength + 10 + i * 8;
                const smokeY = (Math.random() - 0.5) * 10;
                ctx.beginPath();
                ctx.arc(smokeX, smokeY, 4 + i * 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Range finder
        ctx.fillStyle = '#666666';
        ctx.fillRect(8, -cannonWidth / 2 - 8, 4, 6);
    }
    
    renderLaserTurret(ctx, turretLength, turretWidth) {
        // Advanced turret mount with tech details
        ctx.fillStyle = this.darkenColor(this.color, 0.2);
        ctx.fillRect(-10, -10, 20, 20);
        
        // Tech panels
        ctx.fillStyle = '#444444';
        ctx.fillRect(-8, -8, 6, 16);
        ctx.fillStyle = '#666666';
        ctx.fillRect(-7, -6, 4, 3);
        ctx.fillRect(-7, -1, 4, 3);
        ctx.fillRect(-7, 4, 4, 3);
        
        // Main laser housing
        ctx.fillStyle = this.color;
        ctx.fillRect(0, -turretWidth / 2, turretLength - 5, turretWidth);
        
        // Cooling vents
        ctx.fillStyle = this.darkenColor(this.color, 0.4);
        for (let i = 0; i < 5; i++) {
            const x = 5 + i * 4;
            ctx.fillRect(x, -turretWidth / 2 - 1, 1, turretWidth + 2);
        }
        
        // Energy conduits
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -turretWidth / 2 + 2);
        ctx.lineTo(turretLength - 8, -turretWidth / 2 + 2);
        ctx.moveTo(0, turretWidth / 2 - 2);
        ctx.lineTo(turretLength - 8, turretWidth / 2 - 2);
        ctx.stroke();
        
        // Laser crystal chamber
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(turretLength - 10, -6, 10, 12);
        
        // Crystal
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(turretLength - 8, -4, 6, 8);
        
        // Focusing lens
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(turretLength - 2, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Laser beam and energy effects
        if (this.shootAnimation > 0) {
            const beamIntensity = this.shootAnimation / 200;
            
            // Main laser beam
            ctx.strokeStyle = `rgba(255, 0, 255, ${beamIntensity})`;
            ctx.lineWidth = 4;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ff00ff';
            ctx.beginPath();
            ctx.moveTo(turretLength - 2, 0);
            ctx.lineTo(turretLength + 50, 0);
            ctx.stroke();
            ctx.shadowBlur = 0;
            
            // Energy buildup
            ctx.fillStyle = `rgba(255, 255, 255, ${beamIntensity})`;
            ctx.beginPath();
            ctx.arc(turretLength - 2, 0, 8 * beamIntensity, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Targeting system
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(10, -turretWidth / 2 - 4, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderIceTurret(ctx, turretLength, turretWidth) {
        // Crystalline base mount
        ctx.fillStyle = this.darkenColor(this.color, 0.3);
        
        // Hexagonal crystal base
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI * 2) / 6;
            const x = Math.cos(angle) * 10;
            const y = Math.sin(angle) * 10;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        
        // Main crystal launcher
        ctx.fillStyle = this.color;
        
        // Crystal formation shape
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(turretLength - 5, -10);
        ctx.lineTo(turretLength + 5, -5);
        ctx.lineTo(turretLength + 8, 0);
        ctx.lineTo(turretLength + 5, 5);
        ctx.lineTo(turretLength - 5, 10);
        ctx.closePath();
        ctx.fill();
        
        // Ice crystal details
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillRect(5, -3, turretLength - 10, 2);
        ctx.fillRect(5, 1, turretLength - 10, 2);
        
        // Frost accumulation
        ctx.fillStyle = 'rgba(200, 230, 255, 0.8)';
        for (let i = 0; i < 8; i++) {
            const x = 8 + Math.random() * (turretLength - 16);
            const y = (Math.random() - 0.5) * 8;
            const size = Math.random() * 2 + 1;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Ice projectile chamber
        ctx.fillStyle = 'rgba(100, 200, 255, 0.4)';
        ctx.fillRect(turretLength - 8, -4, 8, 8);
        
        // Ice particles and effects
        if (this.shootAnimation > 0) {
            const iceIntensity = this.shootAnimation / 200;
            
            // Ice cloud
            ctx.fillStyle = `rgba(200, 230, 255, ${iceIntensity * 0.8})`;
            ctx.beginPath();
            ctx.arc(turretLength + 10, 0, 12 * iceIntensity, 0, Math.PI * 2);
            ctx.fill();
            
            // Ice shards
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            for (let i = 0; i < 8; i++) {
                const shardX = turretLength + 8 + Math.random() * 20;
                const shardY = (Math.random() - 0.5) * 16;
                const angle = Math.random() * Math.PI * 2;
                
                ctx.save();
                ctx.translate(shardX, shardY);
                ctx.rotate(angle);
                ctx.fillRect(-1, -3, 2, 6);
                ctx.restore();
            }
        }
        
        // Freezing coils
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.8)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const spiralRadius = 3 + i;
            ctx.beginPath();
            for (let a = 0; a < Math.PI * 4; a += 0.1) {
                const x = 8 + (a / (Math.PI * 4)) * (turretLength - 16);
                const y = Math.sin(a * 2) * spiralRadius;
                if (a === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
    }
    
    renderUpgradeIndicators(ctx) {
        // Draw level indicators as stars around the tower
        for (let i = 0; i < this.level; i++) {
            const angle = (i * Math.PI * 2) / this.maxLevel;
            const x = Math.cos(angle) * 35;
            const y = Math.sin(angle) * 35;
            
            // Draw star shape for level indicators
            ctx.fillStyle = '#ffd700';
            ctx.strokeStyle = '#ff8800';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        
        // Draw level number in center
        if (this.level > 1) {
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.strokeText(this.level.toString(), 0, 5);
            ctx.fillText(this.level.toString(), 0, 5);
        }
        
        // Draw type indicator
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        
        const typeSymbols = {
            basic: '●',
            cannon: '▲',
            laser: '◆',
            ice: '❄'
        };
        
        ctx.strokeText(typeSymbols[this.type] || '●', 0, -30);
        ctx.fillText(typeSymbols[this.type] || '●', 0, -30);
    }
    
    renderRange(ctx) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        ctx.beginPath();
        ctx.arc(0, 0, this.range, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.setLineDash([]);
    }
    
    darkenColor(color, amount) {
        // Simple color darkening - converts hex to darker hex
        const hex = color.replace('#', '');
        const num = parseInt(hex, 16);
        const r = Math.max(0, Math.floor((num >> 16) * (1 - amount)));
        const g = Math.max(0, Math.floor(((num >> 8) & 0x00FF) * (1 - amount)));
        const b = Math.max(0, Math.floor((num & 0x0000FF) * (1 - amount)));
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    brightenColor(color, amount) {
        // Simple color brightening - converts hex to brighter hex
        const hex = color.replace('#', '');
        const num = parseInt(hex, 16);
        const r = Math.min(255, Math.floor((num >> 16) + (255 - (num >> 16)) * amount));
        const g = Math.min(255, Math.floor(((num >> 8) & 0x00FF) + (255 - ((num >> 8) & 0x00FF)) * amount));
        const b = Math.min(255, Math.floor((num & 0x0000FF) + (255 - (num & 0x0000FF)) * amount));
        return `rgb(${r}, ${g}, ${b})`;
    }
}

// Tower factory for creating different tower types
class TowerFactory {
    static createTower(type, x, y) {
        return new Tower(x, y, type);
    }
    
    static getTowerCost(type) {
        const costs = {
            basic: 125,
            cannon: 250,
            laser: 400,
            ice: 175
        };
        return costs[type] || 125;
    }
    
    static getTowerInfo(type) {
        const info = {
            basic: {
                name: 'Basic Tower',
                description: 'Reliable damage with good range',
                damage: '20',
                range: '80',
                special: 'Balanced stats'
            },
            cannon: {
                name: 'Cannon Tower',
                description: 'High damage with explosion',
                damage: '50',
                range: '70',
                special: 'Explosive damage'
            },
            laser: {
                name: 'Laser Tower',
                description: 'Fast firing with long range',
                damage: '35',
                range: '100',
                special: 'Hits flying enemies'
            },
            ice: {
                name: 'Ice Tower',
                description: 'Slows and damages enemies',
                damage: '15',
                range: '75',
                special: 'Slows enemies'
            }
        };
        return info[type] || info.basic;
    }
}

// Tower upgrade system
class TowerUpgradeSystem {
    static calculateUpgradeStats(tower) {
        const baseDamage = tower.baseDamage;
        const baseRange = tower.baseRange;
        const baseFireRate = tower.baseFireRate;
        
        const level = tower.level;
        const damageMultiplier = 1 + (level - 1) * 0.3;
        const rangeMultiplier = 1 + (level - 1) * 0.15;
        const fireRateMultiplier = 1 + (level - 1) * 0.2;
        
        return {
            damage: Math.floor(baseDamage * damageMultiplier),
            range: Math.floor(baseRange * rangeMultiplier),
            fireRate: Math.floor(baseFireRate / fireRateMultiplier)
        };
    }
    
    static getUpgradePreview(tower) {
        if (!tower.canUpgrade()) return null;
        
        const currentStats = {
            damage: tower.damage,
            range: tower.range,
            fireRate: tower.fireRate
        };
        
        const upgradedStats = this.calculateUpgradeStats({
            ...tower,
            level: tower.level + 1
        });
        
        return {
            cost: tower.getUpgradeCost(),
            currentStats,
            upgradedStats,
            improvements: {
                damage: upgradedStats.damage - currentStats.damage,
                range: upgradedStats.range - currentStats.range,
                fireRate: currentStats.fireRate - upgradedStats.fireRate
            }
        };
    }
}

// Make classes globally available
window.Tower = Tower;
window.TowerFactory = TowerFactory;
window.TowerUpgradeSystem = TowerUpgradeSystem;
