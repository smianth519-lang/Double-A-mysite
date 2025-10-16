// Towers.js - Tower classes and shooting mechanics
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
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(2, 2, baseSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Base
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, baseSize);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, this.darkenColor(this.color, 0.3));
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, baseSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Base outline (gets thicker with upgrades)
        ctx.strokeStyle = this.darkenColor(this.color, 0.5);
        ctx.lineWidth = 2 + (this.level - 1) * 0.5;
        ctx.stroke();
        
        // Upgrade glow effect for higher level towers
        if (this.level >= 3) {
            ctx.save();
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 10 + (this.level * 2);
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(0, 0, baseSize + 5, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.restore();
        }
    }
    
    renderTurret(ctx) {
        const turretLength = 30;
        const turretWidth = 12;
        
        switch (this.type) {
            case 'basic':
                // Simple barrel
                ctx.fillStyle = this.color;
                ctx.fillRect(0, -turretWidth / 2, turretLength, turretWidth);
                
                // Barrel end
                ctx.beginPath();
                ctx.arc(turretLength, 0, turretWidth / 2, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'cannon':
                // Thick cannon barrel
                const cannonWidth = 18;
                ctx.fillStyle = this.color;
                ctx.fillRect(0, -cannonWidth / 2, turretLength, cannonWidth);
                
                // Muzzle
                ctx.fillStyle = this.darkenColor(this.color, 0.3);
                ctx.fillRect(turretLength - 5, -cannonWidth / 2 + 2, 8, cannonWidth - 4);
                
                // Shoot animation
                if (this.shootAnimation > 0) {
                    ctx.fillStyle = '#ffaa00';
                    ctx.beginPath();
                    ctx.arc(turretLength + 10, 0, 8, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
                
            case 'laser':
                // Futuristic laser cannon
                ctx.fillStyle = this.color;
                
                // Main body
                ctx.fillRect(0, -turretWidth / 2, turretLength - 5, turretWidth);
                
                // Laser crystal
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(turretLength - 8, -4, 8, 8);
                
                // Energy glow
                if (this.shootAnimation > 0) {
                    ctx.fillStyle = '#ff00ff';
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = '#ff00ff';
                    ctx.fillRect(turretLength - 6, -2, 12, 4);
                    ctx.shadowBlur = 0;
                }
                break;
                
            case 'ice':
                // Ice crystal tower
                ctx.fillStyle = this.color;
                
                // Crystal shape
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(turretLength, -8);
                ctx.lineTo(turretLength + 8, 0);
                ctx.lineTo(turretLength, 8);
                ctx.closePath();
                ctx.fill();
                
                // Ice particles
                if (this.shootAnimation > 0) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                    for (let i = 0; i < 5; i++) {
                        const px = turretLength + Math.random() * 15;
                        const py = (Math.random() - 0.5) * 10;
                        ctx.fillRect(px, py, 2, 2);
                    }
                }
                break;
        }
        
        // Recoil animation
        if (this.shootAnimation > 0) {
            const recoil = (this.shootAnimation / 200) * 5;
            ctx.translate(-recoil, 0);
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