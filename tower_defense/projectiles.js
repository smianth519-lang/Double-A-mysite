// Projectiles.js - Projectile classes and ballistics
class Projectile {
    constructor(startX, startY, targetX, targetY, type = 'bullet', damage = 20, speed = 300, options = {}) {
        this.x = startX;
        this.y = startY;
        this.startX = startX;
        this.startY = startY;
        this.targetX = targetX;
        this.targetY = targetY;
        this.type = type;
        this.damage = damage;
        this.speed = speed;
        this.options = options;
        
        // Calculate trajectory
        this.calculateTrajectory();
        
        // Initialize projectile properties
        this.initializeProjectileType();
        
        // State
        this.distanceTraveled = 0;
        this.shouldRemove = false;
        this.hasHit = false;
        
        // Visual properties
        this.animationFrame = 0;
        this.trail = [];
        this.maxTrailLength = 5;
    }
    
    calculateTrajectory() {
        const dx = this.targetX - this.startX;
        const dy = this.targetY - this.startY;
        this.totalDistance = Math.sqrt(dx * dx + dy * dy);
        this.angle = Math.atan2(dy, dx);
        
        // Velocity components
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
    }
    
    initializeProjectileType() {
        const projectileTypes = {
            bullet: {
                color: '#ffff00',
                size: 3,
                trail: true,
                penetrating: false,
                explosive: false
            },
            cannonball: {
                color: '#333333',
                size: 6,
                trail: true,
                penetrating: false,
                explosive: true,
                explosionRadius: 40,
                gravity: 200 // Affected by gravity
            },
            laser: {
                color: '#ff00ff',
                size: 2,
                trail: true,
                penetrating: true,
                instant: true, // Travels instantly
                glowing: true
            },
            ice: {
                color: '#00ffff',
                size: 4,
                trail: true,
                penetrating: false,
                explosive: false,
                freezing: true
            },
            missile: {
                color: '#ff4400',
                size: 5,
                trail: true,
                penetrating: false,
                explosive: true,
                explosionRadius: 60,
                homing: true // Tracks target
            }
        };
        
        const projectileData = projectileTypes[this.type] || projectileTypes.bullet;
        
        this.color = projectileData.color;
        this.size = projectileData.size;
        this.hasTrail = projectileData.trail;
        this.penetrating = projectileData.penetrating;
        this.explosive = projectileData.explosive;
        this.explosionRadius = projectileData.explosionRadius || this.options.explosionRadius || 0;
        this.gravity = projectileData.gravity || 0;
        this.instant = projectileData.instant || false;
        this.glowing = projectileData.glowing || false;
        this.freezing = projectileData.freezing || false;
        this.homing = projectileData.homing || false;
    }
    
    update(deltaTime, enemies) {
        if (this.shouldRemove || this.hasHit) return;
        
        this.animationFrame += deltaTime;
        
        // Handle instant projectiles (lasers)
        if (this.instant) {
            this.handleInstantHit(enemies);
            return;
        }
        
        // Update trail
        if (this.hasTrail) {
            this.trail.push({ x: this.x, y: this.y, time: Date.now() });
            if (this.trail.length > this.maxTrailLength) {
                this.trail.shift();
            }
        }
        
        // Homing behavior for missiles
        if (this.homing && this.options.tower && this.options.tower.target) {
            this.updateHomingTrajectory(this.options.tower.target);
        }
        
        // Apply gravity for cannonballs
        if (this.gravity > 0) {
            this.vy += this.gravity * (deltaTime / 1000);
        }
        
        // Move projectile
        const moveDistance = this.speed * (deltaTime / 1000);
        this.x += this.vx * (deltaTime / 1000);
        this.y += this.vy * (deltaTime / 1000);
        this.distanceTraveled += moveDistance;
        
        // Check for hits
        this.checkCollisions(enemies);
        
        // Remove if traveled too far
        if (this.distanceTraveled > this.totalDistance + 100) {
            this.shouldRemove = true;
        }
        
        // Remove if off screen
        if (this.x < -50 || this.x > 1050 || this.y < -50 || this.y > 650) {
            this.shouldRemove = true;
        }
    }
    
    updateHomingTrajectory(target) {
        if (!target) return;
        
        // Calculate new angle towards target
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const targetAngle = Math.atan2(dy, dx);
        
        // Gradually adjust angle (limited turning speed)
        const maxTurnRate = 0.1; // radians per frame
        let angleDiff = targetAngle - this.angle;
        
        // Normalize angle difference
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        // Apply limited turning
        if (Math.abs(angleDiff) > maxTurnRate) {
            this.angle += maxTurnRate * Math.sign(angleDiff);
        } else {
            this.angle = targetAngle;
        }
        
        // Update velocity
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
    }
    
