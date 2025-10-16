// Enemies.js - Enemy classes and behavior
class Enemy {
    constructor(x, y, type = 'basic', waveLevel = 1) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.waveLevel = waveLevel;
        
        // Initialize enemy properties based on type
        this.initializeEnemyType();
        
        // Movement properties
        this.pathIndex = 0;
        this.pathProgress = 0;
        this.direction = 0;
        this.reachedEnd = false;
        
        // Status effects
        this.slowEffect = 0; // 0 to 1, where 1 is fully slowed
        this.slowDuration = 0;
        this.freezeEffect = false;
        this.freezeDuration = 0;
        
        // Visual properties
        this.animationFrame = 0;
        this.hitFlash = 0;
    }
    
    initializeEnemyType() {
        const enemyTypes = {
            basic: {
                maxHealth: 150,
                speed: 30, // Start very slow
                reward: 5,
                damage: 4,
                color: '#ff4444',
                size: 12
            },
            fast: {
                maxHealth: 180,
                speed: 45, // Faster but still slow initially
                reward: 5,
                damage: 3,
                color: '#44ff44',
                size: 10
            },
            heavy: {
                maxHealth: 400,
                speed: 20, // Very slow tank
                reward: 10,
                damage: 8,
                color: '#4444ff',
                size: 18
            },
            armored: {
                maxHealth: 400,
                speed: 25, // Slow armored unit
                reward: 15,
                damage: 5,
                color: '#ffaa44',
                size: 15,
                armor: 0.75 // Reduces damage by 75%
            },
            flying: {
                maxHealth: 120,
                speed: 40, // Flying but starts slow
                reward: 10,
                damage: 4,
                color: '#ff44ff',
                size: 11,
                flying: true
            },
            boss: {
                maxHealth: 2500,
                speed: 15, // Bosses start very slow but get terrifying
                reward: 50,
                damage: 15,
                color: '#ff0000',
                size: 25,
                boss: true
            },
            ultra: {
                maxHealth: 500,
                speed: 35, // Powerful but manageable early on
                reward: 30,
                damage: 10,
                color: '#800080',
                size: 20,
                armor: 0.5,
                regeneration: 2 // Heals 2 HP per second
            },
            swarm: {
                maxHealth: 80,
                speed: 50, // Fast but not overwhelming initially
                reward: 25,
                damage: 3,
                color: '#ffff00',
                size: 8,
                swarm: true // Spawns in groups
            },
            shielded: {
                maxHealth: 350,
                speed: 28, // Shielded enemies start slow
                reward: 40,
                damage: 6,
                color: '#00ffff',
                size: 16,
                shield: 200, // Shield absorbs damage before health
                shieldRegenRate: 1, // Shield regenerates 1 point per second
                shieldRegenDelay: 3000 // 3 seconds after last hit before regen starts
            }
        };
        
        const enemyData = enemyTypes[this.type] || enemyTypes.basic;
        
        this.maxHealth = enemyData.maxHealth;
        this.health = this.maxHealth;
        this.baseSpeed = enemyData.speed; // Store base speed
        this.speed = this.calculateWaveScaledSpeed(enemyData.speed);
        this.reward = enemyData.reward;
        this.damage = enemyData.damage;
        this.color = enemyData.color;
        this.size = enemyData.size;
        this.armor = enemyData.armor || 0;
        this.flying = enemyData.flying || false;
        this.boss = enemyData.boss || false;
        this.regeneration = enemyData.regeneration || 0;
        this.swarm = enemyData.swarm || false;
        this.lastRegenTime = Date.now();
        
        // Shield properties
        this.maxShield = enemyData.shield || 0;
        this.shield = this.maxShield;
        this.shieldRegenRate = enemyData.shieldRegenRate || 0;
        this.shieldRegenDelay = enemyData.shieldRegenDelay || 0;
        this.lastHitTime = 0;
    }
    
    calculateWaveScaledSpeed(baseSpeed) {
        // Progressive speed scaling: enemies get faster each wave
        // Wave 1: 1.0x speed (base)
        // Wave 5: 2.0x speed 
        // Wave 10: 3.5x speed
        // Wave 15: 5.5x speed
        // Wave 20: 8.0x speed (maximum terror)
        
        const speedMultiplier = Math.min(8.0, 1 + (this.waveLevel - 1) * 0.25 + Math.pow(Math.max(0, this.waveLevel - 5), 1.5) * 0.1);
        const scaledSpeed = Math.floor(baseSpeed * speedMultiplier);
        
        // Ensure minimum speeds for playability
        return Math.max(10, scaledSpeed);
    }
    
    update(deltaTime, path) {
        if (this.reachedEnd) return;
        
        // Update status effects
        this.updateStatusEffects(deltaTime);
        
        // Handle regeneration for ultra enemies
        if (this.regeneration > 0) {
            const currentTime = Date.now();
            if (currentTime - this.lastRegenTime >= 1000) { // Regenerate every second
                this.health = Math.min(this.maxHealth, this.health + this.regeneration);
                this.lastRegenTime = currentTime;
            }
        }
        
        // Handle shield regeneration
        if (this.maxShield > 0 && this.shield < this.maxShield) {
            const currentTime = Date.now();
            if (currentTime - this.lastHitTime >= this.shieldRegenDelay) {
                // Start shield regeneration after delay
                this.shield = Math.min(this.maxShield, this.shield + (this.shieldRegenRate * deltaTime / 1000));
            }
        }
        
        // Calculate effective speed with slow effect
        let effectiveSpeed = this.speed * (1 - this.slowEffect * 0.7);
        
        // Don't move if frozen
        if (this.freezeEffect) {
            effectiveSpeed = 0;
        }
        
        // Move along path
        this.moveAlongPath(path, effectiveSpeed, deltaTime);
        
        // Update animation
        this.animationFrame += deltaTime / 100;
        
        // Update hit flash
        if (this.hitFlash > 0) {
            this.hitFlash -= deltaTime;
        }
    }
    
    updateStatusEffects(deltaTime) {
        // Update slow effect
        if (this.slowDuration > 0) {
            this.slowDuration -= deltaTime;
            if (this.slowDuration <= 0) {
                this.slowEffect = 0;
            }
        }
        
        // Update freeze effect
        if (this.freezeDuration > 0) {
            this.freezeDuration -= deltaTime;
            if (this.freezeDuration <= 0) {
                this.freezeEffect = false;
            }
        }
    }
    
    moveAlongPath(path, speed, deltaTime) {
        if (this.pathIndex >= path.length - 1) {
            this.reachedEnd = true;
            return;
        }
        
        const currentPoint = path[this.pathIndex];
        const nextPoint = path[this.pathIndex + 1];
        
        // Calculate direction
        const dx = nextPoint.x - currentPoint.x;
        const dy = nextPoint.y - currentPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) {
            this.pathIndex++;
            return;
        }
        
        // Move towards next point
        const moveDistance = speed * (deltaTime / 1000);
        this.pathProgress += moveDistance / distance;
        
        // Check if reached next waypoint
        if (this.pathProgress >= 1) {
            this.pathProgress = 0;
            this.pathIndex++;
            
            if (this.pathIndex >= path.length - 1) {
                this.reachedEnd = true;
                return;
            }
        }
        
        // Update position
        const progress = this.pathProgress;
        this.x = currentPoint.x + (nextPoint.x - currentPoint.x) * progress;
        this.y = currentPoint.y + (nextPoint.y - currentPoint.y) * progress;
        
        // Update direction for rendering
        this.direction = Math.atan2(dy, dx);
    }
    
    takeDamage(damage, damageType = 'normal') {
        // Record hit time for shield regeneration
        this.lastHitTime = Date.now();
        
        // Apply armor reduction
        let actualDamage = damage * (1 - this.armor);
        
        // Special damage type modifiers
        if (damageType === 'explosive' && this.type === 'heavy') {
            actualDamage *= 1.5; // Heavy enemies take more explosive damage
        } else if (damageType === 'laser' && this.type === 'armored') {
            actualDamage *= 1.3; // Laser bypasses some armor
        } else if (damageType === 'ice' && this.type === 'fast') {
            actualDamage *= 1.2; // Fast enemies are more susceptible to ice
        }
        
        // Handle shield damage first
        if (this.shield > 0) {
            if (actualDamage >= this.shield) {
                // Damage breaks through shield
                actualDamage -= this.shield;
                this.shield = 0;
                this.health -= actualDamage;
            } else {
                // Shield absorbs all damage
                this.shield -= actualDamage;
                actualDamage = 0;
            }
        } else {
            // No shield, damage goes directly to health
            this.health -= actualDamage;
        }
        
        this.hitFlash = 200; // Flash red for 200ms
        
        return this.health <= 0; // Return true if enemy died
    }
    
    applySlow(slowAmount, duration) {
        this.slowEffect = Math.max(this.slowEffect, slowAmount);
        this.slowDuration = Math.max(this.slowDuration, duration);
    }
    
    applyFreeze(duration) {
        if (!this.boss) { // Bosses are immune to freeze
            this.freezeEffect = true;
            this.freezeDuration = Math.max(this.freezeDuration, duration);
        }
    }
    
    getDistanceTo(x, y) {
        return Math.sqrt((this.x - x) ** 2 + (this.y - y) ** 2);
    }
    
    render(ctx) {
        ctx.save();
        
        // Draw status effect auras
        this.renderStatusEffects(ctx);
        
        // Main body
        ctx.translate(this.x, this.y);
        
        // Apply hit flash
        if (this.hitFlash > 0) {
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        } else {
            ctx.fillStyle = this.color;
        }
        
        // Draw enemy based on type
        this.renderEnemyShape(ctx);
        
        // Draw health bar
        this.renderHealthBar(ctx);
        
        // Draw shield bar
        this.renderShieldBar(ctx);
        
        // Draw special indicators
        this.renderSpecialIndicators(ctx);
        
        ctx.restore();
    }
    
    renderStatusEffects(ctx) {
        // Slow effect aura
        if (this.slowEffect > 0) {
            ctx.strokeStyle = `rgba(0, 150, 255, ${this.slowEffect * 0.5})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Freeze effect aura
        if (this.freezeEffect) {
            ctx.strokeStyle = 'rgba(150, 200, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
    
    renderEnemyShape(ctx) {
        const animOffset = Math.sin(this.animationFrame / 200) * 2;
        
        switch (this.type) {
            case 'basic':
                ctx.beginPath();
                ctx.arc(0, animOffset, this.size, 0, Math.PI * 2);
                ctx.fill();
                
                // Eyes
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(-4, animOffset - 3, 2, 0, Math.PI * 2);
                ctx.arc(4, animOffset - 3, 2, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'fast':
                // Triangle shape
                ctx.beginPath();
                ctx.moveTo(this.size, animOffset);
                ctx.lineTo(-this.size, animOffset - this.size / 2);
                ctx.lineTo(-this.size, animOffset + this.size / 2);
                ctx.closePath();
                ctx.fill();
                
                // Speed lines
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 2;
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.moveTo(-this.size - 5 - i * 3, animOffset + (i - 1) * 3);
                    ctx.lineTo(-this.size - 10 - i * 3, animOffset + (i - 1) * 3);
                    ctx.stroke();
                }
                break;
                
            case 'heavy':
                // Square shape
                ctx.fillRect(-this.size, animOffset - this.size, this.size * 2, this.size * 2);
                
                // Armor plating
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(-this.size + 2, animOffset - this.size + 2, this.size * 2 - 4, 4);
                ctx.fillRect(-this.size + 2, animOffset - 2, this.size * 2 - 4, 4);
                ctx.fillRect(-this.size + 2, animOffset + this.size - 6, this.size * 2 - 4, 4);
                break;
                
            case 'armored':
                // Pentagon shape
                ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
                    const x = Math.cos(angle) * this.size;
                    const y = Math.sin(angle) * this.size + animOffset;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
                
                // Armor shine
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.beginPath();
                ctx.arc(-3, animOffset - 3, this.size / 3, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'flying':
                // Diamond shape with wings
                ctx.beginPath();
                ctx.moveTo(0, animOffset - this.size);
                ctx.lineTo(this.size, animOffset);
                ctx.lineTo(0, animOffset + this.size);
                ctx.lineTo(-this.size, animOffset);
                ctx.closePath();
                ctx.fill();
                
                // Wings
                const wingFlap = Math.sin(this.animationFrame / 50) * 0.3 + 0.7;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.beginPath();
                ctx.ellipse(-this.size, animOffset, this.size * 0.8, this.size * 0.4 * wingFlap, 0, 0, Math.PI * 2);
                ctx.ellipse(this.size, animOffset, this.size * 0.8, this.size * 0.4 * wingFlap, 0, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'boss':
                // Large intimidating shape
                ctx.beginPath();
                ctx.arc(0, animOffset, this.size, 0, Math.PI * 2);
                ctx.fill();
                
                // Spikes
                ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
                for (let i = 0; i < 8; i++) {
                    const angle = (i * Math.PI * 2) / 8;
                    const spikeLength = this.size * 0.5;
                    ctx.beginPath();
                    ctx.moveTo(Math.cos(angle) * this.size, Math.sin(angle) * this.size + animOffset);
                    ctx.lineTo(Math.cos(angle) * (this.size + spikeLength), Math.sin(angle) * (this.size + spikeLength) + animOffset);
                    ctx.lineTo(Math.cos(angle + 0.2) * this.size, Math.sin(angle + 0.2) * this.size + animOffset);
                    ctx.closePath();
                    ctx.fill();
                }
                
                // Eyes
                ctx.fillStyle = 'yellow';
                ctx.beginPath();
                ctx.arc(-6, animOffset - 5, 3, 0, Math.PI * 2);
                ctx.arc(6, animOffset - 5, 3, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'shielded':
                // Main hexagonal body
                ctx.beginPath();
                const sides = 6;
                for (let i = 0; i < sides; i++) {
                    const angle = (i / sides) * Math.PI * 2;
                    const x = Math.cos(angle) * this.size;
                    const y = Math.sin(angle) * this.size + animOffset;
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.closePath();
                ctx.fill();
                
                // Shield glow effect (if shield is active)
                if (this.shield > 0) {
                    const shieldStrength = this.shield / this.maxShield;
                    ctx.save();
                    ctx.shadowColor = '#00ffff';
                    ctx.shadowBlur = 15 * shieldStrength;
                    ctx.strokeStyle = `rgba(0, 255, 255, ${0.8 * shieldStrength})`;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(0, animOffset, this.size + 5, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }
                
                // Core
                ctx.fillStyle = '#004444';
                ctx.beginPath();
                ctx.arc(0, animOffset, this.size * 0.4, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
    }
    
    renderHealthBar(ctx) {
        if (this.health < this.maxHealth) {
            const barWidth = this.size * 2;
            const barHeight = 4;
            const barY = -this.size - 10;
            
            // Background
            ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.fillRect(-barWidth / 2, barY, barWidth, barHeight);
            
            // Health
            const healthPercent = this.health / this.maxHealth;
            ctx.fillStyle = healthPercent > 0.5 ? 'rgba(0, 255, 0, 0.8)' : 
                           healthPercent > 0.25 ? 'rgba(255, 255, 0, 0.8)' : 
                           'rgba(255, 0, 0, 0.8)';
            ctx.fillRect(-barWidth / 2, barY, barWidth * healthPercent, barHeight);
            
            // Border
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.lineWidth = 1;
            ctx.strokeRect(-barWidth / 2, barY, barWidth, barHeight);
        }
    }
    
    renderShieldBar(ctx) {
        if (this.maxShield > 0 && this.shield > 0) {
            const barWidth = this.size * 2;
            const barHeight = 3;
            const barY = -this.size - 15; // Above health bar
            
            // Shield background
            ctx.fillStyle = 'rgba(0, 100, 150, 0.6)';
            ctx.fillRect(-barWidth / 2, barY, barWidth, barHeight);
            
            // Shield amount
            const shieldPercent = this.shield / this.maxShield;
            ctx.fillStyle = `rgba(0, 255, 255, ${0.8 * shieldPercent})`;
            ctx.fillRect(-barWidth / 2, barY, barWidth * shieldPercent, barHeight);
            
            // Shield border
            ctx.strokeStyle = 'rgba(0, 200, 255, 0.8)';
            ctx.lineWidth = 1;
            ctx.strokeRect(-barWidth / 2, barY, barWidth, barHeight);
        }
    }
    
    renderSpecialIndicators(ctx) {
        // Flying indicator
        if (this.flying) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('✈', 0, -this.size - 20);
        }
        
        // Boss indicator
        if (this.boss) {
            ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('★', 0, -this.size - 25);
        }
        
        // Armor indicator
        if (this.armor > 0) {
            ctx.fillStyle = 'rgba(200, 200, 200, 0.8)';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🛡', this.size + 5, -this.size);
        }
        
        // Shield indicator
        if (this.maxShield > 0) {
            ctx.fillStyle = this.shield > 0 ? 'rgba(0, 255, 255, 0.9)' : 'rgba(100, 100, 100, 0.5)';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🛡', -this.size - 8, -this.size);
        }
    }
}

// Enemy factory for creating different enemy types
class EnemyFactory {
    static createEnemy(type, x = -50, y = 300, waveLevel = 1) {
        return new Enemy(x, y, type, waveLevel);
    }
    
    static getEnemyTypeForWave(wave) {
        // Determine which enemy types appear in each wave - BRUTAL PROGRESSION
        const enemyProgression = {
            1: ['basic', 'basic', 'fast'],
            2: ['basic', 'fast', 'basic', 'fast', 'heavy'],
            3: ['fast', 'fast', 'heavy', 'armored'],
            4: ['heavy', 'armored', 'shielded', 'heavy'],
            5: ['heavy', 'boss', 'shielded', 'flying'], // Boss wave with escorts
            6: ['shielded', 'flying', 'ultra', 'shielded'],
            7: ['heavy', 'ultra', 'shielded', 'ultra'],
            8: ['flying', 'shielded', 'swarm', 'swarm', 'ultra'],
            9: ['ultra', 'flying', 'shielded', 'shielded', 'swarm'],
            10: ['boss', 'ultra', 'shielded', 'boss'], // Double boss with shielded escorts
            11: ['swarm', 'swarm', 'ultra', 'shielded', 'flying'],
            12: ['ultra', 'shielded', 'heavy', 'flying', 'swarm'],
            13: ['boss', 'ultra', 'shielded', 'flying', 'ultra'],
            14: ['swarm', 'ultra', 'flying', 'shielded', 'shielded', 'swarm'],
            15: ['boss', 'ultra', 'boss', 'shielded', 'ultra'], // Triple threat
            16: ['ultra', 'swarm', 'shielded', 'flying', 'shielded', 'swarm'],
            17: ['boss', 'ultra', 'shielded', 'boss', 'flying'],
            18: ['swarm', 'ultra', 'flying', 'shielded', 'shielded', 'swarm', 'ultra'],
            19: ['boss', 'ultra', 'boss', 'shielded', 'flying', 'shielded'],
            20: ['boss', 'ultra', 'boss', 'shielded', 'boss', 'swarm'] // NIGHTMARE finale
        };
        
        return enemyProgression[wave] || ['ultra', 'swarm', 'boss', 'armored', 'flying'];
    }
    
    static getEnemyCount(wave) {
        // Number of enemies increases with wave
        return Math.min(5 + Math.floor(wave / 2), 15);
    }
}

// Make classes globally available
window.Enemy = Enemy;
window.EnemyFactory = EnemyFactory;