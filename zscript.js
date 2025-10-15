const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 900;
        canvas.height = 600;
        
        // Game state
        let gameRunning = true;
        let gamePaused = false;
        let score = 0;
        let screenShake = 0;
    let wave = 1;
    const maxWaves = 100; // Maximum number of waves
        let gameDifficulty = 'normal'; // 'easy', 'normal', or 'hardcore'
        let zombiesKilled = 0;
        let zombiesPerWave = 5;
        let waveTimer = 0;
        let betweenWaves = false;
        
        // XP and Level system
        let playerXP = 0;
        let playerLevel = 1;
        let xpToNextLevel = 100;
        let showUpgradeMenu = false;
        let availableUpgrades = [];
        let upgradeMenuTimer = 0;
        
        // Currency and Store system
        let playerCurrency = 0;
        let showStore = false;
        let storeScrollY = 0; // Scroll position for store
        let currentWeapon = 'pistol';
        
        // High Score System
        let highScores = [];
        let currentScore = 0;
        let isNewHighScore = false;
        
        // Safe zone (village in the center)
        const safeZone = {
            x: canvas.width / 2 - 100,
            y: canvas.height / 2 - 100,
            width: 200,
            height: 200
        };
        
        // Player
        const player = {
            x: canvas.width / 2,
            y: canvas.height / 2,
            size: 15,
            speed: 4,
            health: 50,
            maxHealth: 50,
            attackCooldown: 0,
            attackRate: 15,
            damage: 25,
            facingAngle: 0,
            healRate: 0.1,
            piercingShots: false,
            explosiveRounds: false,
            lifeSteal: 0
        };
        
        // Input handling
        const keys = {};
        const mouse = { x: 0, y: 0, pressed: false };
        
        // Auto-targeting system
        let autoTargetEnabled = true;
        let targetedZombie = null;
        let targetingRange = 200; // Auto-target range in pixels
        
        // Zombies array
        let zombies = [];
        
        // Bullets array
        let bullets = [];
        
        // Particles for effects
        let particles = [];
        
        // AI Companions array
        let companions = [];
        let maxCompanions = 5;
        let companionCost = 500;
        
        // Companion upgrade system
        let selectedCompanionIndex = -1;
        
        // Companion names and appearances
        const companionTypes = [
            {gender: 'male', names: ['Alex', 'Marcus', 'David', 'Ryan', 'Chris'], color: '#4169E1', hairColor: '#8B4513'},
            
            
        ];
        
        // Wall system for village defense
        let walls = [];
        const wallSegmentSize = 40;
        let wallRebuildCost = 50;
        const wallRebuildTime = 2000; // 2 seconds to rebuild
        
        // Construction tools system
        let playerHasHammer = false;
        let playerHasNails = 0;
        let playerHasWood = 0;
        const toolCost = 75;
        const nailsPerWall = 5;
        const woodPerWall = 3;
        
        // Massive weapon system with 100+ levels and weapon tiers
        const weapons = {
            // ═══════════════ COMMON TIER WEAPONS ═══════════════
            
            // SIDEARMS (Level 1-15)
            pistol: { name: 'Pistol', damage: 25, fireRate: 15, price: 0, unlockLevel: 1, category: 'Sidearm', tier: 'Common', special: null, description: 'Basic starting weapon' },
            revolver: { name: 'Revolver', damage: 45, fireRate: 25, price: 1600, unlockLevel: 3, category: 'Sidearm', tier: 'Common', special: null, description: 'High damage, slow reload' },
            glock: { name: 'Glock 17', damage: 30, fireRate: 12, price: 2400, unlockLevel: 5, category: 'Sidearm', tier: 'Common', special: null, description: 'Reliable automatic pistol' },
            deagle: { name: 'Desert Eagle', damage: 80, fireRate: 30, price: 4800, unlockLevel: 8, category: 'Sidearm', tier: 'Common', special: 'pierce', description: 'Hand cannon' },
            
            // ASSAULT RIFLES (Level 3-25)
            assaultRifle: { name: 'Assault Rifle', damage: 30, fireRate: 8, price: 2000, unlockLevel: 3, category: 'Assault', tier: 'Common', special: null, description: 'Standard military rifle' },
            ak47: { name: 'AK-47', damage: 40, fireRate: 10, price: 3200, unlockLevel: 5, category: 'Assault', tier: 'Common', special: null, description: 'Reliable communist rifle' },
            m4carbine: { name: 'M4 Carbine', damage: 28, fireRate: 6, price: 4000, unlockLevel: 7, category: 'Assault', tier: 'Common', special: null, description: 'Tactical carbine' },
            scar: { name: 'SCAR-H', damage: 50, fireRate: 12, price: 6000, unlockLevel: 10, category: 'Assault', tier: 'Common', special: null, description: 'Heavy assault rifle' },
            famas: { name: 'FAMAS', damage: 35, fireRate: 5, price: 7200, unlockLevel: 12, category: 'Assault', tier: 'Common', special: 'burst', description: 'French bullpup rifle' },
            
            // SUBMACHINE GUNS (Level 4-20)
            mp5: { name: 'MP5', damage: 22, fireRate: 5, price: 2400, unlockLevel: 4, category: 'SMG', tier: 'Common', special: null, description: 'German engineering' },
            uzi: { name: 'Uzi', damage: 18, fireRate: 3, price: 3000, unlockLevel: 6, category: 'SMG', tier: 'Common', special: null, description: 'Israeli street sweeper' },
            p90: { name: 'P90', damage: 26, fireRate: 4, price: 4400, unlockLevel: 8, category: 'SMG', tier: 'Common', special: null, description: 'Belgian PDW' },
            mp7: { name: 'MP7', damage: 24, fireRate: 3, price: 5200, unlockLevel: 11, category: 'SMG', tier: 'Common', special: null, description: 'Compact PDW' },
            vector: { name: 'Vector', damage: 20, fireRate: 2, price: 6400, unlockLevel: 14, category: 'SMG', tier: 'Common', special: null, description: 'Ultra high ROF' },
            
            // SHOTGUNS (Level 5-30)
            shotgun: { name: 'Shotgun', damage: 80, fireRate: 25, price: 3200, unlockLevel: 5, category: 'Shotgun', tier: 'Common', special: 'spread', description: 'Pump action classic' },
            doubleBarrel: { name: 'Double Barrel', damage: 120, fireRate: 35, price: 4800, unlockLevel: 7, category: 'Shotgun', tier: 'Common', special: 'spread', description: 'Side by side power' },
            autoShotgun: { name: 'Auto Shotgun', damage: 65, fireRate: 12, price: 7200, unlockLevel: 10, category: 'Shotgun', tier: 'Common', special: 'spread', description: 'Semi-auto shotgun' },
            benelliM4: { name: 'Benelli M4', damage: 90, fireRate: 15, price: 8800, unlockLevel: 13, category: 'Shotgun', tier: 'Common', special: 'spread', description: 'Combat shotgun' },
            aa12: { name: 'AA-12', damage: 70, fireRate: 8, price: 11200, unlockLevel: 16, category: 'Shotgun', tier: 'Common', special: 'spread', description: 'Full-auto shotgun' },
            
            // SNIPER RIFLES (Level 6-35)
            huntingRifle: { name: 'Hunting Rifle', damage: 150, fireRate: 45, price: 1200, unlockLevel: 6, category: 'Sniper', tier: 'Common', special: 'pierce', description: 'Civilian hunting rifle' },
            m24: { name: 'M24 SWS', damage: 200, fireRate: 50, price: 1800, unlockLevel: 9, category: 'Sniper', tier: 'Common', special: 'pierce', description: 'Military sniper rifle' },
            barrett50cal: { name: 'Barrett .50 Cal', damage: 300, fireRate: 60, price: 2500, unlockLevel: 12, category: 'Sniper', tier: 'Common', special: 'pierce', description: 'Anti-material rifle' },
            awp: { name: 'AWP', damage: 280, fireRate: 55, price: 3000, unlockLevel: 15, category: 'Sniper', tier: 'Common', special: 'pierce', description: 'Arctic warfare rifle' },
            intervention: { name: 'Intervention', damage: 350, fireRate: 65, price: 3500, unlockLevel: 18, category: 'Sniper', tier: 'Common', special: 'pierce', description: 'CheyTac M200' },
            
            // LIGHT MACHINE GUNS (Level 8-40)
            minigun: { name: 'Minigun', damage: 35, fireRate: 3, price: 2000, unlockLevel: 8, category: 'LMG', tier: 'Common', special: 'spinup', description: 'Gatling gun' },
            m249saw: { name: 'M249 SAW', damage: 45, fireRate: 7, price: 2200, unlockLevel: 9, category: 'LMG', tier: 'Common', special: null, description: 'Squad automatic weapon' },
            m60: { name: 'M60', damage: 60, fireRate: 10, price: 2800, unlockLevel: 12, category: 'LMG', tier: 'Common', special: null, description: 'The Pig' },
            pkm: { name: 'PKM', damage: 55, fireRate: 9, price: 3200, unlockLevel: 15, category: 'LMG', tier: 'Common', special: null, description: 'Russian LMG' },
            
            // ═══════════════ RARE TIER WEAPONS ═══════════════
            
            // MELEE WEAPONS (Level 10-50)
            knife: { name: 'Combat Knife', damage: 100, fireRate: 8, price: 1500, unlockLevel: 10, category: 'Melee', tier: 'Rare', special: 'melee', description: 'Close quarters blade' },
            katana: { name: 'Katana', damage: 180, fireRate: 12, price: 3000, unlockLevel: 15, category: 'Melee', tier: 'Rare', special: 'melee_pierce', description: 'Japanese sword' },
            chainsaw: { name: 'Chainsaw', damage: 80, fireRate: 2, price: 4000, unlockLevel: 20, category: 'Melee', tier: 'Rare', special: 'melee_continuous', description: 'Mechanical mayhem' },
            lightsaber: { name: 'Lightsaber', damage: 250, fireRate: 6, price: 8000, unlockLevel: 25, category: 'Melee', tier: 'Rare', special: 'melee_energy', description: 'Elegant weapon' },
            
            // EXPLOSIVE WEAPONS (Level 10-45)
            rocketLauncher: { name: 'Rocket Launcher', damage: 200, fireRate: 80, price: 3000, unlockLevel: 10, category: 'Explosive', tier: 'Rare', special: 'explosive', description: 'Anti-vehicle rocket' },
            grenadeLauncher: { name: 'Grenade Launcher', damage: 120, fireRate: 50, price: 2800, unlockLevel: 11, category: 'Explosive', tier: 'Rare', special: 'explosive', description: 'Bouncing grenades' },
            mortarCannon: { name: 'Mortar Cannon', damage: 300, fireRate: 100, price: 5000, unlockLevel: 18, category: 'Explosive', tier: 'Rare', special: 'explosive_arc', description: 'Artillery piece' },
            bazooka: { name: 'Bazooka', damage: 250, fireRate: 75, price: 4200, unlockLevel: 16, category: 'Explosive', tier: 'Rare', special: 'explosive', description: 'WWII tank buster' },
            
            // ENERGY WEAPONS (Level 12-60)
            laserRifle: { name: 'Laser Rifle', damage: 60, fireRate: 8, price: 3500, unlockLevel: 12, category: 'Energy', tier: 'Rare', special: 'laser', description: 'Focused light beam' },
            plasmaGun: { name: 'Plasma Gun', damage: 80, fireRate: 15, price: 4000, unlockLevel: 14, category: 'Energy', tier: 'Rare', special: 'plasma', description: 'Superheated matter' },
            railgun: { name: 'Railgun', damage: 400, fireRate: 90, price: 5000, unlockLevel: 16, category: 'Energy', tier: 'Rare', special: 'railgun', description: 'Electromagnetic accelerator' },
            ionCannon: { name: 'Ion Cannon', damage: 150, fireRate: 25, price: 6000, unlockLevel: 20, category: 'Energy', tier: 'Rare', special: 'ion', description: 'Charged particle beam' },
            teslaGun: { name: 'Tesla Gun', damage: 90, fireRate: 5, price: 7000, unlockLevel: 22, category: 'Energy', tier: 'Rare', special: 'electric', description: 'Electrical discharge' },
            
            // ═══════════════ EPIC TIER WEAPONS ═══════════════
            
            // SPECIAL WEAPONS (Level 15-70)
            flamethrower: { name: 'Flamethrower', damage: 25, fireRate: 2, price: 3200, unlockLevel: 15, category: 'Special', tier: 'Epic', special: 'flame', description: 'Continuous fire' },
            frostGun: { name: 'Frost Gun', damage: 40, fireRate: 12, price: 3800, unlockLevel: 17, category: 'Special', tier: 'Epic', special: 'freeze', description: 'Cryogenic weapon' },
            acidSprayer: { name: 'Acid Sprayer', damage: 60, fireRate: 8, price: 4500, unlockLevel: 20, category: 'Special', tier: 'Epic', special: 'acid', description: 'Corrosive spray' },
            gravityCannon: { name: 'Gravity Cannon', damage: 120, fireRate: 40, price: 8000, unlockLevel: 25, category: 'Special', tier: 'Epic', special: 'gravity', description: 'Manipulates gravity' },
            vortexGun: { name: 'Vortex Gun', damage: 100, fireRate: 35, price: 9000, unlockLevel: 28, category: 'Special', tier: 'Epic', special: 'vortex', description: 'Creates black holes' },
            
            // EXOTIC WEAPONS (Level 20-80)
            naniteSwarm: { name: 'Nanite Swarm', damage: 50, fireRate: 1, price: 10000, unlockLevel: 30, category: 'Exotic', tier: 'Epic', special: 'nanites', description: 'Self-replicating bots' },
            darkMatter: { name: 'Dark Matter Gun', damage: 200, fireRate: 60, price: 12000, unlockLevel: 35, category: 'Exotic', tier: 'Epic', special: 'darkmatter', description: 'Exotic matter weapon' },
            quantumRifle: { name: 'Quantum Rifle', damage: 180, fireRate: 45, price: 14000, unlockLevel: 38, category: 'Exotic', tier: 'Epic', special: 'quantum', description: 'Probability weapon' },
            antimatterCannon: { name: 'Antimatter Cannon', damage: 400, fireRate: 120, price: 18000, unlockLevel: 42, category: 'Exotic', tier: 'Epic', special: 'antimatter', description: 'Annihilation weapon' },
            
            // ═══════════════ LEGENDARY TIER WEAPONS ═══════════════
            
            // LEGENDARY WEAPONS (Level 25-90)
            chaingun: { name: 'Chaingun', damage: 50, fireRate: 2, price: 18000, unlockLevel: 18, category: 'LMG', tier: 'Legendary', special: 'spinup', description: 'Multi-barrel mayhem' },
            gaussRifle: { name: 'Gauss Rifle', damage: 500, fireRate: 80, price: 100000, unlockLevel: 45, category: 'Energy', tier: 'Legendary', special: 'gauss', description: 'Coilgun technology' },
            neutronBlaster: { name: 'Neutron Blaster', damage: 300, fireRate: 50, price: 125000, unlockLevel: 50, category: 'Energy', tier: 'Legendary', special: 'neutron', description: 'Nuclear particle beam' },
            photonCannon: { name: 'Photon Cannon', damage: 250, fireRate: 30, price: 150000, unlockLevel: 55, category: 'Energy', tier: 'Legendary', special: 'photon', description: 'Pure light weapon' },
            singularityGun: { name: 'Singularity Gun', damage: 600, fireRate: 150, price: 200000, unlockLevel: 60, category: 'Exotic', tier: 'Legendary', special: 'singularity', description: 'Creates micro black holes' },
            
            // DIVINE WEAPONS (Level 40-95)
            angelicHarp: { name: 'Angelic Harp', damage: 150, fireRate: 20, price: 175000, unlockLevel: 65, category: 'Divine', tier: 'Legendary', special: 'holy', description: 'Heavenly music weapon' },
            demonicScythe: { name: 'Demonic Scythe', damage: 400, fireRate: 40, price: 225000, unlockLevel: 70, category: 'Divine', tier: 'Legendary', special: 'demonic', description: 'Soul reaper' },
            thunderHammer: { name: 'Thunder Hammer', damage: 500, fireRate: 60, price: 250000, unlockLevel: 75, category: 'Divine', tier: 'Legendary', special: 'thunder', description: 'Lightning weapon' },
            
            // ═══════════════ MYTHIC TIER WEAPONS ═══════════════
            
            // MYTHIC WEAPONS (Level 50-100)
            bfg9000: { name: 'BFG-9000', damage: 500, fireRate: 120, price: 50000, unlockLevel: 20, category: 'Ultimate', tier: 'Mythic', special: 'bfg', description: 'Big F***ing Gun' },
            worldEnder: { name: 'World Ender', damage: 1000, fireRate: 180, price: 500000, unlockLevel: 80, category: 'Apocalypse', tier: 'Mythic', special: 'apocalypse', description: 'Planet destroyer' },
            realityRipper: { name: 'Reality Ripper', damage: 800, fireRate: 100, price: 750000, unlockLevel: 85, category: 'Cosmic', tier: 'Mythic', special: 'reality', description: 'Tears through dimensions' },
            infinityGauntlet: { name: 'Infinity Gauntlet', damage: 1500, fireRate: 200, price: 1250000, unlockLevel: 90, category: 'Cosmic', tier: 'Mythic', special: 'infinity', description: 'Ultimate power' },
            creatorsMallet: { name: 'Creator\'s Mallet', damage: 2000, fireRate: 300, price: 2500000, unlockLevel: 95, category: 'Divine', tier: 'Mythic', special: 'creation', description: 'Universe shaper' },
            
            // PRESTIGE WEAPONS (Level 100+)
            omegaDestroyer: { name: 'Omega Destroyer', damage: 3000, fireRate: 400, price: 1000000, unlockLevel: 100, category: 'Transcendent', tier: 'Transcendent', special: 'omega', description: 'Beyond comprehension' }
        };
        
        // Construction supplies for wall rebuilding
        const constructionSupplies = {
            hammer: { price: 75, name: "Hammer", description: "Essential tool for wall rebuilding", type: "tool" },
            nails: { price: 10, quantity: 10, name: "Nails (x10)", description: "Metal nails for construction", type: "supply" },
            wood: { price: 15, quantity: 5, name: "Wood Planks (x5)", description: "Wooden planks for walls", type: "supply" }
        };
        
        // Upgrade system
        const upgradeTypes = [
            {name: 'Health Boost', description: '+10 Max Health', apply: () => { player.maxHealth += 10; player.health += 10; }},
            {name: 'Power Shot', description: '+7 Damage', apply: () => { player.damage += 7; }},
            {name: 'Speed Boost', description: '+0.5 Movement Speed', apply: () => { player.speed += 0.5; }},
            {name: 'bulletPiercing', description: 'Bullets pierce 1 extra zombie', apply: () => { player.piercingShots = true; }},
            {name: 'explosiveRounds', description: 'Bullets explode on impact', apply: () => { player.explosiveRounds = true; }},
            {name: 'Life Steal', description: 'Heal 2 HP per kill', apply: () => { player.lifeSteal = 2; }},
            {name: 'Rapid Fire', description: '-2 Attack Cooldown', apply: () => { if (player.attackRate > 5) player.attackRate -= 2; }},
            {name: 'Heal Over Time', description: '+0.2 HP/sec Regen', apply: () => { player.healRate += 0.2; }},
            {name: 'Increased Targeting', description: '+50 Auto-Target Range', apply: () => { targetingRange += 50; }},
            {name: 'Companion Capacity', description: '+1 Max Companion', apply: () => { maxCompanions += 1; }},
            {name: 'Wall Repair Efficiency', description: 'Rebuild walls for 10% less resources', apply: () => { wallRebuildCost = Math.max(10, Math.floor(wallRebuildCost * 0.9)); }},
            {name: 'Faster Wall Repair', description: 'Walls rebuild 20% faster', apply: () => { /* Implement faster rebuild time if needed */ }}
        ];
        
        // Zombie class
        class Zombie {
            constructor(x, y, type = 'normal') {
                this.x = x;
                this.y = y;
                this.type = type;
                this.xpValue = 10;
                
                // Set stats based on type, level, and difficulty mode
                if (gameDifficulty === 'easy') {
                    // Easy mode - reduced stats for casual play
                    if (type === 'miniboss') {
                        this.size = 18;
                        this.speed = 0.5 + (wave * 0.015); // Slower speed scaling
                        this.health = 120 + (wave * 12) + Math.floor(wave / 12) * 80; // Reduced health scaling
                        this.damage = 15 + Math.floor(wave / 6) * 4; // Reduced damage scaling
                        this.xpValue = 50 + (wave * 2);
                        this.currencyValue = 25 + (wave * 1);
                    } else if (type === 'boss') {
                        this.size = 25;
                        this.speed = 0.3 + (wave * 0.012); // Slow speed scaling
                        this.health = 300 + (wave * 30) + Math.floor(wave / 12) * 150; // Reduced health scaling
                        this.damage = 25 + Math.floor(wave / 4) * 8; // Reduced damage scaling
                        this.xpValue = 200 + (wave * 5);
                        this.currencyValue = 100 + (wave * 3);
                    } else {
                        this.size = 12;
                        this.speed = 0.7 + (wave * 0.025); // Moderate speed scaling
                        this.health = 40 + (wave * 6) + Math.floor(wave / 18) * 40; // Reduced health scaling
                        this.damage = 8 + Math.floor(wave / 10) * 2; // Reduced damage scaling
                        this.xpValue = 10 + Math.floor(wave / 5);
                        this.currencyValue = 10 + Math.floor(wave / 10);
                    }
                } else if (gameDifficulty === 'normal') {
                    // Normal mode - original balanced stats
                    if (type === 'miniboss') {
                        this.size = 18;
                        this.speed = 0.6 + (wave * 0.02); // Original speed scaling
                        this.health = 150 + (wave * 15) + Math.floor(wave / 10) * 100; // Original health scaling
                        this.damage = 20 + Math.floor(wave / 5) * 5; // Original damage scaling
                        this.xpValue = 50 + (wave * 2);
                        this.currencyValue = 25 + (wave * 1);
                    } else if (type === 'boss') {
                        this.size = 25;
                        this.speed = 0.4 + (wave * 0.015); // Original speed scaling
                        this.health = 400 + (wave * 40) + Math.floor(wave / 10) * 200; // Original health scaling
                        this.damage = 35 + Math.floor(wave / 3) * 10; // Original damage scaling
                        this.xpValue = 200 + (wave * 5);
                        this.currencyValue = 100 + (wave * 3);
                    } else {
                        this.size = 12;
                        this.speed = 0.8 + (wave * 0.03); // Original speed scaling
                        this.health = 50 + (wave * 8) + Math.floor(wave / 15) * 50; // Original health scaling
                        this.damage = 10 + Math.floor(wave / 8) * 3; // Original damage scaling
                        this.xpValue = 10 + Math.floor(wave / 5);
                        this.currencyValue = 10 + Math.floor(wave / 10);
                    }
                } else {
                    // Hardcore mode - brutal scaling
                    if (type === 'miniboss') {
                        this.size = 18;
                        this.speed = 0.8 + (wave * 0.04); // Faster and more aggressive scaling
                        this.health = 300 + (wave * 30) + Math.floor(wave / 5) * 150; // Double base health, more frequent boosts
                        this.damage = 40 + Math.floor(wave / 3) * 10; // Double base damage, frequent increases
                        this.xpValue = 50 + (wave * 2);
                        this.currencyValue = 25 + (wave * 1);
                    } else if (type === 'boss') {
                        this.size = 25;
                        this.speed = 0.6 + (wave * 0.03); // Much faster bosses
                        this.health = 800 + (wave * 80) + Math.floor(wave / 5) * 300; // Double base health, massive scaling
                        this.damage = 70 + Math.floor(wave / 2) * 15; // Double base damage, very frequent increases
                        this.xpValue = 200 + (wave * 5);
                        this.currencyValue = 100 + (wave * 3);
                    } else {
                        this.size = 12;
                        this.speed = 1.0 + (wave * 0.05); // Much faster normal zombies
                        this.health = 100 + (wave * 16) + Math.floor(wave / 8) * 80; // Double base health and scaling
                        this.damage = 20 + Math.floor(wave / 4) * 6; // Double base damage, more frequent increases
                        this.xpValue = 10 + Math.floor(wave / 5);
                        this.currencyValue = 10 + Math.floor(wave / 10);
                    }
                }
                
                this.maxHealth = this.health;
                this.attackCooldown = 0;
                this.attackRate = 60;
                
                // Random zombie appearance (more infected/decayed)
                this.skinTone = ['#8FBC8F', '#9ACD32', '#6B8E23', '#556B2F', '#808080'][Math.floor(Math.random() * 5)]; // Green/gray infected skin
                this.clothingColor = ['#8B0000', '#4B0000', '#2F2F2F', '#654321', '#800000'][Math.floor(Math.random() * 5)]; // Darker, bloodier clothes
                this.hairColor = ['#2F4F2F', '#000000', '#4B0000', '#654321'][Math.floor(Math.random() * 4)]; // Darker, matted hair
                this.woundCount = Math.floor(Math.random() * 5) + 3; // Random wounds
                this.missingLimbs = Math.random() > 0.8; // 20% chance of missing limbs
            }
            
            update() {
                // Move towards nearest wall instead of player
                let targetWall = null;
                let nearestWallDistance = Infinity;
                let wallCenterX = null;
                let wallCenterY = null;
                walls.forEach(wall => {
                    if (!wall.isDestroyed) {
                        const centerX = wall.x + wall.width / 2;
                        const centerY = wall.y + wall.height / 2;
                        const wallDistance = Math.sqrt((this.x - centerX) ** 2 + (this.y - centerY) ** 2);
                        if (wallDistance < nearestWallDistance) {
                            nearestWallDistance = wallDistance;
                            targetWall = wall;
                            wallCenterX = centerX;
                            wallCenterY = centerY;
                        }
                    }
                });
                let dx, dy, distance;
                if (targetWall) {
                    dx = wallCenterX - this.x;
                    dy = wallCenterY - this.y;
                    distance = Math.sqrt(dx * dx + dy * dy);
                } else {
                    // If no wall exists, default to not moving
                    dx = 0;
                    dy = 0;
                    distance = 1;
                }
                
                // First check if zombie can attack walls
                // ...existing code...
                
                if (targetWall && nearestWallDistance <= this.size + 20 && this.attackCooldown <= 0) {
                    // Attack the wall
                    targetWall.takeDamage(this.damage * 0.5);
                    this.attackCooldown = this.attackRate;
                    createBloodEffect(this.x, this.y); // Visual feedback
                    return; // Don't move while attacking wall
                }

                if (distance > this.size + (targetWall ? targetWall.width / 2 : 0)) {
                    const nextX = this.x + (dx / distance) * this.speed;
                    const nextY = this.y + (dy / distance) * this.speed;
                    // Check for direct collision with any intact wall
                    let wallCollision = false;
                    for (let wall of walls) {
                        if (!wall.canZombiePass()) {
                            // Check if zombie would intersect with wall at next position
                            if (this.intersectsRect(nextX, nextY, wall.x, wall.y, wall.width, wall.height)) {
                                wallCollision = true;
                                break;
                            }
                        }
                    }
                    if (!wallCollision) {
                        this.x = nextX;
                        this.y = nextY;
                    }
                }
                
                // Check for player collision and attack
                const playerDistance = Math.sqrt((this.x - player.x) ** 2 + (this.y - player.y) ** 2);
                if (playerDistance <= this.size + player.size + 5 && this.attackCooldown <= 0) {
                    // Attack the player
                    player.health -= this.damage;
                    this.attackCooldown = this.attackRate;
                    createBloodEffect(player.x, player.y); // Visual feedback
                    
                    // Prevent player health from going below 0
                    if (player.health < 0) {
                        player.health = 0;
                    }
                }
                
                // Removed unreachable code after wall movement logic
                if (this.attackCooldown > 0) this.attackCooldown--;
            }
            
            draw() {
                ctx.save();
                ctx.translate(this.x, this.y);
                
                // Zombie shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.beginPath();
                ctx.ellipse(0, this.size + 2, this.size * 0.8, this.size * 0.3, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // Boss/Mini-boss glow effects
                if (this.type === 'boss') {
                    ctx.shadowColor = '#FF0000';
                    ctx.shadowBlur = 20;
                } else if (this.type === 'miniboss') {
                    ctx.shadowColor = '#FF4400';
                    ctx.shadowBlur = 10;
                }
                
                // Infected zombie head with decay
                ctx.fillStyle = this.skinTone;
                ctx.beginPath();
                ctx.arc(0, -this.size * 0.3, this.size * 0.4, 0, Math.PI * 2);
                ctx.fill();
                
                // Add infection spots on head
                ctx.fillStyle = '#2F4F2F';
                for (let i = 0; i < 3; i++) {
                    const angle = (i * Math.PI * 2 / 3) + Math.PI;
                    const spotX = Math.cos(angle) * (this.size * 0.25);
                    const spotY = -this.size * 0.3 + Math.sin(angle) * (this.size * 0.25);
                    ctx.beginPath();
                    ctx.arc(spotX, spotY, this.size * 0.06, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // Zombie body (torn/bloody clothing)
                ctx.fillStyle = this.clothingColor;
                ctx.fillRect(-this.size * 0.4, -this.size * 0.1, this.size * 0.8, this.size * 0.8);
                
                // Add blood stains on clothing
                ctx.fillStyle = '#4B0000';
                ctx.beginPath();
                ctx.arc(-this.size * 0.2, this.size * 0.2, this.size * 0.1, 0, Math.PI * 2);
                ctx.arc(this.size * 0.1, this.size * 0.4, this.size * 0.08, 0, Math.PI * 2);
                ctx.fill();
                
                // Arms (potentially missing or damaged)
                ctx.fillStyle = this.skinTone;
                if (!this.missingLimbs || Math.random() > 0.5) {
                    ctx.fillRect(-this.size * 0.6, -this.size * 0.05, this.size * 0.15, this.size * 0.6);
                }
                if (!this.missingLimbs || Math.random() > 0.5) {
                    ctx.fillRect(this.size * 0.45, -this.size * 0.05, this.size * 0.15, this.size * 0.6);
                }
                
                // Legs (potentially damaged)
                ctx.fillStyle = this.type === 'boss' ? '#000000' : '#2F2F2F';
                if (!this.missingLimbs || Math.random() > 0.3) {
                    ctx.fillRect(-this.size * 0.25, this.size * 0.6, this.size * 0.2, this.size * 0.4);
                }
                if (!this.missingLimbs || Math.random() > 0.3) {
                    ctx.fillRect(this.size * 0.05, this.size * 0.6, this.size * 0.2, this.size * 0.4);
                }
                
                ctx.shadowBlur = 0;
                
                // Matted/balding zombie hair  
                ctx.fillStyle = this.hairColor;
                ctx.beginPath();
                // Patchy hair (not a full semicircle)
                ctx.arc(-this.size * 0.2, -this.size * 0.5, this.size * 0.15, Math.PI * 0.8, Math.PI * 1.2);
                ctx.arc(this.size * 0.15, -this.size * 0.5, this.size * 0.12, Math.PI * 1.8, Math.PI * 2.2);
                ctx.fill();
                
                // Glowing infected zombie eyes (asymmetrical/damaged)
                ctx.shadowColor = this.type === 'boss' ? '#FF0000' : '#FF4400';
                ctx.shadowBlur = this.type === 'boss' ? 10 : 6;
                ctx.fillStyle = this.type === 'boss' ? '#FF0000' : '#FF4400';
                
                // Left eye (normal)
                ctx.beginPath();
                ctx.arc(-this.size * 0.15, -this.size * 0.35, this.size * 0.05, 0, Math.PI * 2);
                ctx.fill();
                
                // Right eye (potentially missing or damaged)
                if (Math.random() > 0.2) { // 80% chance of having right eye
                    ctx.beginPath();
                    ctx.arc(this.size * 0.15, -this.size * 0.35, this.size * 0.05, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    // Missing eye socket
                    ctx.fillStyle = '#000000';
                    ctx.beginPath();
                    ctx.arc(this.size * 0.15, -this.size * 0.35, this.size * 0.06, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.shadowBlur = 0;
                
                // Zombie mouth (gaping/torn)
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.ellipse(0, -this.size * 0.15, this.size * 0.12, this.size * 0.08, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // Jagged/broken zombie teeth
                ctx.fillStyle = '#FFFFCC';
                const teethPositions = [-this.size * 0.08, -this.size * 0.04, 0, this.size * 0.04, this.size * 0.08];
                teethPositions.forEach((pos, i) => {
                    if (Math.random() > 0.3) { // 70% chance tooth exists
                        const toothHeight = (Math.random() * this.size * 0.06) + this.size * 0.03;
                        ctx.fillRect(pos, -this.size * 0.18, this.size * 0.015, toothHeight);
                    }
                });
                
                // Multiple wound/decay spots
                for (let i = 0; i < this.woundCount; i++) {
                    // Random wound positions
                    const woundX = (Math.random() - 0.5) * this.size * 1.2;
                    const woundY = (Math.random() - 0.5) * this.size * 1.2;
                    const woundSize = Math.random() * this.size * 0.08 + this.size * 0.03;
                    
                    // Wound colors (dark red to black)
                    const woundColors = ['#8B0000', '#4B0000', '#2F0000', '#1A0000', '#000000'];
                    ctx.fillStyle = woundColors[Math.floor(Math.random() * woundColors.length)];
                    
                    ctx.beginPath();
                    ctx.arc(woundX, woundY, woundSize, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Add smaller inner wound
                    ctx.fillStyle = '#000000';
                    ctx.beginPath();
                    ctx.arc(woundX, woundY, woundSize * 0.5, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // Add dripping blood effect for bosses
                if (this.type === 'boss') {
                    ctx.fillStyle = '#8B0000';
                    for (let i = 0; i < 3; i++) {
                        const dripX = (Math.random() - 0.5) * this.size * 0.8;
                        const dripY = this.size * 0.4 + Math.random() * this.size * 0.3;
                        ctx.fillRect(dripX, dripY, this.size * 0.02, this.size * 0.1);
                    }
                }
                
                ctx.restore();
                
                // Health bar
                if (this.health < this.maxHealth) {
                    const barWidth = this.size * 2.5;
                    const barHeight = 4;
                    const barY = this.y - this.size - 8;
                    
                    ctx.fillStyle = this.type === 'boss' ? '#8B0000' : '#4B0000';
                    ctx.fillRect(this.x - barWidth/2, barY, barWidth, barHeight);
                    
                    const healthPercent = this.health / this.maxHealth;
                    ctx.fillStyle = this.type === 'boss' ? '#FF0000' : '#FF4444';
                    ctx.fillRect(this.x - barWidth/2, barY, barWidth * healthPercent, barHeight);
                }
            }
            
            intersectsRect(x, y, rectX, rectY, rectW, rectH) {
                // Check if zombie (as circle) intersects with rectangle (wall)
                const closestX = Math.max(rectX, Math.min(x, rectX + rectW));
                const closestY = Math.max(rectY, Math.min(y, rectY + rectH));
                const distanceX = x - closestX;
                const distanceY = y - closestY;
                const distanceSquared = distanceX * distanceX + distanceY * distanceY;
                return distanceSquared <= (this.size * this.size);
            }
        }
        
        // Bullet class
        class Bullet {
            constructor(x, y, angle, weaponType = 'pistol') {
                this.x = x;
                this.y = y;
                this.size = 4;
                this.speed = 12;
                this.angle = angle;
                this.lifetime = 60;
                this.damage = player.damage;
                this.weaponType = weaponType;
                this.special = weapons[weaponType].special;
                
                // Special weapon properties
                if (this.special === 'spread') {
                    // Shotgun spread - create multiple pellets
                    this.isPellet = false;
                } else if (this.special === 'explosive') {
                    this.size = 6;
                    this.speed = 8;
                } else if (this.special === 'laser') {
                    this.size = 2;
                    this.speed = 20;
                    this.lifetime = 30;
                } else if (this.special === 'plasma') {
                    this.size = 8;
                    this.speed = 10;
                } else if (this.special === 'railgun') {
                    this.size = 3;
                    this.speed = 25;
                    this.lifetime = 40;
                } else if (this.special === 'flame') {
                    this.size = 12;
                    this.speed = 6;
                    this.lifetime = 20;
                } else if (this.special === 'bfg') {
                    this.size = 15;
                    this.speed = 8;
                    this.damage *= 2;
                }
            }
            
            update() {
                this.x += Math.cos(this.angle) * this.speed;
                this.y += Math.sin(this.angle) * this.speed;
                this.lifetime--;
                
                // Check collision with zombies
                let hasHit = false;
                for (let i = zombies.length - 1; i >= 0; i--) {
                    const zombie = zombies[i];
                    const dx = this.x - zombie.x;
                    const dy = this.y - zombie.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < this.size + zombie.size) {
                        zombie.health -= this.damage;
                        createHitEffect(this.x, this.y);
                        hasHit = true;
                        
                        if (zombie.health <= 0) {
                            // Give XP, score, and currency
                            playerXP += zombie.xpValue;
                            playerCurrency += zombie.currencyValue;
                            score += zombie.xpValue * wave;
                            zombiesKilled++;
                            
                            console.log(`Zombie killed! Progress: ${zombiesKilled}/${zombiesPerWave} (${zombie.type})`);
                            
                            // Extra debug for level 7
                            if (wave === 7) {
                                console.log(`[DEBUG LEVEL 7] Zombie killed by bullet! New count: ${zombiesKilled}/${zombiesPerWave}, Remaining zombies: ${zombies.length - 1}`);
                            }
                            
                            // Life steal
                            if (player.lifeSteal > 0) {
                                player.health = Math.min(player.maxHealth, player.health + player.lifeSteal);
                            }
                            
                            createBloodEffect(zombie.x, zombie.y);
                            
                            // Explosive rounds
                            if (player.explosiveRounds) {
                                this.createExplosion(zombie.x, zombie.y);
                            }
                            
                            zombies.splice(i, 1);
                        }
                        
                        // If not piercing shots, bullet is consumed
                        if (!player.piercingShots) {
                            return true;
                        }
                    }
                }
                
                // Check if bullet is out of bounds
                if (this.x < 0 || this.x > canvas.width || 
                    this.y < 0 || this.y > canvas.height || 
                    this.lifetime <= 0) {
                    return true; // Remove bullet
                }
                
                return hasHit && !player.piercingShots;
            }
            
            createExplosion(x, y) {
                const explosionRadius = 60;
                
                // Damage nearby zombies
                zombies.forEach(zombie => {
                    const dx = zombie.x - x;
                    const dy = zombie.y - y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < explosionRadius) {
                        const explosionDamage = this.damage * 0.5 * (1 - distance / explosionRadius);
                        zombie.health -= explosionDamage;
                        
                        if (zombie.health <= 0) {
                            playerXP += zombie.xpValue;
                            playerCurrency += zombie.currencyValue;
                            score += zombie.xpValue * wave;
                            zombiesKilled++;
                            
                            console.log(`Zombie killed by explosion! Progress: ${zombiesKilled}/${zombiesPerWave} (${zombie.type})`);
                            
                            if (player.lifeSteal > 0) {
                                player.health = Math.min(player.maxHealth, player.health + player.lifeSteal);
                            }
                        }
                    }
                });
                
                // Create explosion particles
                for (let i = 0; i < 20; i++) {
                    particles.push(new Particle(x, y, '#FF4400', Math.random() * 10 + 5));
                }
                screenShake = Math.max(screenShake, 10);
            }
            
            draw() {
                // Different visuals based on weapon type
                if (this.special === 'laser') {
                    // Laser beam
                    ctx.strokeStyle = '#FF0000';
                    ctx.lineWidth = 4;
                    ctx.shadowColor = '#FF0000';
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(this.x + Math.cos(this.angle) * 20, this.y + Math.sin(this.angle) * 20);
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                } else if (this.special === 'plasma') {
                    // Plasma ball
                    ctx.shadowColor = '#00FFFF';
                    ctx.shadowBlur = 12;
                    ctx.fillStyle = '#00FFFF';
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                } else if (this.special === 'explosive') {
                    // Rocket/grenade
                    ctx.fillStyle = '#666666';
                    ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
                    ctx.fillStyle = '#FF4400';
                    ctx.beginPath();
                    ctx.arc(this.x - Math.cos(this.angle) * this.size, this.y - Math.sin(this.angle) * this.size, 2, 0, Math.PI * 2);
                    ctx.fill();
                } else if (this.special === 'railgun') {
                    // Railgun beam
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 6;
                    ctx.shadowColor = '#00FFFF';
                    ctx.shadowBlur = 15;
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(this.x + Math.cos(this.angle) * 30, this.y + Math.sin(this.angle) * 30);
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                } else if (this.special === 'flame') {
                    // Fire particle
                    const colors = ['#FF4400', '#FF6600', '#FF8800', '#FFAA00'];
                    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
                    ctx.shadowColor = '#FF4400';
                    ctx.shadowBlur = 8;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size * (0.5 + Math.random() * 0.5), 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                } else if (this.special === 'bfg') {
                    // BFG energy ball
                    ctx.shadowColor = '#00FF00';
                    ctx.shadowBlur = 20;
                    ctx.fillStyle = '#00FF00';
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Electric arcs
                    for (let i = 0; i < 3; i++) {
                        const arcX = this.x + (Math.random() - 0.5) * this.size * 2;
                        const arcY = this.y + (Math.random() - 0.5) * this.size * 2;
                        ctx.strokeStyle = '#FFFFFF';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(this.x, this.y);
                        ctx.lineTo(arcX, arcY);
                        ctx.stroke();
                    }
                    ctx.shadowBlur = 0;
                } else {
                    // Standard bullet
                    ctx.strokeStyle = 'rgba(255, 255, 68, 0.5)';
                    ctx.lineWidth = 3;
                    ctx.lineCap = 'round';
                    ctx.beginPath();
                    const trailLength = 15;
                    const trailX = this.x - Math.cos(this.angle) * trailLength;
                    const trailY = this.y - Math.sin(this.angle) * trailLength;
                    ctx.moveTo(trailX, trailY);
                    ctx.lineTo(this.x, this.y);
                    ctx.stroke();
                    
                    // Bullet glow
                    ctx.shadowColor = '#FFFF44';
                    ctx.shadowBlur = 8;
                    ctx.fillStyle = '#FFFF00';
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Bullet core
                    ctx.shadowBlur = 0;
                    ctx.fillStyle = '#FFFFFF';
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
        
        // AI Companion class
        class Companion {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.size = 12;
                this.speed = 3;
                this.health = 80;
                this.maxHealth = 80;
                this.attackCooldown = 0;
                this.attackRate = 25;
                this.damage = 20;
                this.range = 250; // Increased starting range
                this.facingAngle = 0;
                
                // Upgrade system
                // this.level = 1;
                // this.upgradePoints = 0;
                // this.damageUpgrades = 0;
                // this.rangeUpgrades = 0;
                // this.healthUpgrades = 0;
                // this.upgradeBaseCost = 50;
                
                // Assign random appearance
                const type = companionTypes[Math.floor(Math.random() * companionTypes.length)];
                this.gender = type.gender;
                this.name = type.names[Math.floor(Math.random() * type.names.length)];
                this.color = type.color;
                this.hairColor = type.hairColor;
                this.weapon = 'pistol';
                
                // AI behavior
                this.target = null;
                // this.lastZombieDistance = 0;
                // this.followDistance = 80 + Math.random() * 40; // Vary follow distance
                this.followDistance = 80 + Math.random() * 40;
                
                // Construction tools
                this.hasHammer = Math.random() > 0.5; // 50% chance to spawn with hammer
                this.hasNails = Math.floor(Math.random() * 10) + 5; // 5-15 nails
                this.hasWood = Math.floor(Math.random() * 8) + 3; // 3-10 wood pieces
                this.isBuilding = false;
            }
            
            update() {
                // Check if there are walls that need rebuilding nearby
                const nearestWall = findNearestDamagedWall(this);
                
                if (nearestWall && this.hasHammer && this.hasNails >= nailsPerWall && this.hasWood >= woodPerWall) {
                    // Move towards the damaged wall
                    const wallCenterX = nearestWall.x + nearestWall.width / 2;
                    const wallCenterY = nearestWall.y + nearestWall.height / 2;
                    const wallDistance = Math.sqrt((this.x - wallCenterX) ** 2 + (this.y - wallCenterY) ** 2);
                    
                    if (wallDistance > 50) {
                        const angleToWall = Math.atan2(wallCenterY - this.y, wallCenterX - this.x);
                        this.x += Math.cos(angleToWall) * this.speed;
                        this.y += Math.sin(angleToWall) * this.speed;
                        this.facingAngle = angleToWall;
                        this.isBuilding = true;
                        return; // Skip other actions while moving to wall
                    } else {
                        // Start rebuilding or repairing the wall
                        let success = false;
                        if (nearestWall.isDestroyed) {
                            success = nearestWall.startRebuilding();
                        } else if (nearestWall.canBeRepaired()) {
                            success = nearestWall.startRepairing();
                        }
                        
                        if (success) {
                            this.hasNails -= nailsPerWall;
                            this.hasWood -= woodPerWall;
                            this.isBuilding = true;
                            
                            // Visual feedback
                            createHitEffect(wallCenterX, wallCenterY);
                        }
                        return; // Skip other actions while rebuilding
                    }
                } else {
                    this.isBuilding = false;
                }
                
                // Move toward nearest zombie if not repairing walls
                if (this.target) {
                    const distToZombie = Math.sqrt((this.x - this.target.x) ** 2 + (this.y - this.target.y) ** 2);
                    if (distToZombie > this.size + 10) { // Don't overlap zombie
                        const angleToZombie = Math.atan2(this.target.y - this.y, this.target.x - this.x);
                        this.x += Math.cos(angleToZombie) * this.speed * 0.8;
                        this.y += Math.sin(angleToZombie) * this.speed * 0.8;
                        this.facingAngle = angleToZombie;
                    }
                }
                
                // Keep companions in bounds
                this.x = Math.max(this.size, Math.min(canvas.width - this.size, this.x));
                this.y = Math.max(this.size, Math.min(canvas.height - this.size, this.y));
                
                // Find nearest zombie to attack
                let nearestZombie = null;
                let nearestDistance = this.range;
                
                zombies.forEach(zombie => {
                    const distance = Math.sqrt((this.x - zombie.x) ** 2 + (this.y - zombie.y) ** 2);
                    if (distance < nearestDistance) {
                        nearestZombie = zombie;
                        nearestDistance = distance;
                    }
                });
                
                this.target = nearestZombie;
                
                // Attack target
                if (this.target && this.attackCooldown <= 0) {
                    this.facingAngle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
                    bullets.push(new Bullet(this.x, this.y, this.facingAngle, this.weapon));
                    this.attackCooldown = this.attackRate;
                    
                    // Screen shake for companion shots
                    screenShake = Math.max(screenShake, 2);
                }
                
                if (this.attackCooldown > 0) this.attackCooldown--;
            }
            
            draw() {
                // Draw companion body (torso)
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x - 6, this.y - 2, 12, 16);
                
                // Draw arms
                ctx.fillStyle = '#FFDBAC'; // Skin tone for arms
                ctx.fillRect(this.x - 10, this.y + 2, 4, 10); // Left arm
                ctx.fillRect(this.x + 6, this.y + 2, 4, 10);  // Right arm
                
                // Draw legs
                ctx.fillStyle = '#654321'; // Pants/leg color
                ctx.fillRect(this.x - 4, this.y + 12, 3, 8);  // Left leg
                ctx.fillRect(this.x + 1, this.y + 12, 3, 8);  // Right leg
                
                // Draw shoes
                ctx.fillStyle = '#2F4F4F';
                ctx.fillRect(this.x - 5, this.y + 19, 4, 3); // Left shoe
                ctx.fillRect(this.x + 1, this.y + 19, 4, 3);  // Right shoe
                
                // Draw head (skin tone)
                ctx.fillStyle = '#FFDBAC';
                ctx.beginPath();
                ctx.arc(this.x, this.y - 8, 8, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw hair
                ctx.fillStyle = this.hairColor;
                ctx.beginPath();
                ctx.arc(this.x, this.y - 12, 9, 0, Math.PI);
                ctx.fill();
                
                // Draw facial features
                // Eyes
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(this.x - 3, this.y - 9, 1.5, 0, Math.PI * 2);
                ctx.arc(this.x + 3, this.y - 9, 1.5, 0, Math.PI * 2);
                ctx.fill();
                
                // Eye pupils
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(this.x - 3, this.y - 9, 1, 0, Math.PI * 2);
                ctx.arc(this.x + 3, this.y - 9, 1, 0, Math.PI * 2);
                ctx.fill();
                
                // Nose
                ctx.fillStyle = '#FFCBA4';
                ctx.beginPath();
                ctx.arc(this.x, this.y - 7, 0.5, 0, Math.PI * 2);
                ctx.fill();
                
                // Mouth
                ctx.strokeStyle = '#8B4513';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(this.x, this.y - 5, 2, 0, Math.PI);
                ctx.stroke();
                
                // Draw tools/weapon based on activity
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.facingAngle);
                
                if (this.isBuilding && this.hasHammer) {
                    // Draw hammer
                    ctx.fillStyle = '#8B4513'; // Brown handle
                    ctx.fillRect(8, -1, 10, 2);
                    ctx.fillStyle = '#696969'; // Gray hammer head
                    ctx.fillRect(16, -3, 6, 6);
                } else {
                    // Draw weapon
                    ctx.fillStyle = '#333';
                    ctx.fillRect(8, -2, 12, 4);
                    
                    // Weapon barrel
                    ctx.fillStyle = '#666';
                    ctx.fillRect(18, -1, 3, 2);
                }
                ctx.restore();
                
                // Draw hands holding weapon
                ctx.fillStyle = '#FFDBAC';
                const handX = this.x + Math.cos(this.facingAngle) * 8;
                const handY = this.y + Math.sin(this.facingAngle) * 8;
                ctx.beginPath();
                ctx.arc(handX, handY, 2, 0, Math.PI * 2);
                ctx.fill();
                
                // Health bar
                if (this.health < this.maxHealth) {
                    ctx.fillStyle = 'red';
                    ctx.fillRect(this.x - 15, this.y - 25, 30, 3);
                    ctx.fillStyle = 'green';
                    ctx.fillRect(this.x - 15, this.y - 25, 30 * (this.health / this.maxHealth), 3);
                }
                
                // Draw name tag with better styling
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(this.x - 25, this.y - 35, 50, 20);
                ctx.fillStyle = 'white';
                ctx.font = '7px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(this.name, this.x, this.y - 28);
                
                // Tool and resource display
                ctx.font = '6px Arial';
                const toolText = this.hasHammer ? '🔨' : '❌';
                ctx.fillText(`${toolText} N:${this.hasNails} W:${this.hasWood}`, this.x, this.y - 20);
                
                // Gender indicator (small colored dot)
                ctx.fillStyle = this.gender === 'male' ? '#4169E1' : 
                               this.gender === 'female' ? '#FF69B4' : '#9370DB';
                ctx.beginPath();
                ctx.arc(this.x + 20, this.y - 32, 2, 0, Math.PI * 2);
                ctx.fill();
                
                // Construction tool belt when they have tools
                if (this.hasHammer || this.hasNails > 0 || this.hasWood > 0) {
                    ctx.fillStyle = '#8B4513';
                    ctx.fillRect(this.x - 8, this.y + 8, 16, 4);
                    
                    // Tool pouches
                    if (this.hasNails > 0) {
                        ctx.fillStyle = '#DAA520';
                        ctx.fillRect(this.x - 6, this.y + 6, 4, 6);
                    }
                    if (this.hasWood > 0) {
                        ctx.fillStyle = '#8B6914';
                        ctx.fillRect(this.x + 2, this.y + 6, 4, 6);
                    }
                }
            }
            
            // Upgrade methods
            canUpgrade(upgradeType) {
                const cost = this.getUpgradeCost(upgradeType);
                return playerCurrency >= cost;
            }
            
            getUpgradeCost(upgradeType) {
                let upgradeLevel = 0;
                switch(upgradeType) {
                    case 'damage': upgradeLevel = this.damageUpgrades; break;
                    case 'range': upgradeLevel = this.rangeUpgrades; break;
                    case 'health': upgradeLevel = this.healthUpgrades; break;
                }
                return this.upgradeBaseCost + (upgradeLevel * 25); // Cost increases with each upgrade
            }
            
            upgrade(upgradeType) {
                const cost = this.getUpgradeCost(upgradeType);
                if (playerCurrency >= cost) {
                    playerCurrency -= cost;
                    
                    switch(upgradeType) {
                        case 'damage':
                            this.damageUpgrades++;
                            this.damage += 10; // +10 damage per upgrade
                            break;
                        case 'range':
                            this.rangeUpgrades++;
                            this.range += 50; // +50 range per upgrade
                            break;
                        case 'health':
                            this.healthUpgrades++;
                            this.maxHealth += 20; // +20 max health per upgrade
                            this.health = this.maxHealth; // Heal to full when upgrading health
                            break;
                    }
                    
                    // Level up and give upgrade point every few upgrades
                    const totalUpgrades = this.damageUpgrades + this.rangeUpgrades + this.healthUpgrades;
                    this.level = Math.floor(totalUpgrades / 3) + 1;
                    
                    // Visual feedback
                    createHitEffect(this.x, this.y - 20);
                    return true;
                }
                return false;
            }
        }
        
        // Wall class for village defense
        class Wall {
            constructor(x, y, width, height, side) {
                this.x = x;
                this.y = y;
                this.width = width;
                this.height = height;
                this.side = side; // 'top', 'bottom', 'left', 'right'
                
                // Set wall health based on difficulty
                if (gameDifficulty === 'easy') {
                    this.maxHealth = 120;
                } else if (gameDifficulty === 'normal') {
                    this.maxHealth = 100;
                } else {
                    this.maxHealth = 40;
                }
                this.health = this.maxHealth;
                this.isDestroyed = false;
                this.rebuildProgress = 0;
                this.isRebuilding = false;
                this.rebuildStartTime = 0;
            }
            
            takeDamage(damage) {
                this.health -= damage;
                if (this.health <= 0) {
                    this.health = 0;
                    this.isDestroyed = true;
                }
            }
            
            startRebuilding() {
                if (this.isDestroyed && !this.isRebuilding) {
                    this.isRebuilding = true;
                    this.rebuildStartTime = Date.now();
                    this.rebuildProgress = 0;
                    return true;
                }
                return false;
            }
            
            update() {
                if (this.isRebuilding) {
                    const elapsed = Date.now() - this.rebuildStartTime;
                    this.rebuildProgress = elapsed / wallRebuildTime;
                    
                    if (this.rebuildProgress >= 1) {
                        this.isRebuilding = false;
                        if (this.isDestroyed) {
                            this.isDestroyed = false; // Rebuild complete
                        }
                        this.health = this.maxHealth; // Always restore to full health
                        this.rebuildProgress = 0;
                    } else {
                        // Gradual health restoration during repair/rebuild
                        if (!this.isDestroyed) {
                            const targetHealth = this.health + (this.maxHealth - this.health) * this.rebuildProgress;
                            this.health = Math.min(this.maxHealth, targetHealth);
                        }
                    }
                }
            }
            
            draw() {
                if (this.isDestroyed && !this.isRebuilding) {
                    // Draw rubble/broken wall
                    ctx.fillStyle = '#654321';
                    ctx.fillRect(this.x, this.y, this.width, this.height * 0.3);
                    
                    // Debris particles
                    ctx.fillStyle = '#8B7355';
                    for (let i = 0; i < 5; i++) {
                        const debrisX = this.x + Math.random() * this.width;
                        const debrisY = this.y + this.height * 0.3 + Math.random() * 10;
                        ctx.fillRect(debrisX, debrisY, 3, 3);
                    }
                } else if (this.isRebuilding) {
                    // Draw rebuilding progress
                    const progress = this.rebuildProgress;
                    const currentHeight = this.height * progress;
                    
                    ctx.fillStyle = '#8B6914';
                    ctx.fillRect(this.x, this.y + this.height - currentHeight, this.width, currentHeight);
                    
                    // Construction effect
                    ctx.strokeStyle = '#FFD700';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 5]);
                    ctx.strokeRect(this.x, this.y + this.height - currentHeight, this.width, currentHeight);
                    ctx.setLineDash([]);
                } else {
                    // Draw healthy wall
                    const healthPercent = this.health / this.maxHealth;
                    
                    // Wall color based on health
                    let wallColor = '#8B6914'; // Healthy brown
                    if (healthPercent < 0.3) {
                        wallColor = '#654321'; // Damaged dark brown
                    } else if (healthPercent < 0.6) {
                        wallColor = '#8B7355'; // Slightly damaged
                    }
                    
                    ctx.fillStyle = wallColor;
                    ctx.fillRect(this.x, this.y, this.width, this.height);
                    
                    // Wall texture
                    ctx.strokeStyle = '#5D4E37';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(this.x, this.y, this.width, this.height);
                    
                    // Damage cracks if health is low
                    if (healthPercent < 0.5) {
                        ctx.strokeStyle = '#2F2F2F';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(this.x + this.width * 0.2, this.y);
                        ctx.lineTo(this.x + this.width * 0.3, this.y + this.height);
                        ctx.moveTo(this.x + this.width * 0.7, this.y + this.height * 0.2);
                        ctx.lineTo(this.x + this.width * 0.8, this.y + this.height);
                        ctx.stroke();
                    }
                    
                    // Health bar for damaged walls
                    if (healthPercent < 1) {
                        ctx.fillStyle = 'red';
                        ctx.fillRect(this.x, this.y - 5, this.width, 3);
                        ctx.fillStyle = 'green';
                        ctx.fillRect(this.x, this.y - 5, this.width * healthPercent, 3);
                    }
                }
            }
            
            canZombiePass() {
                // Zombies can only pass if wall is completely destroyed AND not being rebuilt
                return this.isDestroyed && !this.isRebuilding;
            }
            
            canBeRepaired() {
                // Wall can be repaired if damaged (not at full health), not destroyed, and not currently being rebuilt
                return this.health < this.maxHealth && this.health > 0 && !this.isDestroyed && !this.isRebuilding;
            }
            
            startRepairing() {
                if (this.canBeRepaired()) {
                    this.isRebuilding = true;
                    this.rebuildStartTime = Date.now();
                    this.rebuildProgress = 0;
                    return true;
                }
                return false;
            }
        }
        
        // Particle class for effects
        class Particle {
            constructor(x, y, color, size) {
                this.x = x;
                this.y = y;
                this.vx = (Math.random() - 0.5) * 4;
                this.vy = (Math.random() - 0.5) * 4;
                this.color = color;
                this.size = size;
                this.lifetime = 30;
            }
            
            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.vx *= 0.95;
                this.vy *= 0.95;
                this.lifetime--;
                this.size *= 0.95;
            }
            
            draw() {
                ctx.globalAlpha = this.lifetime / 30;
                
                // Particle glow
                ctx.shadowColor = this.color;
                ctx.shadowBlur = this.size * 2;
                ctx.fillStyle = this.color;
                
                if (this.color === '#aa0000') {
                    // Blood drops
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    // Spark particles
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    ctx.rotate(Math.atan2(this.vy, this.vx));
                    ctx.fillRect(-this.size, -this.size/2, this.size * 2, this.size);
                    ctx.restore();
                }
                
                ctx.shadowBlur = 0;
                ctx.globalAlpha = 1;
            }
        }
        
        function createBloodEffect(x, y) {
            for (let i = 0; i < 15; i++) {
                particles.push(new Particle(x, y, Math.random() > 0.5 ? '#aa0000' : '#8b0000', Math.random() * 8 + 2));
            }
            screenShake = Math.max(screenShake, 5);
        }
        
        function createHitEffect(x, y) {
            for (let i = 0; i < 8; i++) {
                const colors = ['#ffff00', '#ff8800', '#ffffff', '#ffaa00'];
                particles.push(new Particle(x, y, colors[Math.floor(Math.random() * colors.length)], Math.random() * 6 + 1));
            }
            screenShake = Math.max(screenShake, 3);
        }
        
        function isInSafeZone(x, y, buffer = 0) {
            return x >= safeZone.x - buffer && x <= safeZone.x + safeZone.width + buffer &&
                   y >= safeZone.y - buffer && y <= safeZone.y + safeZone.height + buffer;
        }
        
        function spawnZombie(type = 'normal') {
            let x, y;
            const side = Math.floor(Math.random() * 4);
            
            switch(side) {
                case 0: // Top
                    x = Math.random() * canvas.width;
                    y = -20;
                    break;
                case 1: // Right
                    x = canvas.width + 20;
                    y = Math.random() * canvas.height;
                    break;
                case 2: // Bottom
                    x = Math.random() * canvas.width;
                    y = canvas.height + 20;
                    break;
                case 3: // Left
                    x = -20;
                    y = Math.random() * canvas.height;
                    break;
            }
            
            zombies.push(new Zombie(x, y, type));
        }
        
        function levelUp() {
            playerLevel++;
            playerXP -= xpToNextLevel;
            
            // Scale XP requirements for 100+ levels
            if (playerLevel <= 20) {
                xpToNextLevel = Math.floor(xpToNextLevel * 1.15);
            } else if (playerLevel <= 50) {
                xpToNextLevel = Math.floor(xpToNextLevel * 1.10);
            } else if (playerLevel <= 80) {
                xpToNextLevel = Math.floor(xpToNextLevel * 1.08);
            } else {
                xpToNextLevel = Math.floor(xpToNextLevel * 1.05);
            }
            
            console.log(`LEVEL UP! Level ${playerLevel}, Next: ${xpToNextLevel} XP`);
            
            // Generate 3 random upgrade choices
            availableUpgrades = [];
            const shuffled = [...upgradeTypes].sort(() => 0.5 - Math.random());
            availableUpgrades = shuffled.slice(0, 3);
            
            showUpgradeMenu = true;
            gamePaused = true;
            // Auto-close upgrade menu after 10 seconds if no selection
            if (window.upgradeMenuTimeout) clearTimeout(window.upgradeMenuTimeout);
            window.upgradeMenuTimeout = setTimeout(() => {
                if (showUpgradeMenu) {
                    showUpgradeMenu = false;
                    gamePaused = false;
                    availableUpgrades = [];
                    console.warn('[WARN] Upgrade menu auto-closed due to inactivity.');
                }
            }, 10000);
        }
        
        function selectUpgrade(index) {
            if (index >= 0 && index < availableUpgrades.length) {
                availableUpgrades[index].apply();
                showUpgradeMenu = false;
                gamePaused = false;
                availableUpgrades = [];
                if (window.upgradeMenuTimeout) clearTimeout(window.upgradeMenuTimeout);
            }
        }
        
        function toggleStore() {
            if (!gameRunning) return;
            
            showStore = !showStore;
            gamePaused = showStore;
            
            // Reset scroll when opening store
            if (showStore) {
                storeScrollY = 0;
            }
        }
        
        function purchaseWeapon(weaponKey) {
            const weapon = weapons[weaponKey];
            if (playerCurrency >= weapon.price && weaponKey !== currentWeapon && playerLevel >= weapon.unlockLevel) {
                playerCurrency -= weapon.price;
                currentWeapon = weaponKey;
                
                // Update player stats based on weapon
                player.damage = weapon.damage;
                player.attackRate = weapon.fireRate;
                
                showStore = false;
            }
        }
        
        function purchaseSupply(supplyKey) {
            const supply = constructionSupplies[supplyKey];
            if (playerCurrency >= supply.price) {
                playerCurrency -= supply.price;
                
                if (supplyKey === 'hammer') {
                    playerHasHammer = true;
                } else if (supplyKey === 'nails') {
                    playerHasNails += supply.quantity;
                } else if (supplyKey === 'wood') {
                    playerHasWood += supply.quantity;
                }
                
                // Visual feedback
                createHitEffect(canvas.width / 2, canvas.height / 2);
                return true;
            }
            return false;
        }
        
        function fireBullet() {
            const weapon = weapons[currentWeapon];
            
            if (weapon.special === 'spread') {
                // Shotgun - fire multiple pellets
                const pelletCount = 5;
                const spreadAngle = 0.4; // radians
                
                for (let i = 0; i < pelletCount; i++) {
                    const angleOffset = (i - (pelletCount - 1) / 2) * (spreadAngle / (pelletCount - 1));
                    const pelletAngle = player.facingAngle + angleOffset;
                    bullets.push(new Bullet(player.x, player.y, pelletAngle, currentWeapon));
                }
            } else if (weapon.special === 'bfg') {
                // BFG - massive projectile with area damage
                bullets.push(new Bullet(player.x, player.y, player.facingAngle, currentWeapon));
                
                // Also damage nearby zombies immediately
                zombies.forEach(zombie => {
                    const dx = zombie.x - player.x;
                    const dy = zombie.y - player.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 150) {
                        const damage = weapon.damage * 0.3 * (1 - distance / 150);
                        zombie.health -= damage;
                        
                        if (zombie.health <= 0) {
                            playerXP += zombie.xpValue;
                            playerCurrency += zombie.currencyValue;
                            score += zombie.xpValue * wave;
                            zombiesKilled++;
                            
                            console.log(`Zombie killed by BFG area damage! Progress: ${zombiesKilled}/${zombiesPerWave} (${zombie.type})`);
                        }
                    }
                });
            } else {
                // Standard single bullet
                bullets.push(new Bullet(player.x, player.y, player.facingAngle, currentWeapon));
            }
        }
        
        function initializeWalls() {
            walls = [];
            const wallThickness = 15;
            const margin = 30; // Distance from safe zone
            
            // Calculate wall positions around the safe zone
            const wallArea = {
                x: safeZone.x - margin,
                y: safeZone.y - margin,
                width: safeZone.width + (margin * 2),
                height: safeZone.height + (margin * 2)
            };
            
            // Create wall segments
            const segmentCount = Math.ceil(wallArea.width / wallSegmentSize);
            
            // Top wall segments
            for (let i = 0; i < segmentCount; i++) {
                const x = wallArea.x + (i * wallSegmentSize);
                const width = Math.min(wallSegmentSize, wallArea.x + wallArea.width - x);
                walls.push(new Wall(x, wallArea.y, width, wallThickness, 'top'));
            }
            
            // Bottom wall segments
            for (let i = 0; i < segmentCount; i++) {
                const x = wallArea.x + (i * wallSegmentSize);
                const width = Math.min(wallSegmentSize, wallArea.x + wallArea.width - x);
                walls.push(new Wall(x, wallArea.y + wallArea.height - wallThickness, width, wallThickness, 'bottom'));
            }
            
            // Left wall segments
            const leftSegmentCount = Math.ceil(wallArea.height / wallSegmentSize);
            for (let i = 0; i < leftSegmentCount; i++) {
                const y = wallArea.y + (i * wallSegmentSize);
                const height = Math.min(wallSegmentSize, wallArea.y + wallArea.height - y);
                walls.push(new Wall(wallArea.x, y, wallThickness, height, 'left'));
            }
            
            // Right wall segments
            for (let i = 0; i < leftSegmentCount; i++) {
                const y = wallArea.y + (i * wallSegmentSize);
                const height = Math.min(wallSegmentSize, wallArea.y + wallArea.height - y);
                walls.push(new Wall(wallArea.x + wallArea.width - wallThickness, y, wallThickness, height, 'right'));
            }
        }
        
        function findNearestDamagedWall(character) {
            let nearestWall = null;
            let nearestDistance = Infinity;
            
            walls.forEach(wall => {
                // Check for both destroyed walls that need rebuilding AND damaged walls that need repair
                if ((wall.isDestroyed && !wall.isRebuilding) || wall.canBeRepaired()) {
                    const distance = Math.sqrt((character.x - (wall.x + wall.width/2)) ** 2 + (character.y - (wall.y + wall.height/2)) ** 2);
                    if (distance < nearestDistance && distance <= 100) { // Increased rebuilding range
                        nearestDistance = distance;
                        nearestWall = wall;
                    }
                }
            });
            
            return nearestWall;
        }
        
        function canZombiesEnterSafeZone(zombieX, zombieY, targetX, targetY) {
            // Check if there's a clear path through broken walls
            for (let wall of walls) {
                if (!wall.canZombiePass()) {
                    // Wall is intact, check if it blocks the path
                    if (lineIntersectsRect(zombieX, zombieY, targetX, targetY, wall.x, wall.y, wall.width, wall.height)) {
                        return false; // Path is blocked by intact wall
                    }
                }
            }
            return true; // Path is clear through broken walls
        }
        
        function lineIntersectsRect(x1, y1, x2, y2, rectX, rectY, rectW, rectH) {
            // Check if line intersects rectangle
            const left = lineIntersectsLine(x1, y1, x2, y2, rectX, rectY, rectX, rectY + rectH);
            const right = lineIntersectsLine(x1, y1, x2, y2, rectX + rectW, rectY, rectX + rectW, rectY + rectH);
            const top = lineIntersectsLine(x1, y1, x2, y2, rectX, rectY, rectX + rectW, rectY);
            const bottom = lineIntersectsLine(x1, y1, x2, y2, rectX, rectY + rectH, rectX + rectW, rectY + rectH);
            
            return left || right || top || bottom;
        }
        
        function lineIntersectsLine(x1, y1, x2, y2, x3, y3, x4, y4) {
            const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
            if (denominator === 0) return false;
            
            const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
            const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator;
            
            return t >= 0 && t <= 1 && u >= 0 && u <= 1;
        }
        
        function spawnCompanion() {
            if (companions.length >= maxCompanions) {
                return false; // Max companions reached
            }
            
            if (playerCurrency < companionCost) {
                return false; // Not enough money
            }
            
            // Spawn companion near player in safe zone
            const spawnX = safeZone.x + safeZone.width/2 + (Math.random() - 0.5) * 60;
            const spawnY = safeZone.y + safeZone.height/2 + (Math.random() - 0.5) * 60;
            
            companions.push(new Companion(spawnX, spawnY));
            playerCurrency -= companionCost;
            companionCost = Math.floor(companionCost * 1.2); // Increase cost for next companion
            
            return true;
        }
        
        function getWaveComposition(level) {
            // Define 100 levels with escalating difficulty and strategic boss placement
            let normalZombies = 0;
            let miniBosses = 0;
            let bosses = 0;
            
            if (gameDifficulty === 'easy') {
                // Easy mode - gentle progression for casual players
                if (level <= 10) {
                    normalZombies = Math.floor(2 + level * 0.4);
                    if (level === 6) miniBosses = 1;
                    if (level === 10) bosses = 1;
                } else if (level <= 25) {
                    normalZombies = Math.floor(4 + (level * 8) * 0.6);
                    miniBosses = Math.floor((level - 12) / 6);
                    if (level % 12 === 0) bosses = 1;
                } else if (level <= 50) {
                    normalZombies = Math.floor(6 + (level - 25) * 1.0);
                    miniBosses = Math.floor((level - 18) / 5);
                    if (level % 10 === 0) bosses = 1;
                    if (level === 50) { bosses = 2; miniBosses += 1; }
                } else if (level <= 75) {
                    normalZombies = Math.floor(12 + (level - 50) * 1.2);
                    miniBosses = Math.floor((level - 30) / 4);
                    if (level % 8 === 0) bosses = 1;
                    if (level % 16 === 0) bosses = 2;
                    if (level === 75) { bosses = 2; miniBosses += 2; }
                } else {
                    normalZombies = Math.floor(20 + (level - 75) * 1.5);
                    miniBosses = Math.floor((level - 55) / 3);
                    bosses = Math.floor((level - 75) / 6) + 1;
                    if (level % 8 === 0) { bosses += 1; miniBosses += 1; }
                    if (level === 100) { 
                        normalZombies = 40;
                        miniBosses = 8;
                        bosses = 3;
                    }
                }
            } else if (gameDifficulty === 'normal') {
                // Normal mode - original balanced progression
                if (level <= 10) {
                    normalZombies = Math.floor(3 + level * 0.5);
                    if (level === 5) miniBosses = 1;
                    if (level === 10) bosses = 1;
                } else if (level <= 25) {
                    normalZombies = Math.floor(5 + (level * 10) * 0.8);
                    miniBosses = Math.floor((level - 10) / 5);
                    if (level % 10 === 0) bosses = 1;
                } else if (level <= 50) {
                    normalZombies = Math.floor(8 + (level - 25) * 1.2);
                    miniBosses = Math.floor((level - 15) / 4);
                    if (level % 8 === 0) bosses = 1;
                    if (level === 50) { bosses = 2; miniBosses += 2; }
                } else if (level <= 75) {
                    normalZombies = Math.floor(15 + (level - 50) * 1.5);
                    miniBosses = Math.floor((level - 25) / 3);
                    if (level % 6 === 0) bosses = 1;
                    if (level % 12 === 0) bosses = 2;
                    if (level === 75) { bosses = 3; miniBosses += 3; }
                } else {
                    normalZombies = Math.floor(25 + (level - 75) * 2);
                    miniBosses = Math.floor((level - 50) / 2);
                    bosses = Math.floor((level - 70) / 5) + 1;
                    if (level % 5 === 0) { bosses += 1; miniBosses += 2; }
                    if (level === 100) { 
                        normalZombies = 50;
                        miniBosses = 10;
                        bosses = 5;
                    }
                }
            } else {
                // Hardcore mode - brutal progression
                if (level <= 10) {
                    normalZombies = Math.floor(6 + level * 1.2);
                    if (level >= 3) miniBosses = 1;
                    if (level >= 7) bosses = 1;
                } else if (level <= 25) {
                    normalZombies = Math.floor(12 + (level * 10) * 1.6);
                    miniBosses = Math.floor((level - 8) / 3);
                    if (level % 7 === 0) bosses = 1;
                    if (level >= 15) bosses += 1;
                } else if (level <= 50) {
                    normalZombies = Math.floor(18 + (level - 25) * 2.0);
                    miniBosses = Math.floor((level - 10) / 3);
                    if (level % 5 === 0) bosses = 2;
                    if (level === 50) { bosses = 4; miniBosses += 4; }
                } else if (level <= 75) {
                    normalZombies = Math.floor(30 + (level - 50) * 2.5);
                    miniBosses = Math.floor((level - 20) / 2);
                    if (level % 4 === 0) bosses = 2;
                    if (level % 8 === 0) bosses = 3;
                    if (level === 75) { bosses = 5; miniBosses += 6; }
                } else {
                    normalZombies = Math.floor(50 + (level - 75) * 3);
                    miniBosses = Math.floor((level - 40) / 2);
                    bosses = Math.floor((level - 60) / 3) + 2;
                    if (level % 3 === 0) { bosses += 2; miniBosses += 3; }
                    if (level === 100) { 
                        normalZombies = 100;
                        miniBosses = 20;
                        bosses = 10;
                    }
                }
            }

            // Ensure minimum and maximum caps
            const minZombies = 3;
            const maxZombies = 40;
            normalZombies = Math.max(minZombies, Math.min(normalZombies, maxZombies));
            miniBosses = Math.max(0, Math.min(miniBosses, 10));
            bosses = Math.max(0, Math.min(bosses, 5));

            return { normalZombies, miniBosses, bosses };
        }
        
        function startWave() {
            betweenWaves = false;
            zombiesKilled = 0;
            
            // Get composition based on current level
            const composition = getWaveComposition(wave);
            let { normalZombies, miniBosses, bosses } = composition;

            // Debug log for composition
            console.log(`[DEBUG] Wave ${wave} composition:`, composition);

            // Fallback: ensure at least one zombie spawns if all are zero
            if (normalZombies + miniBosses + bosses === 0) {
                normalZombies = 1;
                console.warn(`[WARN] No zombies calculated for wave ${wave}, forcing 1 normal zombie.`);
            }

            // Calculate total zombies for this level
            const totalZombiesThisWave = normalZombies + miniBosses + bosses;
            zombiesPerWave = totalZombiesThisWave;

            console.log(`Starting Level ${wave}: ${normalZombies} normal, ${miniBosses} mini-bosses, ${bosses} bosses (Total: ${totalZombiesThisWave})`);
            
            // Additional debug for level 7
            if (wave === 7) {
                console.log(`[DEBUG LEVEL 7] zombiesPerWave set to: ${zombiesPerWave}, zombiesKilled reset to: ${zombiesKilled}`);
            }
            
            // Spawn zombies with strategic timing
            let spawnIndex = 0;
            const baseDelay = Math.max(200, 600 - (wave * 12)); // Much faster spawns at all levels
            
            // Spawn normal zombies
            for (let i = 0; i < normalZombies; i++) {
                setTimeout(() => {
                    if (gameRunning && !gamePaused) {
                        spawnZombie('normal');
                        console.log(`Spawned normal zombie ${i + 1}/${normalZombies}`);
                    }
                }, spawnIndex * baseDelay);
                spawnIndex++;
            }
            
            // Spawn mini-bosses
            for (let i = 0; i < miniBosses; i++) {
                setTimeout(() => {
                    if (gameRunning && !gamePaused) {
                        spawnZombie('miniboss');
                        console.log(`Spawned mini-boss ${i + 1}/${miniBosses}`);
                    }
                }, spawnIndex * baseDelay);
                spawnIndex++;
            }
            
            // Spawn bosses
            for (let i = 0; i < bosses; i++) {
                setTimeout(() => {
                    if (gameRunning && !gamePaused) {
                        spawnZombie('boss');
                        console.log(`Spawned boss ${i + 1}/${bosses}`);
                    }
                }, spawnIndex * baseDelay);
                spawnIndex++;
            }
        }
        
        function updateGame() {
            if (!gameRunning || gamePaused) return;
            
            // Player movement
            let dx = 0;
            let dy = 0;
            
            // Check for arrow keys too
            if (keys['w'] || keys['arrowup']) dy -= player.speed;
            if (keys['s'] || keys['arrowdown']) dy += player.speed;
            if (keys['a'] || keys['arrowleft']) dx -= player.speed;
            if (keys['d'] || keys['arrowright']) dx += player.speed;
            
            // Normalize diagonal movement
            if (dx !== 0 && dy !== 0) {
                dx *= 0.707;
                dy *= 0.707;
            }
            
            // Update player position
            player.x += dx;
            player.y += dy;
            
            // Keep player in bounds
            player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));
            player.y = Math.max(player.size, Math.min(canvas.height - player.size, player.y));
            
            // Auto-targeting system
            if (autoTargetEnabled && zombies.length > 0) {
                // Find closest zombie within range
                let closestDistance = Infinity;
                let closestZombie = null;
                
                zombies.forEach(zombie => {
                    const dx = zombie.x - player.x;
                    const dy = zombie.y - player.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < closestDistance && distance <= targetingRange) {
                        closestDistance = distance;
                        closestZombie = zombie;
                    }
                });
                
                if (closestZombie) {
                    targetedZombie = closestZombie;
                    // Auto-aim at closest zombie
                    const dx = closestZombie.x - player.x;
                    const dy = closestZombie.y - player.y;
                    player.facingAngle = Math.atan2(dy, dx);
                    
                    // Auto-fire
                    if (player.attackCooldown <= 0) {
                        fireBullet();
                        player.attackCooldown = player.attackRate;
                    }
                } else {
                    targetedZombie = null;
                }
            } else {
                // Manual targeting with mouse
                const mouseX = mouse.x - canvas.getBoundingClientRect().left;
                const mouseY = mouse.y - canvas.getBoundingClientRect().top;
                player.facingAngle = Math.atan2(mouseY - player.y, mouseX - player.x);
                
                // Manual shooting
                if (mouse.pressed && player.attackCooldown <= 0) {
                    fireBullet();
                    player.attackCooldown = player.attackRate;
                }
            }
            
            if (player.attackCooldown > 0) player.attackCooldown--;
            
            // Heal in safe zone
            if (isInSafeZone(player.x, player.y)) {
                if (player.health < player.maxHealth) {
                    player.health = Math.min(player.maxHealth, player.health + player.healRate);
                }
            }
            
            // Check for level up
            if (playerXP >= xpToNextLevel && !showUpgradeMenu) {
                levelUp();
            }
            
            // Update zombies
            zombies.forEach(zombie => zombie.update());
            
            // Update companions
            companions.forEach(companion => companion.update());
            
            // Update walls
            walls.forEach(wall => wall.update());
            
            // Companion damage from zombies
            for (let i = companions.length - 1; i >= 0; i--) {
                const companion = companions[i];
                zombies.forEach(zombie => {
                    const distance = Math.sqrt((companion.x - zombie.x) ** 2 + (companion.y - zombie.y) ** 2);
                    if (distance <= zombie.size + companion.size + 5) {
                        companion.health -= 0.5; // Gradual damage
                    }
                });
                
                // Remove dead companions
                if (companion.health <= 0) {
                    companions.splice(i, 1);
                }
            }
            
            // Update bullets
            for (let i = bullets.length - 1; i >= 0; i--) {
                if (bullets[i].update()) {
                    bullets.splice(i, 1);
                }
            }
            
            // Update particles
            for (let i = particles.length - 1; i >= 0; i--) {
                particles[i].update();
                if (particles[i].lifetime <= 0) {
                    particles.splice(i, 1);
                }
            }
            
            // Update screen shake
            if (screenShake > 0) {
                screenShake *= 0.9;
                if (screenShake < 0.5) screenShake = 0;
            }
            
            // Wave management
            if (zombies.length === 0 && zombiesKilled >= zombiesPerWave && !betweenWaves) {
                console.log(`Wave ${wave} completed! Killed: ${zombiesKilled}/${zombiesPerWave}`);
                betweenWaves = true;
                waveTimer = 180; // 3 seconds at 60 FPS
                if (wave < maxWaves) {
                    wave++;
                    // Don't set zombiesPerWave here - let startWave handle it based on wave composition
                    console.log(`Preparing wave ${wave}...`);
                } else {
                    alert('Congratulations! You survived all waves!');
                    gameRunning = false;
                }
            }
            
            // Emergency wave completion - if no zombies left for too long, force completion
            if (!betweenWaves && zombies.length === 0) {
                if (!window.emptyWaveTimer) window.emptyWaveTimer = 0;
                window.emptyWaveTimer++;
                
                if (window.emptyWaveTimer > 300) { // 5 seconds at 60 FPS
                    console.log(`[EMERGENCY] Force completing wave ${wave} - no zombies for 5+ seconds`);
                    zombiesKilled = Math.max(zombiesKilled, zombiesPerWave); // Ensure kill count meets requirement
                    window.emptyWaveTimer = 0;
                }
            } else {
                window.emptyWaveTimer = 0;
            }

            // Debug logging for level 7 issues
            if (wave === 7) {
                console.log(`[DEBUG LEVEL 7] Zombies left: ${zombies.length}, Killed: ${zombiesKilled}/${zombiesPerWave}, BetweenWaves: ${betweenWaves}`);
                
                // Force completion if conditions are met but wave isn't ending
                if (zombies.length === 0 && zombiesKilled < zombiesPerWave && !betweenWaves) {
                    console.log(`[FORCE FIX LEVEL 7] Zombies killed mismatch! Adjusting zombiesPerWave from ${zombiesPerWave} to ${zombiesKilled}`);
                    zombiesPerWave = zombiesKilled;
                }
            }
            
            if (betweenWaves && waveTimer > 0) {
                waveTimer--;
                if (waveTimer === 0) {
                    console.log(`Starting wave ${wave} with ${zombiesPerWave} base zombies`);
                    startWave();
                }
            }
            
            // Check if all walls are destroyed
            const allWallsDestroyed = walls.length > 0 && walls.every(wall => wall.isDestroyed);
            
            // Check game over
            if (player.health <= 0) {
                gameOver();
            } else if (allWallsDestroyed) {
                gameOver('All walls have been destroyed! The safe zone has been breached!');
            }
            
            // Update UI
            document.getElementById('health').textContent = Math.ceil(player.health);
            document.getElementById('score').textContent = score;
            document.getElementById('wave').textContent = wave;
            document.getElementById('zombieCount').textContent = zombies.length;
            document.getElementById('level').textContent = playerLevel;
            document.getElementById('xp').textContent = `${playerXP}/${xpToNextLevel}`;
            document.getElementById('currency').textContent = playerCurrency;
            document.getElementById('currentWeaponName').textContent = weapons[currentWeapon].name;
            
            // Update player tools display
            const hammerIcon = playerHasHammer ? 'H' : 'X';
            document.getElementById('playerTools').textContent = `${hammerIcon} N:${playerHasNails} W:${playerHasWood}`;
            
            // Update companion button
            updateCompanionButton();
        }
        
        function drawGame() {
            // Apply screen shake
            ctx.save();
            if (screenShake > 0) {
                const shakeX = (Math.random() - 0.5) * screenShake;
                const shakeY = (Math.random() - 0.5) * screenShake;
                ctx.translate(shakeX, shakeY);
            }
            
            // Clear canvas with horror atmosphere
            const gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, Math.max(canvas.width, canvas.height)/2);
            gradient.addColorStop(0, '#2a1a1a');
            gradient.addColorStop(0.7, '#1a1a0a');
            gradient.addColorStop(1, '#0a0a0a');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw static ground texture
            for (let x = 0; x < canvas.width; x += 40) {
                for (let y = 0; y < canvas.height; y += 40) {
                    // Use position-based values instead of random for consistent pattern
                    const seed = (x * 7 + y * 11) % 100;
                    const darkness = (seed / 100) * 0.3;
                    ctx.fillStyle = `rgba(${20 + darkness * 50}, ${40 + darkness * 30}, ${10 + darkness * 20}, 0.6)`;
                    
                    const offsetX = (seed % 5);
                    const offsetY = ((seed * 3) % 5);
                    const sizeVariation = 35 + ((seed * 2) % 10);
                    
                    ctx.fillRect(x + offsetX, y + offsetY, sizeVariation, sizeVariation);
                }
            }
            
            // Add static dead grass patches
            for (let i = 0; i < 30; i++) {
                // Use index-based positioning for consistent placement
                const seed = i * 17;
                const x = (seed * 13) % canvas.width;
                const y = (seed * 29) % canvas.height;
                const alpha = 0.2 + ((seed % 30) / 100);
                const radius = 5 + (seed % 15);
                
                ctx.fillStyle = `rgba(139, 69, 19, ${alpha})`;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Draw safe zone (village) with holy light effect
            const safeGradient = ctx.createRadialGradient(
                safeZone.x + safeZone.width/2, 
                safeZone.y + safeZone.height/2, 
                0,
                safeZone.x + safeZone.width/2, 
                safeZone.y + safeZone.height/2, 
                safeZone.width/2 + 50
            );
            safeGradient.addColorStop(0, 'rgba(255, 255, 200, 0.4)');
            safeGradient.addColorStop(0.6, 'rgba(200, 255, 150, 0.2)');
            safeGradient.addColorStop(1, 'rgba(100, 200, 100, 0.1)');
            ctx.fillStyle = safeGradient;
            ctx.fillRect(safeZone.x - 30, safeZone.y - 30, safeZone.width + 60, safeZone.height + 60);
            
            // Village ground
            ctx.fillStyle = 'rgba(139, 200, 139, 0.4)';
            ctx.fillRect(safeZone.x, safeZone.y, safeZone.width, safeZone.height);
            
            // Draw actual zombie boundary (visual debug)
            ctx.strokeStyle = 'rgba(255, 100, 100, 0.4)';
            ctx.lineWidth = 3;
            ctx.setLineDash([10, 5]);
            ctx.strokeRect(safeZone.x - 17, safeZone.y - 17, safeZone.width + 34, safeZone.height + 34);
            ctx.setLineDash([]);
            
            // Holy barrier effect
            ctx.strokeStyle = 'rgba(255, 255, 100, 0.8)';
            ctx.lineWidth = 4;
            ctx.shadowColor = 'rgba(255, 255, 100, 0.5)';
            ctx.shadowBlur = 10;
            ctx.strokeRect(safeZone.x, safeZone.y, safeZone.width, safeZone.height);
            ctx.shadowBlur = 0;
            
            // Draw enhanced village buildings with more details
            const buildings = [
                {x: 15, y: 25, w: 45, h: 45, type: 'house'},
                {x: 135, y: 25, w: 45, h: 45, type: 'church'},
                {x: 75, y: 75, w: 50, h: 45, type: 'townhall'},
                {x: 25, y: 125, w: 40, h: 40, type: 'shop'},
                {x: 125, y: 125, w: 40, h: 40, type: 'house'}
            ];
            
            buildings.forEach((building, i) => {
                // Building shadows
                ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                ctx.fillRect(safeZone.x + building.x + 3, safeZone.y + building.y + 3, building.w, building.h);
                
                // Building walls with texture
                const wallGradient = ctx.createLinearGradient(
                    safeZone.x + building.x, safeZone.y + building.y,
                    safeZone.x + building.x + building.w, safeZone.y + building.y + building.h
                );
                
                if (building.type === 'church') {
                    wallGradient.addColorStop(0, '#D3D3D3');
                    wallGradient.addColorStop(1, '#A9A9A9');
                } else if (building.type === 'townhall') {
                    wallGradient.addColorStop(0, '#CD853F');
                    wallGradient.addColorStop(1, '#8B4513');
                } else {
                    wallGradient.addColorStop(0, '#DEB887');
                    wallGradient.addColorStop(1, '#8B7355');
                }
                
                ctx.fillStyle = wallGradient;
                ctx.fillRect(safeZone.x + building.x, safeZone.y + building.y, building.w, building.h);
                
                // Building outlines
                ctx.strokeStyle = '#654321';
                ctx.lineWidth = 1;
                ctx.strokeRect(safeZone.x + building.x, safeZone.y + building.y, building.w, building.h);
                
                // Type-specific features
                if (building.type === 'church') {
                    // Church cross
                    ctx.fillStyle = '#FFD700';
                    ctx.fillRect(safeZone.x + building.x + building.w/2 - 1, safeZone.y + building.y - 15, 3, 12);
                    ctx.fillRect(safeZone.x + building.x + building.w/2 - 4, safeZone.y + building.y - 12, 9, 3);
                    
                    // Stained glass window
                    ctx.fillStyle = '#4169E1';
                    ctx.beginPath();
                    ctx.arc(safeZone.x + building.x + building.w/2, safeZone.y + building.y + 15, 8, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.fillStyle = '#FFD700';
                    ctx.beginPath();
                    ctx.arc(safeZone.x + building.x + building.w/2, safeZone.y + building.y + 15, 4, 0, Math.PI * 2);
                    ctx.fill();
                } else if (building.type === 'townhall') {
                    // Flag pole
                    ctx.fillStyle = '#8B4513';
                    ctx.fillRect(safeZone.x + building.x + building.w - 8, safeZone.y + building.y - 20, 2, 25);
                    
                    // Flag
                    ctx.fillStyle = '#FF0000';
                    ctx.fillRect(safeZone.x + building.x + building.w - 18, safeZone.y + building.y - 18, 12, 8);
                    
                    // Large windows
                    ctx.fillStyle = '#87CEEB';
                    ctx.fillRect(safeZone.x + building.x + 8, safeZone.y + building.y + 8, 12, 12);
                    ctx.fillRect(safeZone.x + building.x + 25, safeZone.y + building.y + 8, 12, 12);
                } else if (building.type === 'shop') {
                    // Shop sign
                    ctx.fillStyle = '#8B4513';
                    ctx.fillRect(safeZone.x + building.x + 5, safeZone.y + building.y - 8, 25, 8);
                    ctx.fillStyle = '#FFFFFF';
                    ctx.font = '8px Arial';
                    ctx.fillText('SHOP', safeZone.x + building.x + 8, safeZone.y + building.y - 2);
                    
                    // Display window
                    ctx.fillStyle = '#87CEEB';
                    ctx.fillRect(safeZone.x + building.x + 5, safeZone.y + building.y + 5, building.w - 10, 15);
                    
                    // Items in window
                    ctx.fillStyle = '#DAA520';
                    ctx.fillRect(safeZone.x + building.x + 8, safeZone.y + building.y + 8, 3, 3);
                    ctx.fillRect(safeZone.x + building.x + 15, safeZone.y + building.y + 10, 3, 3);
                } else {
                    // Regular house windows
                    ctx.fillStyle = '#FFD700';
                    ctx.fillRect(safeZone.x + building.x + 8, safeZone.y + building.y + 8, 10, 10);
                    ctx.fillRect(safeZone.x + building.x + 25, safeZone.y + building.y + 8, 10, 10);
                    
                    // Window frames
                    ctx.strokeStyle = '#8B4513';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(safeZone.x + building.x + 8, safeZone.y + building.y + 8, 10, 10);
                    ctx.strokeRect(safeZone.x + building.x + 25, safeZone.y + building.y + 8, 10, 10);
                    
                    // Window cross pattern
                    ctx.beginPath();
                    ctx.moveTo(safeZone.x + building.x + 13, safeZone.y + building.y + 8);
                    ctx.lineTo(safeZone.x + building.x + 13, safeZone.y + building.y + 18);
                    ctx.moveTo(safeZone.x + building.x + 8, safeZone.y + building.y + 13);
                    ctx.lineTo(safeZone.x + building.x + 18, safeZone.y + building.y + 13);
                    ctx.stroke();
                    
                    ctx.beginPath();
                    ctx.moveTo(safeZone.x + building.x + 30, safeZone.y + building.y + 8);
                    ctx.lineTo(safeZone.x + building.x + 30, safeZone.y + building.y + 18);
                    ctx.moveTo(safeZone.x + building.x + 25, safeZone.y + building.y + 13);
                    ctx.lineTo(safeZone.x + building.x + 35, safeZone.y + building.y + 13);
                    ctx.stroke();
                }
                
                // Window glow effect
                ctx.shadowColor = '#FFD700';
                ctx.shadowBlur = 12;
                ctx.globalAlpha = 0.7;
                if (building.type !== 'shop' && building.type !== 'church') {
                    ctx.fillStyle = '#FFD700';
                    ctx.fillRect(safeZone.x + building.x + 8, safeZone.y + building.y + 8, 10, 10);
                    ctx.fillRect(safeZone.x + building.x + 25, safeZone.y + building.y + 8, 10, 10);
                }
                ctx.globalAlpha = 1;
                ctx.shadowBlur = 0;
                
                // Door with details
                ctx.fillStyle = '#5D4E37';
                const doorWidth = building.type === 'townhall' ? 12 : 8;
                const doorX = safeZone.x + building.x + building.w/2 - doorWidth/2;
                ctx.fillRect(doorX, safeZone.y + building.y + building.h - 20, doorWidth, 20);
                
                // Door frame
                ctx.strokeStyle = '#8B4513';
                ctx.lineWidth = 2;
                ctx.strokeRect(doorX, safeZone.y + building.y + building.h - 20, doorWidth, 20);
                
                // Door knob
                ctx.fillStyle = '#DAA520';
                ctx.beginPath();
                ctx.arc(doorX + doorWidth - 2, safeZone.y + building.y + building.h - 10, 1, 0, Math.PI * 2);
                ctx.fill();
            });
            
            // Draw stone pathways
            ctx.fillStyle = 'rgba(169, 169, 169, 0.7)';
            // Horizontal path
            ctx.fillRect(safeZone.x + 10, safeZone.y + safeZone.height/2 - 8, safeZone.width - 20, 16);
            // Vertical path
            ctx.fillRect(safeZone.x + safeZone.width/2 - 8, safeZone.y + 10, 16, safeZone.height - 20);
            
            // Add stone texture to paths
            ctx.fillStyle = 'rgba(128, 128, 128, 0.3)';
            for (let i = 0; i < 8; i++) {
                const x = safeZone.x + 20 + i * 20;
                ctx.fillRect(x, safeZone.y + safeZone.height/2 - 6, 4, 4);
                ctx.fillRect(x + 8, safeZone.y + safeZone.height/2 + 2, 4, 4);
            }
            for (let i = 0; i < 8; i++) {
                const y = safeZone.y + 20 + i * 20;
                ctx.fillRect(safeZone.x + safeZone.width/2 - 6, y, 4, 4);
                ctx.fillRect(safeZone.x + safeZone.width/2 + 2, y + 8, 4, 4);
            }
            
            // Add small trees/bushes around buildings
            const vegetation = [
                {x: 5, y: 15, type: 'tree'},
                {x: 185, y: 15, type: 'bush'},
                {x: 5, y: 175, type: 'bush'},
                {x: 185, y: 175, type: 'tree'},
                {x: 95, y: 10, type: 'bush'}
            ];
            
            vegetation.forEach(plant => {
                if (plant.type === 'tree') {
                    // Tree trunk
                    ctx.fillStyle = '#8B4513';
                    ctx.fillRect(safeZone.x + plant.x, safeZone.y + plant.y + 8, 4, 12);
                    
                    // Tree leaves
                    ctx.fillStyle = '#228B22';
                    ctx.beginPath();
                    ctx.arc(safeZone.x + plant.x + 2, safeZone.y + plant.y + 5, 8, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Tree shadow
                    ctx.fillStyle = 'rgba(0, 100, 0, 0.3)';
                    ctx.beginPath();
                    ctx.arc(safeZone.x + plant.x + 2, safeZone.y + plant.y + 5, 6, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    // Bush
                    ctx.fillStyle = '#32CD32';
                    ctx.beginPath();
                    ctx.arc(safeZone.x + plant.x + 2, safeZone.y + plant.y + 5, 6, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.fillStyle = '#228B22';
                    ctx.beginPath();
                    ctx.arc(safeZone.x + plant.x - 2, safeZone.y + plant.y + 7, 4, 0, Math.PI * 2);
                    ctx.arc(safeZone.x + plant.x + 6, safeZone.y + plant.y + 7, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
            
            // Add a central fountain/well
            ctx.fillStyle = '#696969';
            ctx.beginPath();
            ctx.arc(safeZone.x + safeZone.width/2, safeZone.y + safeZone.height/2, 15, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#2F4F4F';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Well water
            ctx.fillStyle = '#1E90FF';
            ctx.beginPath();
            ctx.arc(safeZone.x + safeZone.width/2, safeZone.y + safeZone.height/2, 10, 0, Math.PI * 2);
            ctx.fill();
            
            // Well rim
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(safeZone.x + safeZone.width/2, safeZone.y + safeZone.height/2, 12, 0, Math.PI * 2);
            ctx.stroke();
            
            // Draw enhanced roofs with better shading
            ctx.fillStyle = '#A0522D';
            buildings.forEach((building, i) => {
                if (building.type === 'house' || building.type === 'church') {
                    const roofY = safeZone.y + building.y - (building.type === 'church' ? 25 : 20);
                    ctx.beginPath();
                    ctx.moveTo(safeZone.x + building.x - 10, safeZone.y + building.y);
                    ctx.lineTo(safeZone.x + building.x + building.w/2, roofY);
                    ctx.lineTo(safeZone.x + building.x + building.w + 10, safeZone.y + building.y);
                    ctx.fill();
                    
                    // Roof shadow
                    ctx.fillStyle = '#8B4513';
                    ctx.beginPath();
                    ctx.moveTo(safeZone.x + building.x + building.w/2, roofY);
                    ctx.lineTo(safeZone.x + building.x + building.w + 10, safeZone.y + building.y);
                    ctx.lineTo(safeZone.x + building.x + building.w/2 + 5, roofY + 2);
                    ctx.fill();
                    ctx.fillStyle = '#A0522D';
                    
                    // Roof tiles
                    ctx.strokeStyle = '#8B4513';
                    ctx.lineWidth = 1;
                    for (let tile = 0; tile < 4; tile++) {
                        ctx.beginPath();
                        const tileY = roofY + (tile * 5);
                        ctx.moveTo(safeZone.x + building.x - 5 + tile * 2, tileY);
                        ctx.lineTo(safeZone.x + building.x + building.w + 5 - tile * 2, tileY);
                        ctx.stroke();
                    }
                }
            });
            
            // Draw "SANCTUARY" text with glow
            ctx.font = 'bold 24px serif';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(255, 255, 100, 0.8)';
            ctx.shadowBlur = 15;
            ctx.fillStyle = '#FFFF00';
            ctx.fillText('⛪ SANCTUARY ⛪', safeZone.x + safeZone.width/2, safeZone.y - 15);
            ctx.shadowBlur = 0;
            
            // Draw particles
            particles.forEach(particle => particle.draw());
            
            // Draw bullets
            bullets.forEach(bullet => bullet.draw());
            
            // Draw zombies
            zombies.forEach(zombie => zombie.draw());
            
            // Draw companions
            companions.forEach(companion => companion.draw());
            
            // Draw walls
            walls.forEach(wall => wall.draw());
            
            // Draw rebuild indicator for player
            const nearestWallToPlayer = walls.length > 0 ? findNearestDamagedWall(player) : null;
            if (nearestWallToPlayer && playerHasHammer && playerHasNails >= nailsPerWall && playerHasWood >= woodPerWall) {
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 3;
                ctx.setLineDash([10, 10]);
                ctx.strokeRect(nearestWallToPlayer.x - 5, nearestWallToPlayer.y - 5, 
                             nearestWallToPlayer.width + 10, nearestWallToPlayer.height + 10);
                ctx.setLineDash([]);
                
                // Draw rebuild/repair text
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                const actionText = nearestWallToPlayer.isDestroyed ? 'Press R to Rebuild' : 'Press R to Repair';
                ctx.fillText(actionText, 
                           nearestWallToPlayer.x + nearestWallToPlayer.width/2, 
                           nearestWallToPlayer.y - 10);
            }
            
            // Draw targeting indicator (circle only, no line)
            if (autoTargetEnabled && targetedZombie && zombies.includes(targetedZombie)) {
                ctx.strokeStyle = '#00FF00';
                ctx.lineWidth = 3;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.arc(targetedZombie.x, targetedZombie.y, targetedZombie.size + 8, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            }
            
            // Draw player with enhanced graphics
            ctx.save();
            ctx.translate(player.x, player.y);
            
            // Player shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.ellipse(0, player.size + 2, player.size * 0.9, player.size * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw static human body (no rotation)
            
            // Human head (circular)
            const headGradient = ctx.createRadialGradient(0, -2, 0, 0, -2, 8);
            if (isInSafeZone(player.x, player.y)) {
                // Holy glow in safe zone
                headGradient.addColorStop(0, '#FFDBAC');
                headGradient.addColorStop(1, '#D2B48C');
                ctx.shadowColor = '#FFD700';
                ctx.shadowBlur = 15;
            } else {
                headGradient.addColorStop(0, '#FFDBAC');
                headGradient.addColorStop(1, '#D2B48C');
            }
            ctx.fillStyle = headGradient;
            ctx.beginPath();
            ctx.arc(0, -2, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            // Human body (torso)
            const bodyGradient = ctx.createLinearGradient(0, 3, 0, 15);
            if (isInSafeZone(player.x, player.y)) {
                bodyGradient.addColorStop(0, '#4169E1');
                bodyGradient.addColorStop(1, '#000080');
            } else {
                bodyGradient.addColorStop(0, '#4682B4');
                bodyGradient.addColorStop(1, '#2F4F4F');
            }
            ctx.fillStyle = bodyGradient;
            ctx.fillRect(-6, 3, 12, 12);
            
            // Human hair
            ctx.fillStyle = '#8B4513';
            ctx.beginPath();
            ctx.arc(0, -6, 6, Math.PI, Math.PI * 2);
            ctx.fill();
            
            // Human eyes
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(-4, -5, 2, 2);
            ctx.fillRect(2, -5, 2, 2);
            
            // Eye pupils
            ctx.fillStyle = '#000000';
            ctx.fillRect(-3, -4, 1, 1);
            ctx.fillRect(3, -4, 1, 1);
            
            // Human nose
            ctx.fillStyle = '#D2B48C';
            ctx.fillRect(-0.5, -2, 1, 2);
            
            // Human mouth
            ctx.fillStyle = '#8B0000';
            ctx.fillRect(-2, 1, 4, 1);
            
            // Arms
            ctx.fillStyle = '#FFDBAC';
            ctx.fillRect(-8, 5, 3, 8);  // Left arm
            ctx.fillRect(5, 5, 3, 8);   // Right arm
            
            // Legs
            ctx.fillStyle = '#000080';
            ctx.fillRect(-4, 15, 3, 8); // Left leg
            ctx.fillRect(1, 15, 3, 8);  // Right leg
            
            // Draw weapon separately with rotation
            ctx.save();
            ctx.rotate(player.facingAngle);
            
            // Enhanced gun with glow
            const gunGradient = ctx.createLinearGradient(player.size - 5, -3, player.size + 10, 3);
            gunGradient.addColorStop(0, '#555555');
            gunGradient.addColorStop(0.5, '#777777');
            gunGradient.addColorStop(1, '#333333');
            ctx.fillStyle = gunGradient;
            ctx.fillRect(player.size - 5, -3, 15, 6);
            
            // Gun barrel glow
            ctx.shadowColor = '#FF4500';
            ctx.shadowBlur = 3;
            ctx.fillStyle = '#FF4500';
            ctx.fillRect(player.size + 8, -1, 2, 2);
            ctx.shadowBlur = 0;
            
            // Muzzle flash when shooting
            if (player.attackCooldown > player.attackRate - 3) {
                ctx.fillStyle = '#FFFF00';
                ctx.shadowColor = '#FF4500';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(player.size + 12, 0, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
            
            ctx.restore(); // End weapon rotation
            ctx.restore(); // End player translation
            
            // Draw player health bar
            if (player.health < player.maxHealth) {
                ctx.fillStyle = 'red';
                ctx.fillRect(player.x - 20, player.y - 25, 40, 4);
                ctx.fillStyle = 'green';
                ctx.fillRect(player.x - 20, player.y - 25, 40 * (player.health / player.maxHealth), 4);
            }
            
            // Draw wave transition message
            if (betweenWaves && waveTimer > 0) {
                ctx.font = 'bold 36px serif';
                ctx.textAlign = 'center';
                ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
                ctx.shadowBlur = 20;
                
                // Special messages for milestone levels
                let message = `STAGE ${wave} INCOMING...`;
                let color = '#FF4444';
                
                if (wave === 10 || wave === 20 || wave === 30 || wave === 40 || wave === 50 || 
                    wave === 60 || wave === 70 || wave === 75 || wave === 80 || wave === 90 || wave === 100) {
                    message = `⚠️ BOSS STAGE ${wave} ⚠️`;
                    color = '#FF0000';
                    ctx.shadowColor = 'rgba(255, 255, 0, 0.8)';
                } else if (wave === 50) {
                    message = `💀 MEGA BOSS STAGE 50 💀`;
                    color = '#8B0000';
                } else if (wave === 75) {
                    message = `🔥 EPIC BATTLE STAGE 75 🔥`;
                    color = '#FF4500';
                } else if (wave === 100) {
                    message = `👹 FINAL BOSS STAGE 100 👹`;
                    color = '#8B0000';
                    ctx.shadowColor = 'rgba(255, 0, 0, 1.0)';
                } else if (wave % 25 === 0) {
                    message = `⭐ MILESTONE STAGE ${wave} ⭐`;
                    color = '#FFD700';
                } else if (getWaveComposition(wave).bosses > 0) {
                    message = `⚔️ BOSS STAGE ${wave} ⚔️`;
                    color = '#FF6600';
                }
                
                ctx.fillStyle = color;
                ctx.fillText(message, canvas.width / 2, 100);
                
                ctx.font = 'bold 48px serif';
                ctx.fillStyle = '#FFFFFF';
                ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                ctx.fillText(Math.ceil(waveTimer / 60), canvas.width / 2, 150);
                ctx.shadowBlur = 0;
            }
            
            ctx.restore(); // End screen shake
            
            // Draw upgrade menu (outside screen shake)
            if (showUpgradeMenu) {
                // Dark overlay
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Menu background
                const menuWidth = 600;
                const menuHeight = 400;
                const menuX = (canvas.width - menuWidth) / 2;
                const menuY = (canvas.height - menuHeight) / 2;
                
                ctx.fillStyle = 'rgba(50, 0, 0, 0.9)';
                ctx.fillRect(menuX, menuY, menuWidth, menuHeight);
                ctx.strokeStyle = '#FF4444';
                ctx.lineWidth = 3;
                ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);
                
                // Level up title
                ctx.font = 'bold 32px serif';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#FFD700';
                ctx.shadowColor = '#FF4444';
                ctx.shadowBlur = 10;
                ctx.fillText(`LEVEL ${playerLevel}!`, canvas.width / 2, menuY + 50);
                ctx.fillText('Choose an Upgrade:', canvas.width / 2, menuY + 90);
                ctx.shadowBlur = 0;
                
                // Upgrade options
                ctx.font = '20px serif';
                ctx.textAlign = 'left';
                const optionStartY = menuY + 140;
                const optionHeight = 60;
                
                // Get mouse position for hover effects
                const rect = canvas.getBoundingClientRect();
                const mouseX = mouse.x - rect.left;
                const mouseY = mouse.y - rect.top;
                
                for (let i = 0; i < availableUpgrades.length; i++) {
                    const upgrade = availableUpgrades[i];
                    const optionY = optionStartY + (i * (optionHeight + 20));
                    
                    // Check if mouse is hovering over this option
                    const isHovered = mouseX >= menuX + 20 && mouseX <= menuX + menuWidth - 20 &&
                                     mouseY >= optionY - 5 && mouseY <= optionY + optionHeight - 5;
                    
                    // Background with hover effect
                    ctx.fillStyle = isHovered ? 'rgba(150, 0, 0, 0.8)' : 'rgba(100, 0, 0, 0.5)';
                    ctx.fillRect(menuX + 20, optionY - 5, menuWidth - 40, optionHeight);
                    ctx.strokeStyle = isHovered ? '#FF8888' : '#FF6666';
                    ctx.lineWidth = isHovered ? 3 : 2;
                    ctx.strokeRect(menuX + 20, optionY - 5, menuWidth - 40, optionHeight);
                    
                    // Upgrade name
                    ctx.fillStyle = isHovered ? '#FFFF00' : '#FFFFFF';
                    ctx.font = isHovered ? 'bold 26px serif' : 'bold 24px serif';
                    ctx.fillText(`${i + 1}. ${upgrade.name}`, menuX + 40, optionY + 20);
                    
                    // Upgrade description
                    ctx.font = '18px serif';
                    ctx.fillStyle = isHovered ? '#EEEEEE' : '#CCCCCC';
                    ctx.fillText(upgrade.description, menuX + 60, optionY + 45);
                }
                
                // Instructions
                ctx.font = '16px serif';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#FFFF00';
                ctx.fillText('Press 1, 2, or 3 to select an upgrade (or click)', canvas.width / 2, menuY + menuHeight - 20);
            }
            
            // Draw weapon store
            if (showStore) {
                // Dark overlay
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Store background - make much larger to show all weapons
                const storeWidth = 900;
                const storeHeight = Math.min(canvas.height - 40, 800); // Take up most of screen height
                const storeX = (canvas.width - storeWidth) / 2;
                const storeY = (canvas.height - storeHeight) / 2;
                
                // Improved background with better contrast
                ctx.fillStyle = 'rgba(20, 20, 20, 0.95)';
                ctx.fillRect(storeX, storeY, storeWidth, storeHeight);
                
                // Add inner background for better text readability
                ctx.fillStyle = 'rgba(40, 40, 40, 0.9)';
                ctx.fillRect(storeX + 10, storeY + 10, storeWidth - 20, storeHeight - 20);
                
                ctx.strokeStyle = '#00FF00';
                ctx.lineWidth = 3;
                ctx.strokeRect(storeX, storeY, storeWidth, storeHeight);
                
                // Store title with better readability
                ctx.font = 'bold 28px Arial';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#FFFFFF';
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                ctx.strokeText('WEAPON & CONSTRUCTION STORE', canvas.width / 2, storeY + 45);
                ctx.fillText('WEAPON & CONSTRUCTION STORE', canvas.width / 2, storeY + 45);
                
                ctx.font = 'bold 20px Arial';
                ctx.fillStyle = '#FFFF00';
                ctx.strokeText(`Money: $${playerCurrency} | Level: ${playerLevel}`, canvas.width / 2, storeY + 75);
                ctx.fillText(`Money: $${playerCurrency} | Level: ${playerLevel}`, canvas.width / 2, storeY + 75);
                
                // Display construction supplies first with better readability
                ctx.font = 'bold 18px Arial';
                ctx.fillStyle = '#FFFFFF';
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 1;
                ctx.textAlign = 'left';
                ctx.strokeText('CONSTRUCTION SUPPLIES:', storeX + 20, storeY + 110);
                ctx.fillText('CONSTRUCTION SUPPLIES:', storeX + 20, storeY + 110);
                
                let suppliesY = storeY + 130;
                Object.keys(constructionSupplies).forEach((key, index) => {
                    const supply = constructionSupplies[key];
                    const canAfford = playerCurrency >= supply.price;
                    
                    // Background
                    ctx.fillStyle = canAfford ? 'rgba(0, 100, 0, 0.3)' : 'rgba(100, 0, 0, 0.3)';
                    ctx.fillRect(storeX + 20, suppliesY - 5, storeWidth - 40, 35);
                    
                    // Border
                    ctx.strokeStyle = canAfford ? '#00FF00' : '#FF4444';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(storeX + 20, suppliesY - 5, storeWidth - 40, 35);
                    
                    // Supply info with better readability
                    ctx.font = 'bold 16px Arial';
                    ctx.fillStyle = canAfford ? '#FFFFFF' : '#CCCCCC';
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = 1;
                    ctx.strokeText(`${supply.name} - $${supply.price}`, storeX + 40, suppliesY + 12);
                    ctx.fillText(`${supply.name} - $${supply.price}`, storeX + 40, suppliesY + 12);
                    
                    ctx.font = '12px Arial';
                    ctx.fillStyle = canAfford ? '#DDDDDD' : '#999999';
                    ctx.strokeText(supply.description, storeX + 40, suppliesY + 26);
                    ctx.fillText(supply.description, storeX + 40, suppliesY + 26);
                    
                    suppliesY += 40;
                });
                
                // Show ALL weapons, not just available ones
                const availableWeapons = Object.keys(weapons);
                const weaponStartY = suppliesY + 20;
                const weaponHeight = 50; // Increased height for better text visibility
                
                // Get mouse position for hover effects
                const rect = canvas.getBoundingClientRect();
                const mouseX = mouse.x - rect.left;
                const mouseY = mouse.y - rect.top;
                
                // Group weapons by category
                const weaponCategories = {};
                availableWeapons.forEach(key => {
                    const weapon = weapons[key];
                    if (!weaponCategories[weapon.category]) {
                        weaponCategories[weapon.category] = [];
                    }
                    weaponCategories[weapon.category].push({key, ...weapon});
                });
                
                let currentY = weaponStartY - storeScrollY; // Apply scroll offset
                
                // Create clipping region for scrollable area
                ctx.save();
                ctx.beginPath();
                ctx.rect(storeX, storeY + 100, storeWidth, storeHeight - 140); // Leave space for title and instructions
                ctx.clip();
                
                Object.keys(weaponCategories).forEach(category => {
                    // Only render if category is visible
                    if (currentY + 20 > storeY + 100 && currentY < storeY + storeHeight - 40) {
                        // Category header with better readability
                        ctx.font = 'bold 18px Arial';
                        ctx.fillStyle = '#FFFFFF';
                        ctx.strokeStyle = '#000000';
                        ctx.lineWidth = 2;
                        ctx.strokeText(`${category}:`, storeX + 30, currentY);
                        ctx.fillText(`${category}:`, storeX + 30, currentY);
                    }
                    currentY += 20; // Reduced category header spacing
                    
                    weaponCategories[category].forEach((weapon, i) => {
                        const weaponY = currentY;
                        
                        // Only render if weapon is visible in scrollable area
                        if (weaponY + weaponHeight > storeY + 100 && weaponY < storeY + storeHeight - 40) {
                            // Check if mouse is hovering over this weapon
                            const isHovered = mouseX >= storeX + 20 && mouseX <= storeX + storeWidth - 20 &&
                                             mouseY >= weaponY - 5 && mouseY <= weaponY + weaponHeight - 5;
                        
                        const isOwned = weapon.key === currentWeapon;
                        const canAfford = playerCurrency >= weapon.price;
                        const isUnlocked = playerLevel >= weapon.unlockLevel;
                        
                        // Background with hover/status effects
                        if (isOwned) {
                            ctx.fillStyle = 'rgba(0, 100, 0, 0.8)';
                        } else if (!isUnlocked) {
                            ctx.fillStyle = 'rgba(100, 100, 0, 0.3)'; // Yellow for locked
                        } else if (canAfford && isHovered) {
                            ctx.fillStyle = 'rgba(0, 150, 0, 0.6)';
                        } else if (canAfford) {
                            ctx.fillStyle = 'rgba(0, 80, 0, 0.4)';
                        } else {
                            ctx.fillStyle = 'rgba(80, 0, 0, 0.4)';
                        }
                        
                        ctx.fillRect(storeX + 20, weaponY - 5, storeWidth - 40, weaponHeight);
                        
                        // Border
                        if (isOwned) {
                            ctx.strokeStyle = '#00FF00';
                        } else if (!isUnlocked) {
                            ctx.strokeStyle = '#FFFF00'; // Yellow border for locked
                        } else if (canAfford) {
                            ctx.strokeStyle = isHovered ? '#44FF44' : '#006600';
                        } else {
                            ctx.strokeStyle = '#666666';
                        }
                        ctx.lineWidth = 2;
                        ctx.strokeRect(storeX + 20, weaponY - 5, storeWidth - 40, weaponHeight);
                        
                        // Weapon info with better readability
                        ctx.font = 'bold 15px Arial';
                        ctx.strokeStyle = '#000000';
                        ctx.lineWidth = 1;
                        
                        if (isOwned) {
                            ctx.fillStyle = '#00FF00'; // Bright green for equipped
                        } else if (!isUnlocked) {
                            ctx.fillStyle = '#FFAA00'; // Orange for locked
                        } else if (canAfford) {
                            ctx.fillStyle = '#FFFFFF'; // White for affordable
                        } else {
                            ctx.fillStyle = '#AAAAAA'; // Light gray for too expensive
                        }
                        
                        let statusText;
                        if (isOwned) {
                            statusText = ' (EQUIPPED)';
                        } else if (!isUnlocked) {
                            statusText = ` (LOCKED - LVL ${weapon.unlockLevel})`;
                        } else if (weapon.price === 0) {
                            statusText = ' (FREE)';
                        } else {
                            const adjustedPrice = getAdjustedWeaponPrice(weapon.key);
                            statusText = ` - $${adjustedPrice}`;
                            if (gameDifficulty === 'easy' && adjustedPrice < weapon.price) {
                                statusText += ` (${Math.round((1 - adjustedPrice/weapon.price) * 100)}% OFF)`;
                            }
                        }
                        
                        // Truncate long weapon names if needed
                        const maxNameWidth = storeWidth - 80;
                        let weaponNameText = `${weapon.name}${statusText}`;
                        if (ctx.measureText(weaponNameText).width > maxNameWidth) {
                            const baseName = weapon.name.length > 20 ? weapon.name.substring(0, 17) + '...' : weapon.name;
                            weaponNameText = `${baseName}${statusText}`;
                        }
                        
                        // Draw weapon name with outline for better readability
                        ctx.strokeText(weaponNameText, storeX + 40, weaponY + 16);
                        ctx.fillText(weaponNameText, storeX + 40, weaponY + 16);
                        
                        // Stats with better readability
                        ctx.font = '12px Arial';
                        ctx.fillStyle = '#DDDDDD';
                        const statsLine1 = `DMG: ${weapon.damage} | Rate: ${weapon.fireRate}`;
                        ctx.strokeText(statsLine1, storeX + 50, weaponY + 30);
                        ctx.fillText(statsLine1, storeX + 50, weaponY + 30);
                        
                        // Description on separate line, truncated if needed
                        const maxDescWidth = storeWidth - 100;
                        let description = weapon.description;
                        if (ctx.measureText(description).width > maxDescWidth) {
                            while (ctx.measureText(description + '...').width > maxDescWidth && description.length > 10) {
                                description = description.substring(0, description.length - 1);
                            }
                            description += '...';
                        }
                        
                        // Description with better readability - positioned higher to be fully visible
                        ctx.font = '11px Arial';
                        ctx.fillStyle = '#BBBBBB';
                        ctx.strokeText(description, storeX + 50, weaponY + 44);
                        ctx.fillText(description, storeX + 50, weaponY + 44);
                        }
                        
                        currentY += weaponHeight + 3; // Reduced spacing between weapons
                    });
                    
                    currentY += 5; // Reduced space between categories
                });
                
                // Restore clipping
                ctx.restore();
                
                // Draw scrollbar
                if (currentY + storeScrollY > storeY + storeHeight - 140) {
                    const scrollbarHeight = Math.max(20, (storeHeight - 140) * (storeHeight - 140) / (currentY + storeScrollY - weaponStartY));
                    const scrollbarY = storeY + 100 + (storeScrollY / (currentY + storeScrollY - weaponStartY - storeHeight + 140)) * (storeHeight - 140 - scrollbarHeight);
                    
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.fillRect(storeX + storeWidth - 15, scrollbarY, 10, scrollbarHeight);
                }
                
                // Instructions with better readability
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#FFFFFF';
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                ctx.strokeText('Q: Hammer | W: Nails | E: Wood | Numbers: Weapons | B: Close | SCROLL: Mouse Wheel', canvas.width / 2, storeY + storeHeight - 20);
                ctx.fillText('Q: Hammer | W: Nails | E: Wood | Numbers: Weapons | B: Close | SCROLL: Mouse Wheel', canvas.width / 2, storeY + storeHeight - 20);
            }
        }
        
        function gameLoop() {
            updateGame();
            drawGame();
            requestAnimationFrame(gameLoop);
        }
        
        function togglePause() {
            if (!gameRunning) return;
            
            gamePaused = !gamePaused;
            const pauseButton = document.getElementById('pauseButton');
            const pauseOverlay = document.getElementById('pauseOverlay');
            
            if (gamePaused) {
                pauseButton.textContent = '▶';
                pauseOverlay.style.display = 'block';
            } else {
                pauseButton.textContent = '⏸';
                pauseOverlay.style.display = 'none';
            }
        }

        function quitGame() {
            // Stop the game
            gameRunning = false;
            gamePaused = false;
            
            // Hide pause overlay
            document.getElementById('pauseOverlay').style.display = 'none';
            
            // Reset pause button
            document.getElementById('pauseButton').textContent = '⏸';
            
            // Show game over screen with final stats
            gameOver('Game Quit - Thanks for Playing!');
        }

        function initGame() {
            // Reset all game state
            gameRunning = false;
            gamePaused = false;
            
            // Reset player based on difficulty
            player.x = canvas.width / 2;
            player.y = canvas.height / 2;
            
            if (gameDifficulty === 'easy') {
                player.health = 120;
                player.maxHealth = 120;
                player.healRate = 0.8;
            } else if (gameDifficulty === 'normal') {
                player.health = 100;
                player.maxHealth = 100;
                player.healRate = 0.5;
            } else {
                player.health = 50;
                player.maxHealth = 50;
                player.healRate = 0.1;
            }
            
            player.speed = 4;
            player.damage = 25;
            player.attackRate = 15;
            player.piercingShots = false;
            player.explosiveRounds = false;
            player.lifeSteal = 0;
            
            // Reset game state
            score = 0;
            wave = 1;
            zombiesPerWave = 5;
            zombiesKilled = 0;
            playerXP = 0;
            playerLevel = 1;
            xpToNextLevel = 100;
            currentWeapon = 'pistol';
            
            // Set starting currency based on difficulty
            if (gameDifficulty === 'easy') {
                playerCurrency = 800; // Start with generous money in easy mode
            } else if (gameDifficulty === 'normal') {
                playerCurrency = 200; // Start with some money in normal mode
            } else {
                playerCurrency = 0; // No starting money in hardcore mode
            }
            
            // Reset arrays
            zombies = [];
            bullets = [];
            companions = [];
            bloodEffects = [];
            
            // Reset tools
            playerHasHammer = false;
            playerHasNails = 0;
            playerHasWood = 0;
            
            // Initialize walls and start first wave
            initializeWalls();
            startWave();
        }

        function startNewGame(difficulty = 'normal') {
            // Set game difficulty
            gameDifficulty = difficulty;
            
            // Update difficulty display in UI
            const difficultyDisplay = document.getElementById('difficultyDisplay');
            if (difficulty === 'easy') {
                difficultyDisplay.textContent = '😊 EASY MODE';
                difficultyDisplay.style.color = '#00ff00';
            } else if (difficulty === 'normal') {
                difficultyDisplay.textContent = '🎯 NORMAL MODE';
                difficultyDisplay.style.color = '#ffaa00';
            } else {
                difficultyDisplay.textContent = '💀 HARDCORE MODE';
                difficultyDisplay.style.color = '#ff4444';
            }
            
            // Hide start menu
            document.getElementById('startMenu').style.display = 'none';
            
            // Initialize and start the game
            initGame();
            gameRunning = true;
            gamePaused = false;
            
            // Start the game loop
            gameLoop();
        }

        function showInstructions() {
            // Hide start menu and show pause overlay with instructions
            document.getElementById('startMenu').style.display = 'none';
            document.getElementById('pauseOverlay').style.display = 'block';
            
            // Add a back to menu button functionality
            const pauseButtons = document.querySelector('.pause-buttons');
            if (pauseButtons && !pauseButtons.querySelector('.back-to-menu')) {
                const backButton = document.createElement('button');
                backButton.textContent = 'Back to Menu';
                backButton.className = 'menu-button back-to-menu';
                backButton.onclick = function() {
                    document.getElementById('pauseOverlay').style.display = 'none';
                    document.getElementById('startMenu').style.display = 'flex';
                    this.remove(); // Remove the back button
                };
                pauseButtons.appendChild(backButton);
            }
        }

        function getAdjustedWeaponPrice(weaponKey) {
            const basePrice = weapons[weaponKey].price;
            if (gameDifficulty === 'easy') {
                return Math.floor(basePrice * 0.25); // 75% cheaper in easy mode
            } else if (gameDifficulty === 'normal') {
                return Math.floor(basePrice * 0.6); // 40% cheaper in normal mode
            }
            return basePrice; // Full price in hardcore mode
        }

        function returnToMenu() {
            // Stop the game if running
            gameRunning = false;
            gamePaused = false;
            
            // Hide all overlays
            document.getElementById('gameOver').style.display = 'none';
            document.getElementById('pauseOverlay').style.display = 'none';
            document.getElementById('highScoresModal').style.display = 'none';
            
            // Show start menu
            document.getElementById('startMenu').style.display = 'flex';
            
            // Reset pause button
            document.getElementById('pauseButton').textContent = '⏸';
        }

        function toggleFullscreen() {
            if (!document.fullscreenElement) {
                // Enter fullscreen
                document.documentElement.requestFullscreen().then(() => {
                    resizeCanvas();
                    document.getElementById('fullscreenButton').textContent = '⛶';
                }).catch(err => {
                    console.error('Error attempting to enable fullscreen:', err);
                });
            } else {
                // Exit fullscreen
                document.exitFullscreen().then(() => {
                    resizeCanvas();
                    document.getElementById('fullscreenButton').textContent = '⛶';
                });
            }
        }

        function resizeCanvas() {
            // Save current game state
            const wasRunning = gameRunning;
            
            if (document.fullscreenElement) {
                // Fullscreen mode - use full screen dimensions
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            } else {
                // Normal mode - use original dimensions
                canvas.width = 900;
                canvas.height = 600;
            }
            
            // Update safe zone position to center
            safeZone.x = canvas.width / 2 - 100;
            safeZone.y = canvas.height / 2 - 100;
            
            // Re-initialize walls with new dimensions
            if (walls.length > 0) {
                initializeWalls();
            }
            
            gameRunning = wasRunning;
        }
        
        function buyCompanion() {
            if (spawnCompanion()) {
                updateCompanionButton();
            }
        }
        
        function updateCompanionButton() {
            const button = document.getElementById('companionButton');
            const canAfford = playerCurrency >= companionCost;
            const hasSpace = companions.length < maxCompanions;
            
            if (!hasSpace) {
                button.textContent = `Max Allies (${companions.length}/${maxCompanions})`;
                button.disabled = true;
            } else if (!canAfford) {
                button.textContent = `+ Add Ally ($${companionCost})`;
                button.disabled = true;
            } else {
                button.textContent = `+ Add Ally ($${companionCost})`;
                button.disabled = false;
            }
        }
        
        function toggleUpgradeMenu() {
            if (companions.length === 0) {
                console.log("No allies to upgrade!");
                return;
            }
            
            showUpgradeMenu = !showUpgradeMenu;
            if (showUpgradeMenu && selectedCompanionIndex === -1) {
                selectedCompanionIndex = 0; // Select first companion by default
            }
        }
        
        function selectNextCompanion() {
            if (companions.length > 0) {
                selectedCompanionIndex = (selectedCompanionIndex + 1) % companions.length;
            }
        }
        
        function selectPrevCompanion() {
            if (companions.length > 0) {
                selectedCompanionIndex = (selectedCompanionIndex - 1 + companions.length) % companions.length;
            }
        }
        
        // function upgradeSelectedCompanion(upgradeType) {
            // if (selectedCompanionIndex >= 0 && selectedCompanionIndex < companions.length) {
                // const companion = companions[selectedCompanionIndex];
                // if (companion.upgrade(upgradeType)) {
                    // console.log(`${companion.name} upgraded ${upgradeType}! Cost: $${companion.getUpgradeCost(upgradeType)}`);
                    // return true;
                // } else {
                    // console.log(`Not enough money to upgrade ${companion.name}'s ${upgradeType}`);
                // }
            // }
            // return false;
        // }
        
        function gameOver(customMessage = null) {
            gameRunning = false;
            currentScore = score;
            document.getElementById('finalScore').textContent = score;
            document.getElementById('finalWave').textContent = wave - 1;
            
            // Set custom game over message if provided
            if (customMessage) {
                document.getElementById('gameOverMessage').textContent = customMessage;
            } else {
                document.getElementById('gameOverMessage').textContent = 'Game Over!';
            }
            
            // Check if it's a high score
            loadHighScores();
            isNewHighScore = checkIfHighScore(score, wave - 1);
            
            if (isNewHighScore) {
                document.getElementById('newHighScore').style.display = 'block';
                document.getElementById('playerName').focus();
            }
            
            document.getElementById('gameOver').style.display = 'block';
        }

        // High Score System Functions
        function loadHighScores() {
            const saved = localStorage.getItem('zombieHighScores');
            highScores = saved ? JSON.parse(saved) : [];
        }

        function saveHighScoresData() {
            localStorage.setItem('zombieHighScores', JSON.stringify(highScores));
        }

        function checkIfHighScore(score, waves) {
            loadHighScores();
            if (highScores.length < 10) return true;
            return score > highScores[highScores.length - 1].score;
        }

        function saveHighScore() {
            const playerName = document.getElementById('playerName').value.trim() || 'Anonymous';
            
            const newScore = {
                name: playerName,
                score: currentScore,
                waves: wave - 1,
                date: new Date().toLocaleDateString()
            };

            highScores.push(newScore);
            highScores.sort((a, b) => b.score - a.score);
            
            // Keep only top 10 scores
            if (highScores.length > 10) {
                highScores = highScores.slice(0, 10);
            }

            saveHighScoresData();
            document.getElementById('newHighScore').style.display = 'none';
            showHighScores();
        }

        function showHighScores() {
            loadHighScores();
            const modal = document.getElementById('highScoresModal');
            const list = document.getElementById('highScoresList');
            
            if (highScores.length === 0) {
                list.innerHTML = '<p style="text-align: center; color: #888;">No high scores yet! Be the first!</p>';
            } else {
                list.innerHTML = highScores.map((score, index) => `
                    <div class="high-score-entry">
                        <span class="score-rank">${index + 1}.</span>
                        <span class="score-name">${score.name}</span>
                        <div class="score-details">
                            <div class="score-points">${score.score.toLocaleString()}</div>
                            <div class="score-waves">Wave ${score.waves} • ${score.date}</div>
                        </div>
                    </div>
                `).join('');
            }
            
            modal.style.display = 'flex';
        }

        function closeHighScores() {
            document.getElementById('highScoresModal').style.display = 'none';
        }

        function clearHighScores() {
            if (confirm('Are you sure you want to clear all high scores? This cannot be undone!')) {
                highScores = [];
                localStorage.removeItem('zombieHighScores');
                showHighScores(); // Refresh the display
            }
        }
        
        function restartGame() {
            gameRunning = true;
            
            // Reset player
            player.x = canvas.width / 2;
            player.y = canvas.height / 2;
            player.health = 50;
            player.maxHealth = 50;
            player.speed = 4;
            player.damage = 25;
            player.attackRate = 15;
            player.healRate = 0.1;
            player.piercingShots = false;
            player.explosiveRounds = false;
            player.lifeSteal = 0;
            
            // Reset game state
            score = 0;
            wave = 1;
            zombiesPerWave = 5;
            playerXP = 0;
            playerLevel = 1;
            xpToNextLevel = 100;
            showUpgradeMenu = false;
            availableUpgrades = [];
            
            // Reset targeting and weapon system
            autoTargetEnabled = true;
            targetedZombie = null;
            targetingRange = 200;
            currentWeapon = 'pistol';
            playerCurrency = 0;
            showStore = false;
            document.getElementById('autoTargetStatus').textContent = 'ON';
            document.getElementById('autoTargetStatus').style.color = '#00ff00';
            
            // Reset arrays
            zombies = [];
            bullets = [];
            particles = [];
            companions = [];
            companionCost = 500;
            walls = [];
            wallRebuildCost = 50;
            
            // Reset construction tools
            playerHasHammer = false;
            playerHasNails = 0;
            playerHasWood = 0;
            
            // Initialize walls around village
            initializeWalls();
            
            document.getElementById('gameOver').style.display = 'none';
            startWave();
        }
        
        // Event listeners
        window.addEventListener('keydown', (e) => {
            // High score name entry
            if (isNewHighScore && document.getElementById('newHighScore').style.display !== 'none') {
                if (e.key === 'Enter') {
                    saveHighScore();
                    return;
                }
            }

            // High scores modal controls
            if (document.getElementById('highScoresModal').style.display === 'flex') {
                if (e.key === 'Escape') {
                    closeHighScores();
                    return;
                }
            }
            
            // Upgrade selection
            if (showUpgradeMenu) {
                if (e.key === '1') selectUpgrade(0);
                if (e.key === '2') selectUpgrade(1);
                if (e.key === '3') selectUpgrade(2);
                return; // Don't process other keys during upgrade menu
            }
            
            // Upgrade menu selection
            if (showUpgradeMenu) {
                if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                    selectNextCompanion();
                } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                    selectPrevCompanion();
                } else if (e.key === '1') {
                    upgradeSelectedCompanion('damage');
                } else if (e.key === '2') {
                    upgradeSelectedCompanion('range');
                } else if (e.key === '3') {
                    upgradeSelectedCompanion('health');
                } else if (e.key === 'u' || e.key === 'U') {
                    toggleUpgradeMenu();
                }
                return; // Don't process other keys during upgrade menu
            }
            
            // Store selection
            if (showStore) {
                // Construction supplies (Q, W, E keys)
                if (e.key === 'q' || e.key === 'Q') {
                    purchaseSupply('hammer');
                } else if (e.key === 'w' || e.key === 'W') {
                    purchaseSupply('nails');
                } else if (e.key === 'e' || e.key === 'E') {
                    purchaseSupply('wood');
                }
                
                // Weapons (number keys) - now shows all weapons but only allows purchasing unlocked ones
                const allWeapons = Object.keys(weapons);
                const keyIndex = parseInt(e.key) - 1;
                if (keyIndex >= 0 && keyIndex < allWeapons.length) {
                    const weaponKey = allWeapons[keyIndex];
                    const weapon = weapons[weaponKey];
                    if (playerLevel >= weapon.unlockLevel && playerCurrency >= weapon.price && weaponKey !== currentWeapon) {
                        playerCurrency -= weapon.price;
                        currentWeapon = weaponKey;
                        player.damage = weapon.damage;
                        player.attackRate = weapon.fireRate;
                        showStore = false;
                    } else if (playerLevel < weapon.unlockLevel) {
                        console.log(`Weapon ${weapon.name} is locked until level ${weapon.unlockLevel}`);
                    }
                }
                if (e.key === 'b' || e.key === 'B') {
                    toggleStore();
                }
                return; // Don't process other keys during store
            }
            
            // Toggle pause with P or Escape key
            if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
                togglePause();
            }
            
            // Toggle auto-targeting with T key
            if (e.key === 't' || e.key === 'T') {
                autoTargetEnabled = !autoTargetEnabled;
                targetedZombie = null;
                document.getElementById('autoTargetStatus').textContent = autoTargetEnabled ? 'ON' : 'OFF';
                document.getElementById('autoTargetStatus').style.color = autoTargetEnabled ? '#00ff00' : '#ff0000';
            }
            
            // Toggle store with B key
            if (e.key === 'b' || e.key === 'B') {
                toggleStore();
            }
            
            // Emergency skip for level 7 (press F key)
            if (e.key === 'f' || e.key === 'F') {
                if (wave === 7 && !betweenWaves) {
                    console.log('[MANUAL SKIP] Forcing completion of level 7');
                    zombiesKilled = zombiesPerWave;
                    zombies.length = 0; // Clear any remaining zombies
                }
            }
            
            // Toggle companion upgrade menu with U key
            // if (e.key === 'u' || e.key === 'U') {
                // toggleUpgradeMenu();
            // }
            
            // Rebuild walls with R key
            if (e.key === 'r' || e.key === 'R') {
                const nearestWall = findNearestDamagedWall(player);
                if (nearestWall && playerHasHammer && playerHasNails >= nailsPerWall && playerHasWood >= woodPerWall) {
                    let success = false;
                    if (nearestWall.isDestroyed) {
                        success = nearestWall.startRebuilding();
                    } else if (nearestWall.canBeRepaired()) {
                        success = nearestWall.startRepairing();
                    }
                    
                    if (success) {
                        playerHasNails -= nailsPerWall;
                        playerHasWood -= woodPerWall;
                        
                        // Visual feedback
                        createHitEffect(nearestWall.x + nearestWall.width/2, nearestWall.y + nearestWall.height/2);
                    }
                } else if (!nearestWall) {
                    console.log("No damaged walls nearby to rebuild");
                } else if (!playerHasHammer) {
                    console.log("Need a hammer to rebuild walls! Buy tools from store");
                } else if (playerHasNails < nailsPerWall) {
                    console.log(`Need ${nailsPerWall} nails to rebuild walls! Buy supplies from store`);
                } else if (playerHasWood < woodPerWall) {
                    console.log(`Need ${woodPerWall} wood pieces to rebuild walls! Buy supplies from store`);
                }
            }
            
            keys[e.key.toLowerCase()] = true;
            
            // Debug: log key press
            console.log('Key pressed:', e.key.toLowerCase());
        });
        
        window.addEventListener('keyup', (e) => {
            keys[e.key.toLowerCase()] = false;
        });
        
        window.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });
        
        window.addEventListener('mousedown', (e) => {
            // Handle upgrade menu clicks
            if (showUpgradeMenu) {
                const rect = canvas.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const clickY = e.clientY - rect.top;
                
                const menuWidth = 600;
                const menuHeight = 400;
                const menuX = (canvas.width - menuWidth) / 2;
                const menuY = (canvas.height - menuHeight) / 2;
                const optionStartY = menuY + 140;
                const optionHeight = 60;
                
                // Check if click is within upgrade options
                for (let i = 0; i < availableUpgrades.length; i++) {
                    const optionY = optionStartY + (i * (optionHeight + 20));
                    
                    if (clickX >= menuX + 20 && clickX <= menuX + menuWidth - 20 &&
                        clickY >= optionY - 5 && clickY <= optionY + optionHeight - 5) {
                        selectUpgrade(i);
                        return;
                    }
                }
                return; // Don't process other mouse events during upgrade menu
            }
            
            // Handle store clicks
            if (showStore) {
                const rect = canvas.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const clickY = e.clientY - rect.top;
                
                const storeWidth = 900;
                const storeHeight = Math.min(canvas.height - 40, 800);
                const storeX = (canvas.width - storeWidth) / 2;
                const storeY = (canvas.height - storeHeight) / 2;
                const weaponStartY = storeY + 120;
                const weaponHeight = 70;
                
                const availableWeapons = Object.keys(weapons).filter(key => playerLevel >= weapons[key].unlockLevel);
                
                // Group weapons by category for click detection
                const weaponCategories = {};
                availableWeapons.forEach(key => {
                    const weapon = weapons[key];
                    if (!weaponCategories[weapon.category]) {
                        weaponCategories[weapon.category] = [];
                    }
                    weaponCategories[weapon.category].push({key, ...weapon});
                });
                
                let currentY = weaponStartY - storeScrollY; // Apply scroll offset
                let clicked = false;
                
                Object.keys(weaponCategories).forEach(category => {
                    currentY += 20; // Match display spacing
                    
                    weaponCategories[category].forEach((weapon, i) => {
                        const weaponY = currentY;
                        
                        if (!clicked && clickX >= storeX + 20 && clickX <= storeX + storeWidth - 20 &&
                            clickY >= weaponY - 5 && clickY <= weaponY + weaponHeight - 5) {
                            // Check if it's a weapon or upgrade
                            if (weapons[weapon.key]) {
                                // It's a weapon - handle weapon purchase
                                const weaponObj = weapons[weapon.key];
                                const adjustedPrice = getAdjustedWeaponPrice(weapon.key);
                                if (playerCurrency >= adjustedPrice && weapon.key !== currentWeapon && playerLevel >= weaponObj.unlockLevel) {
                                    playerCurrency -= adjustedPrice;
                                    currentWeapon = weapon.key;
                                    player.damage = weaponObj.damage;
                                    player.attackRate = weaponObj.fireRate;
                                    showStore = false;
                                }
                            } else {
                                // It's an upgrade
                                purchaseUpgrade(weapon.key);
                            }
                            clicked = true;
                            return;
                        }
                        
                        currentY += weaponHeight + 3; // Match display spacing
                    });
                    
                    currentY += 5; // Match display spacing
                });
                return; // Don't process other mouse events during store
            }
            
            mouse.pressed = true;
        });
        
        window.addEventListener('mouseup', () => {
            mouse.pressed = false;
        });

        // Add scroll wheel support for store
        window.addEventListener('wheel', (e) => {
            if (showStore) {
                e.preventDefault();
                storeScrollY += e.deltaY * 0.5; // Scroll speed
                
                // Limit scroll bounds (will be calculated dynamically)
                const maxScroll = Math.max(0, 2000); // Estimate max content height
                storeScrollY = Math.max(0, Math.min(storeScrollY, maxScroll));
            }
        });

        // Fullscreen event listeners
        document.addEventListener('fullscreenchange', () => {
            const button = document.getElementById('fullscreenButton');
            if (document.fullscreenElement) {
                button.textContent = '⛷'; // Different icon for "exit fullscreen"
                button.title = 'Exit Fullscreen (F11)';
            } else {
                button.textContent = '⛶'; // Original icon for "enter fullscreen"
                button.title = 'Enter Fullscreen (F11)';
            }
            resizeCanvas();
        });

        // Handle window resize in fullscreen
        window.addEventListener('resize', () => {
            if (document.fullscreenElement) {
                resizeCanvas();
            }
        });

        // F11 key support for fullscreen
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F11') {
                e.preventDefault();
                toggleFullscreen();
            }
        });
        
        // Initialize game but don't start automatically
        loadHighScores(); // Load high scores on page load
        // Game will start when user clicks "Start Game" from the start menu