    handleInstantHit(enemies) {
        // Laser hits instantly along the line
        for (let enemy of enemies) {
            if (this.isOnLaserPath(enemy)) {
                this.hitEnemy(enemy);
                if (!this.penetrating) break;
            }
        }
        this.shouldRemove = true;
    }
    
    isOnLaserPath(enemy) {
        // Check if enemy is close to the laser line
        const distance = this.distanceToLine(
            enemy.x, enemy.y,
            this.startX, this.startY,
            this.targetX, this.targetY
        );
        return distance < enemy.size;
    }
    
    distanceToLine(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
        
        const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (length * length)));
        const projectionX = x1 + t * dx;
        const projectionY = y1 + t * dy;
        
        return Math.sqrt((px - projectionX) ** 2 + (py - projectionY) ** 2);
    }
    
    checkCollisions(enemies) {
        for (let enemy of enemies) {
            const distance = Math.sqrt((this.x - enemy.x) ** 2 + (this.y - enemy.y) ** 2);
            
            if (distance < enemy.size + this.size) {
                this.hitEnemy(enemy);
                
                if (!this.penetrating) {
                    this.hasHit = true;
                    break;
                }
            }
        }
        
        // Handle explosion after hit
        if (this.hasHit && this.explosive) {
            this.explode(enemies);
        }
        
        if (this.hasHit) {
            this.shouldRemove = true;
        }
    }
    
    hitEnemy(enemy) {
        // Apply damage
        const damageType = this.getDamageType();
        const enemyKilled = enemy.takeDamage(this.damage, damageType);
        
        // Apply special effects
        this.applySpecialEffects(enemy);
        
        // Create hit particles
        this.createHitEffect(enemy.x, enemy.y);
        
        return enemyKilled;
    }
    
    getDamageType() {
        const damageTypes = {
            bullet: 'normal',
            cannonball: 'explosive',
            laser: 'laser',
            ice: 'ice',
            missile: 'explosive'
        };
        return damageTypes[this.type] || 'normal';
    }
    
    applySpecialEffects(enemy) {
        // Apply slow effect for ice projectiles
        if (this.freezing || this.options.slowAmount) {
            const slowAmount = this.options.slowAmount || 0.5;
            const slowDuration = this.options.slowDuration || 2000;
            enemy.applySlow(slowAmount, slowDuration);
        }
        
        // Apply freeze effect for strong ice attacks
        if (this.freezing && this.damage > 20) {
            enemy.applyFreeze(1000);
        }
    }
    
    explode(enemies) {
        if (!this.explosive || this.explosionRadius <= 0) return;
        
        // Create explosion effect
        this.createExplosionEffect();
        
        // Damage all enemies in explosion radius
        for (let enemy of enemies) {
            const distance = Math.sqrt((this.x - enemy.x) ** 2 + (this.y - enemy.y) ** 2);
            
            if (distance <= this.explosionRadius) {
                // Damage decreases with distance
                const damageFactor = 1 - (distance / this.explosionRadius);
                const explosionDamage = Math.floor(this.damage * 0.7 * damageFactor);
                
                if (explosionDamage > 0) {
                    enemy.takeDamage(explosionDamage, 'explosive');
                    this.createHitEffect(enemy.x, enemy.y);
                }
            }
        }
    }
    
    createHitEffect(x, y) {
        // Create particles for hit effect
        if (window.game) {
            for (let i = 0; i < 4; i++) {
                const particle = new Particle(
                    x + (Math.random() - 0.5) * 10,
                    y + (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 80,
                    (Math.random() - 0.5) * 80,
                    this.color,
                    500
                );
                window.game.particles.push(particle);
            }
        }
    }
    
    createExplosionEffect() {
        // Create explosion particles
        if (window.game) {
            const particleCount = Math.floor(this.explosionRadius / 4);
            
            for (let i = 0; i < particleCount; i++) {
                const angle = (i / particleCount) * Math.PI * 2;
                const distance = Math.random() * this.explosionRadius;
                
                const particle = new Particle(
                    this.x + Math.cos(angle) * distance,
                    this.y + Math.sin(angle) * distance,
                    Math.cos(angle) * 150,
                    Math.sin(angle) * 150,
                    '#ff8800',
                    800
                );
                window.game.particles.push(particle);
            }
        }
    }
    
    render(ctx) {
        if (this.shouldRemove) return;
        
        ctx.save();
        
        // Render trail
        if (this.hasTrail && this.trail.length > 1) {
            this.renderTrail(ctx);
        }
        
        // Render specific projectile type
        switch (this.type) {
            case 'bullet':
                this.renderBullet(ctx);
                break;
            case 'cannonball':
                this.renderCannonball(ctx);
                break;
            case 'laser':
                this.renderLaser(ctx);
                break;
            case 'ice':
                this.renderIce(ctx);
                break;
            case 'missile':
                this.renderMissile(ctx);
                break;
            default:
                this.renderBullet(ctx);
        }
        
        ctx.restore();
    }
    
    renderTrail(ctx) {
        if (this.trail.length < 2) return;
        
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.size / 2;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.6;
        
        ctx.beginPath();
        for (let i = 0; i < this.trail.length; i++) {
            const point = this.trail[i];
            if (i === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        }
        ctx.stroke();
        
        ctx.globalAlpha = 1;
    }
    
    renderBullet(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Bullet glow
        if (this.glowing) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
    
    renderCannonball(ctx) {
        // Shadow for depth
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x + 2, this.y + 2, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Main cannonball
        const gradient = ctx.createRadialGradient(
            this.x - 2, this.y - 2, 0,
            this.x, this.y, this.size
        );
        gradient.addColorStop(0, '#666666');
        gradient.addColorStop(1, '#333333');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderLaser(ctx) {
        // Laser beam from start to current position (or target for instant)
        const endX = this.instant ? this.targetX : this.x;
        const endY = this.instant ? this.targetY : this.y;
        
        // Outer glow
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 8;
        ctx.globalAlpha = 0.3;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        // Inner beam
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.9;
        ctx.stroke();
        
        ctx.globalAlpha = 1;
    }
    
    renderIce(ctx) {
        // Ice crystal
        ctx.fillStyle = this.color;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.animationFrame / 200);
        
        // Crystal shape
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = Math.cos(angle) * this.size;
            const y = Math.sin(angle) * this.size;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        
        // Ice shimmer
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(-this.size / 3, -this.size / 3, this.size / 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    renderMissile(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Missile body
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size, -this.size / 2, this.size * 2, this.size);
        
        // Missile tip
        ctx.beginPath();
        ctx.moveTo(this.size, 0);
        ctx.lineTo(this.size + 4, -this.size / 2);
        ctx.lineTo(this.size + 4, this.size / 2);
        ctx.closePath();
        ctx.fill();
        
        // Exhaust flame
        ctx.fillStyle = '#ff4400';
        ctx.beginPath();
        ctx.moveTo(-this.size, -2);
        ctx.lineTo(-this.size - 8, 0);
        ctx.lineTo(-this.size, 2);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
}

// Projectile factory for creating different projectile types
class ProjectileFactory {
    static createProjectile(startX, startY, targetX, targetY, type, damage, speed, options = {}) {
        return new Projectile(startX, startY, targetX, targetY, type, damage, speed, options);
    }
    
    static createExplosion(x, y, radius, damage, enemies) {
        // Create temporary explosion projectile for area damage
        const explosion = new Projectile(x, y, x, y, 'explosion', damage, 0, {
            explosionRadius: radius
        });
        
        explosion.x = x;
        explosion.y = y;
        explosion.explosive = true;
        explosion.explode(enemies);
        
        return explosion;
    }
}

// Special projectile effects manager
class ProjectileEffects {
    static createMuzzleFlash(x, y, angle, color = '#ffff00') {
        if (!window.game) return;
        
        const flashLength = 20;
        const flashWidth = 8;
        
        for (let i = 0; i < 3; i++) {
            const particle = new Particle(
                x + Math.cos(angle) * (10 + i * 5),
                y + Math.sin(angle) * (10 + i * 5),
                Math.cos(angle) * 100,
                Math.sin(angle) * 100,
                color,
                200 - i * 50
            );
            window.game.particles.push(particle);
        }
    }
    
    static createRicochet(x, y, angle) {
        if (!window.game) return;
        
        for (let i = 0; i < 5; i++) {
            const spreadAngle = angle + (Math.random() - 0.5) * Math.PI / 2;
            const particle = new Particle(
                x,
                y,
                Math.cos(spreadAngle) * 150,
                Math.sin(spreadAngle) * 150,
                '#ffff88',
                300
            );
            window.game.particles.push(particle);
        }
    }
    
    static createImpact(x, y, color = '#ffffff') {
        if (!window.game) return;
        
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const particle = new Particle(
                x + Math.cos(angle) * 5,
                y + Math.sin(angle) * 5,
                Math.cos(angle) * 80,
                Math.sin(angle) * 80,
                color,
                400
            );
            window.game.particles.push(particle);
        }
    }
}

// Make classes globally available
window.Projectile = Projectile;
window.ProjectileFactory = ProjectileFactory;
window.ProjectileEffects = ProjectileEffects;