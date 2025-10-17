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
        const animOffset = Math.sin(this.animationFrame / 200) * 1;
        const walkCycle = Math.sin(this.animationFrame / 100) * 0.5;
        
        switch (this.type) {
            case 'basic':
                this.renderBasicSoldier(ctx, animOffset, walkCycle);
                break;
                
            case 'fast':
                this.renderScoutSoldier(ctx, animOffset, walkCycle);
                break;
                
            case 'heavy':
                this.renderHeavySoldier(ctx, animOffset, walkCycle);
                break;
                
            case 'armored':
                this.renderArmoredSoldier(ctx, animOffset, walkCycle);
                break;
                
            case 'flying':
                this.renderJetpackSoldier(ctx, animOffset, walkCycle);
                break;
                
            case 'boss':
                this.renderBossSoldier(ctx, animOffset, walkCycle);
                break;
                
            case 'ultra':
                this.renderUltraSoldier(ctx, animOffset, walkCycle);
                break;
                
            case 'swarm':
                this.renderSwarmSoldier(ctx, animOffset, walkCycle);
                break;
                
            case 'shielded':
                this.renderShieldedSoldier(ctx, animOffset, walkCycle);
                break;
        }
    }
    
    renderBasicSoldier(ctx, animOffset, walkCycle) {
        // Basic Infantry - Standard soldier
        
        // Body (torso)
        ctx.fillStyle = this.color;
        ctx.fillRect(-4, animOffset - 8, 8, 12);
        
        // Head (helmet)
        ctx.fillStyle = this.darkenColor(this.color, 0.2);
        ctx.beginPath();
        ctx.arc(0, animOffset - 10, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Helmet visor
        ctx.fillStyle = '#333333';
        ctx.fillRect(-3, animOffset - 12, 6, 3);
        
        // Arms
        ctx.fillStyle = this.color;
        ctx.fillRect(-8, animOffset - 6, 3, 8);
        ctx.fillRect(5, animOffset - 6, 3, 8);
        
        // Legs (with walking animation)
        const legOffset = walkCycle * 2;
        ctx.fillRect(-3, animOffset + 4 + legOffset, 2, 6);
        ctx.fillRect(1, animOffset + 4 - legOffset, 2, 6);
        
        // Weapon (rifle)
        ctx.fillStyle = '#444444';
        ctx.fillRect(6, animOffset - 4, 8, 2);
        
        // Armor plating
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(-3, animOffset - 6, 6, 2);
        ctx.fillRect(-3, animOffset - 2, 6, 2);
        
        // Military insignia
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(-1, animOffset - 4, 2, 1);
    }
    
    renderScoutSoldier(ctx, animOffset, walkCycle) {
        // Scout/Recon - Light, fast soldier
        
        // Lean body
        ctx.fillStyle = this.color;
        ctx.fillRect(-3, animOffset - 7, 6, 10);
        
        // Tactical helmet
        ctx.fillStyle = this.darkenColor(this.color, 0.2);
        ctx.beginPath();
        ctx.arc(0, animOffset - 9, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Night vision goggles
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(-2, animOffset - 10, 1.5, 0, Math.PI * 2);
        ctx.arc(2, animOffset - 10, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Light armor arms
        ctx.fillStyle = this.color;
        ctx.fillRect(-6, animOffset - 5, 2, 6);
        ctx.fillRect(4, animOffset - 5, 2, 6);
        
        // Fast-moving legs
        const fastLegOffset = walkCycle * 3;
        ctx.fillRect(-2, animOffset + 3 + fastLegOffset, 1.5, 5);
        ctx.fillRect(0.5, animOffset + 3 - fastLegOffset, 1.5, 5);
        
        // SMG weapon
        ctx.fillStyle = '#333333';
        ctx.fillRect(5, animOffset - 3, 6, 1.5);
        
        // Speed lines (motion blur)
        ctx.strokeStyle = 'rgba(68, 255, 68, 0.5)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(-8 - i * 2, animOffset + (i - 1) * 2);
            ctx.lineTo(-12 - i * 2, animOffset + (i - 1) * 2);
            ctx.stroke();
        }
        
        // Radio antenna
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(2, animOffset - 12);
        ctx.lineTo(4, animOffset - 16);
        ctx.stroke();
    }
    
    renderHeavySoldier(ctx, animOffset, walkCycle) {
        // Heavy Infantry - Bulky, well-armored
        
        // Massive torso
        ctx.fillStyle = this.color;
        ctx.fillRect(-6, animOffset - 10, 12, 16);
        
        // Heavy helmet
        ctx.fillStyle = this.darkenColor(this.color, 0.3);
        ctx.fillRect(-6, animOffset - 14, 12, 8);
        
        // Visor slit
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(-4, animOffset - 12, 8, 1.5);
        
        // Massive armored arms
        ctx.fillStyle = this.darkenColor(this.color, 0.1);
        ctx.fillRect(-10, animOffset - 8, 4, 10);
        ctx.fillRect(6, animOffset - 8, 4, 10);
        
        // Heavy legs
        const slowLegOffset = walkCycle * 1;
        ctx.fillRect(-4, animOffset + 6 + slowLegOffset, 3, 8);
        ctx.fillRect(1, animOffset + 6 - slowLegOffset, 3, 8);
        
        // Heavy machine gun
        ctx.fillStyle = '#222222';
        ctx.fillRect(8, animOffset - 6, 12, 3);
        ctx.fillRect(18, animOffset - 5, 3, 1); // Barrel tip
        
        // Armor plating details
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(-5, animOffset - 8, 10, 2);
        ctx.fillRect(-5, animOffset - 4, 10, 2);
        ctx.fillRect(-5, animOffset, 10, 2);
        
        // Shoulder pads
        ctx.fillStyle = this.darkenColor(this.color, 0.4);
        ctx.fillRect(-8, animOffset - 10, 3, 4);
        ctx.fillRect(5, animOffset - 10, 3, 4);
        
        // Ammo belt
        ctx.fillStyle = '#ffaa00';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(-4 + i * 2, animOffset - 2, 1, 3);
        }
    }
    
    renderArmoredSoldier(ctx, animOffset, walkCycle) {
        // Elite Armored - Advanced combat armor
        
        // Advanced armor torso
        ctx.fillStyle = this.color;
        ctx.fillRect(-5, animOffset - 9, 10, 14);
        
        // High-tech helmet
        ctx.fillStyle = this.darkenColor(this.color, 0.2);
        ctx.beginPath();
        ctx.arc(0, animOffset - 11, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // HUD visor
        ctx.fillStyle = '#0088ff';
        ctx.fillRect(-4, animOffset - 13, 8, 2);
        
        // Power armor arms
        ctx.fillStyle = this.darkenColor(this.color, 0.1);
        ctx.fillRect(-9, animOffset - 7, 4, 9);
        ctx.fillRect(5, animOffset - 7, 4, 9);
        
        // Servo-assisted legs
        ctx.fillRect(-3, animOffset + 5 + walkCycle, 2.5, 7);
        ctx.fillRect(0.5, animOffset + 5 - walkCycle, 2.5, 7);
        
        // Plasma rifle
        ctx.fillStyle = '#6600cc';
        ctx.fillRect(7, animOffset - 5, 10, 2.5);
        
        // Energy core
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(0, animOffset - 2, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Armor glow lines
        ctx.strokeStyle = 'rgba(255, 170, 68, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-4, animOffset - 6);
        ctx.lineTo(4, animOffset - 6);
        ctx.moveTo(-4, animOffset);
        ctx.lineTo(4, animOffset);
        ctx.stroke();
        
        // Shoulder mounted systems
        ctx.fillStyle = '#666666';
        ctx.fillRect(-7, animOffset - 12, 2, 3);
        ctx.fillRect(5, animOffset - 12, 2, 3);
    }
    
    renderJetpackSoldier(ctx, animOffset, walkCycle) {
        // Flying Jetpack Trooper
        
        // Flight suit body
        ctx.fillStyle = this.color;
        ctx.fillRect(-4, animOffset - 8, 8, 12);
        
        // Flight helmet
        ctx.fillStyle = this.darkenColor(this.color, 0.2);
        ctx.beginPath();
        ctx.arc(0, animOffset - 10, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Clear visor
        ctx.fillStyle = 'rgba(200, 200, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(0, animOffset - 10, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Jetpack
        ctx.fillStyle = '#333333';
        ctx.fillRect(-3, animOffset - 6, 6, 10);
        
        // Jetpack thrusters
        const thrusterFlame = Math.sin(this.animationFrame / 30) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(0, 150, 255, ${thrusterFlame})`;
        ctx.beginPath();
        ctx.arc(-2, animOffset + 6, 2, 0, Math.PI * 2);
        ctx.arc(2, animOffset + 6, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Wings/stabilizers
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(-8, animOffset - 2, 3, 6);
        ctx.fillRect(5, animOffset - 2, 3, 6);
        
        // Assault rifle
        ctx.fillStyle = '#444444';
        ctx.fillRect(6, animOffset - 4, 8, 2);
        
        // Flight path indicator
        ctx.strokeStyle = 'rgba(255, 68, 255, 0.6)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(-10, animOffset - 5);
        ctx.lineTo(-15, animOffset - 8);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Altitude indicator
        ctx.fillStyle = '#ffff00';
        ctx.font = '8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('↑', 0, animOffset - 18);
    }
    
    renderBossSoldier(ctx, animOffset, walkCycle) {
        // Elite Commander - Massive, intimidating
        
        // Command armor torso
        ctx.fillStyle = this.color;
        ctx.fillRect(-8, animOffset - 12, 16, 20);
        
        // Command helmet with crown
        ctx.fillStyle = this.darkenColor(this.color, 0.3);
        ctx.fillRect(-8, animOffset - 18, 16, 10);
        
        // Crown spikes
        ctx.fillStyle = '#ffd700';
        for (let i = 0; i < 5; i++) {
            const spikeX = -6 + i * 3;
            ctx.beginPath();
            ctx.moveTo(spikeX, animOffset - 18);
            ctx.lineTo(spikeX + 1, animOffset - 22);
            ctx.lineTo(spikeX + 2, animOffset - 18);
            ctx.closePath();
            ctx.fill();
        }
        
        // Glowing red eyes
        ctx.fillStyle = '#ff0000';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff0000';
        ctx.beginPath();
        ctx.arc(-3, animOffset - 14, 2, 0, Math.PI * 2);
        ctx.arc(3, animOffset - 14, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Massive armored arms
        ctx.fillStyle = this.darkenColor(this.color, 0.1);
        ctx.fillRect(-14, animOffset - 10, 6, 14);
        ctx.fillRect(8, animOffset - 10, 6, 14);
        
        // Heavy legs
        ctx.fillRect(-6, animOffset + 8 + walkCycle * 0.5, 5, 10);
        ctx.fillRect(1, animOffset + 8 - walkCycle * 0.5, 5, 10);
        
        // Massive weapon
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(12, animOffset - 8, 16, 4);
        ctx.fillRect(26, animOffset - 7, 4, 2); // Muzzle
        
        // Energy weapon glow
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#ff6600';
        ctx.fillRect(24, animOffset - 6.5, 6, 1);
        ctx.shadowBlur = 0;
        
        // Command armor plating
        ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(-6, animOffset - 6 + i * 4, 12, 2);
        }
        
        // Shoulder mounted missile pods
        ctx.fillStyle = '#444444';
        ctx.fillRect(-10, animOffset - 14, 3, 6);
        ctx.fillRect(7, animOffset - 14, 3, 6);
        
        // Commander cape
        ctx.fillStyle = 'rgba(128, 0, 0, 0.8)';
        ctx.beginPath();
        ctx.moveTo(-6, animOffset - 8);
        ctx.lineTo(-10, animOffset + 6);
        ctx.lineTo(10, animOffset + 6);
        ctx.lineTo(6, animOffset - 8);
        ctx.closePath();
        ctx.fill();
    }
    
    renderUltraSoldier(ctx, animOffset, walkCycle) {
        // Elite Ultra Soldier - High-tech
        
        // Exosuit torso
        ctx.fillStyle = this.color;
        ctx.fillRect(-6, animOffset - 10, 12, 16);
        
        // Advanced helmet
        ctx.fillStyle = this.darkenColor(this.color, 0.2);
        ctx.beginPath();
        ctx.arc(0, animOffset - 12, 7, 0, Math.PI * 2);
        ctx.fill();
        
        // Multi-spectrum visor
        const visorColors = ['#ff0000', '#00ff00', '#0000ff'];
        visorColors.forEach((color, i) => {
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.3;
            ctx.fillRect(-5 + i * 2, animOffset - 14, 3, 2);
        });
        ctx.globalAlpha = 1;
        
        // Exosuit arms with servos
        ctx.fillStyle = this.darkenColor(this.color, 0.1);
        ctx.fillRect(-10, animOffset - 8, 4, 10);
        ctx.fillRect(6, animOffset - 8, 4, 10);
        
        // Servo joints
        ctx.fillStyle = '#888888';
        ctx.beginPath();
        ctx.arc(-8, animOffset - 4, 1.5, 0, Math.PI * 2);
        ctx.arc(8, animOffset - 4, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Power legs
        ctx.fillStyle = this.color;
        ctx.fillRect(-4, animOffset + 6 + walkCycle, 3, 8);
        ctx.fillRect(1, animOffset + 6 - walkCycle, 3, 8);
        
        // Dual weapons
        ctx.fillStyle = '#8800ff';
        ctx.fillRect(8, animOffset - 6, 9, 2);
        ctx.fillRect(8, animOffset - 2, 9, 2);
        
        // Energy matrix
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#8800ff';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(-3 + i * 3, animOffset - 4, 1, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
        
        // Regeneration field
        if (this.regeneration > 0) {
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, animOffset - 2, this.size + 3, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    renderSwarmSoldier(ctx, animOffset, walkCycle) {
        // Fast Attack Drone Infantry
        
        // Compact body
        ctx.fillStyle = this.color;
        ctx.fillRect(-3, animOffset - 6, 6, 8);
        
        // Tactical helmet
        ctx.fillStyle = this.darkenColor(this.color, 0.2);
        ctx.beginPath();
        ctx.arc(0, animOffset - 8, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Targeting laser
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(1, animOffset - 9, 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Light arms
        ctx.fillStyle = this.color;
        ctx.fillRect(-5, animOffset - 4, 2, 5);
        ctx.fillRect(3, animOffset - 4, 2, 5);
        
        // Fast legs
        const swarmLegOffset = walkCycle * 2.5;
        ctx.fillRect(-2, animOffset + 2 + swarmLegOffset, 1.5, 4);
        ctx.fillRect(0.5, animOffset + 2 - swarmLegOffset, 1.5, 4);
        
        // Compact SMG
        ctx.fillStyle = '#555555';
        ctx.fillRect(4, animOffset - 3, 5, 1.5);
        
        // Movement trails
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.4)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 2; i++) {
            ctx.beginPath();
            ctx.moveTo(-6 - i * 2, animOffset + i);
            ctx.lineTo(-9 - i * 2, animOffset + i);
            ctx.stroke();
        }
        
        // Squad communication array
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, animOffset - 11);
        ctx.lineTo(2, animOffset - 13);
        ctx.stroke();
    }
    
    renderShieldedSoldier(ctx, animOffset, walkCycle) {
        // Energy Shield Trooper
        
        // Armored body
        ctx.fillStyle = this.color;
        ctx.fillRect(-5, animOffset - 9, 10, 14);
        
        // Shield generator helmet
        ctx.fillStyle = this.darkenColor(this.color, 0.2);
        ctx.fillRect(-6, animOffset - 14, 12, 8);
        
        // Shield projection visor
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(-4, animOffset - 12, 8, 2);
        
        // Shield generator arms
        ctx.fillStyle = this.darkenColor(this.color, 0.1);
        ctx.fillRect(-8, animOffset - 7, 3, 8);
        ctx.fillRect(5, animOffset - 7, 3, 8);
        
        // Generator legs
        ctx.fillRect(-3, animOffset + 5 + walkCycle, 2.5, 7);
        ctx.fillRect(0.5, animOffset + 5 - walkCycle, 2.5, 7);
        
        // Energy weapon
        ctx.fillStyle = '#00aaff';
        ctx.fillRect(6, animOffset - 5, 8, 2.5);
        
        // Shield projector
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-6, animOffset - 3, 2, 4);
        
        // Shield field visualization
        if (this.shield > 0) {
            const shieldStrength = this.shield / this.maxShield;
            ctx.save();
            ctx.strokeStyle = `rgba(0, 255, 255, ${0.6 * shieldStrength})`;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10 * shieldStrength;
            ctx.shadowColor = '#00ffff';
            
            // Hexagonal shield pattern
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const x = Math.cos(angle) * (this.size + 4);
                const y = Math.sin(angle) * (this.size + 4) + animOffset;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
        }
        
        // Power conduits
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-4, animOffset - 6);
        ctx.lineTo(4, animOffset - 6);
        ctx.moveTo(0, animOffset - 8);
        ctx.lineTo(0, animOffset - 2);
        ctx.stroke();
    }
    
    darkenColor(color, amount) {
        // Simple color darkening helper
        const hex = color.replace('#', '');
        const num = parseInt(hex, 16);
        const r = Math.max(0, Math.floor((num >> 16) * (1 - amount)));
        const g = Math.max(0, Math.floor(((num >> 8) & 0x00FF) * (1 - amount)));
        const b = Math.max(0, Math.floor((num & 0x0000FF) * (1 - amount)));
        return `rgb(${r}, ${g}, ${b})`;
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
