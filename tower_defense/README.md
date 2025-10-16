# Tower Defense Master 🏰

A comprehensive tower defense game built with HTML5 Canvas and JavaScript featuring multiple tower types, diverse enemies, wave progression, and strategic gameplay.

## 🎮 Game Features

### Tower Types
- **Basic Tower** - Reliable damage with balanced stats ($50)
- **Cannon Tower** - High damage with explosive area effect ($100)
- **Laser Tower** - Fast firing with long range, hits flying enemies ($150)
- **Ice Tower** - Slows and damages enemies with freezing effects ($80)

### Enemy Types
- **Basic Enemy** - Standard unit with moderate health and speed
- **Fast Enemy** - Quick but fragile, harder to hit
- **Heavy Enemy** - Slow but heavily armored with high health
- **Armored Enemy** - Balanced stats with damage reduction
- **Flying Enemy** - Can only be hit by Laser towers
- **Boss Enemy** - Massive health, high damage, appears on special waves

### Game Mechanics
- **Wave System** - 20 progressive waves with increasing difficulty
- **Tower Upgrades** - Improve damage, range, and fire rate up to 5 levels
- **Special Waves** - Boss waves on waves 5, 10, 15, and 20
- **Status Effects** - Slow and freeze effects from Ice towers
- **Explosive Damage** - Area damage from Cannon towers
- **Economy System** - Earn money by defeating enemies, spend on towers and upgrades

## 🎯 How to Play

### Starting the Game
1. Open `index.html` in a modern web browser
2. The game starts with $500 and 100 health
3. Click "Start Wave" to begin the first wave

### Tower Placement
1. Click on a tower type in the shop (right side)
2. Move your mouse over the game area
3. Green circle = valid placement, Red circle = invalid
4. Left-click to place the tower
5. Right-click to cancel placement

### Tower Management
1. Click on a placed tower to select it
2. Use "Sell Tower" to get 70% of total investment back
3. Use "Upgrade Tower" to improve its stats
4. Selected towers show their range as a white circle

### Wave Management
- Click "Start Wave" to begin the next wave
- Enemies follow the brown path from left to right
- Defeat all enemies before they reach the end
- Each enemy that reaches the end reduces your health

## 🎮 Controls

### Mouse Controls
- **Left Click**: Select/Place tower, Select placed tower
- **Right Click**: Cancel tower placement
- **Hover**: Show tower information and range

### Keyboard Shortcuts
- **Space**: Pause/Resume game
- **Enter**: Start next wave
- **Escape**: Cancel tower placement
- **1-4**: Quick select tower types (1=Basic, 2=Cannon, 3=Laser, 4=Ice)
- **S**: Sell selected tower
- **U**: Upgrade selected tower

### Game Controls
- **Pause**: Pause/resume the game
- **Speed**: Change game speed (1x, 2x, 4x)
- **Sell Tower**: Sell the selected tower
- **Upgrade Tower**: Upgrade the selected tower
- **Restart Game**: Reset to beginning

## 🏆 Strategy Tips

### Early Game (Waves 1-5)
- Start with Basic towers for cost efficiency
- Place towers at path corners for maximum coverage
- Save money for the first boss wave (Wave 5)

### Mid Game (Waves 6-15)
- Upgrade existing towers rather than building many new ones
- Use Ice towers to slow down fast enemies
- Prepare for flying enemies with Laser towers

### Late Game (Waves 16-20)
- Focus on high-level towers with maximum upgrades
- Use Cannon towers for crowd control
- Combine Ice and Cannon towers for devastating combos

### Tower Synergies
- **Ice + Cannon**: Slow enemies, then hit with explosive damage
- **Laser + Basic**: Laser hits flying enemies, Basic handles ground units
- **Multiple Ice**: Stack slow effects for maximum crowd control

## 📊 Scoring System

- **Enemy Kills**: 2 points per dollar earned
- **Tower Placement**: 10 points per tower built
- **Tower Upgrades**: 20 points per upgrade
- **Wave Completion**: Bonus points based on wave number
- **Tower Sales**: 5 points per sale (strategic repositioning)

## 🌊 Wave Progression

### Normal Waves (1-4, 6-9, 11-14, 16-19)
- Progressive increase in enemy count and difficulty
- New enemy types introduced gradually
- Spawn rate increases with wave number

### Boss Waves (5, 10, 15, 20)
- **Wave 5**: First boss encounter
- **Wave 10**: Major boss with increased rewards
- **Wave 15**: Elite boss with escort units
- **Wave 20**: Final double boss challenge

## 🛠 Technical Details

### System Requirements
- Modern web browser with HTML5 Canvas support
- JavaScript enabled
- Minimum screen resolution: 1024x768
- Recommended: 1280x800 or higher

### Browser Compatibility
- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+

### File Structure
```
Tower Defense Master/
├── index.html          # Main game page
├── styles.css          # Game styling and UI
├── game.js            # Core game engine
├── enemies.js         # Enemy system and AI
├── towers.js          # Tower mechanics and upgrades  
├── projectiles.js     # Projectile physics and effects
├── waves.js           # Wave management system
├── ui.js              # User interface management
└── README.md          # This documentation
```

## 🎨 Customization

### Adding New Tower Types
1. Add tower configuration to `towers.js`
2. Update shop HTML in `index.html`
3. Add CSS styling for new tower icons
4. Implement rendering in `Tower.renderTurret()`

### Adding New Enemy Types
1. Add enemy configuration to `enemies.js`
2. Update `EnemyFactory.getEnemyTypeForWave()`
3. Implement custom rendering in `Enemy.renderEnemyShape()`

### Modifying Game Balance
- Edit tower stats in `towers.js`
- Adjust enemy stats in `enemies.js`
- Modify wave progression in `waves.js`
- Change economy values in `game.js`

## 🐛 Troubleshooting

### Performance Issues
- Reduce particle effects by modifying `createHitEffect()` functions
- Lower maximum trail length in projectiles
- Adjust game speed if frame rate drops

### Visual Glitches
- Ensure browser hardware acceleration is enabled
- Try refreshing the page to reset canvas state
- Check browser console for JavaScript errors

### Gameplay Issues
- Towers not shooting: Check if enemies are in range and line of sight
- Can't place towers: Ensure sufficient money and valid placement location
- Wave won't start: Complete current wave first by defeating all enemies

## 🏅 Achievements to Aim For

- **Defender**: Complete 10 waves
- **Strategist**: Win without losing any health
- **Engineer**: Build 20 towers in one game
- **Economist**: Accumulate 2000+ money
- **Survivor**: Reach wave 20
- **Perfect Victory**: Complete all waves with 100 health

## 🤝 Contributing

This is an educational project demonstrating game development concepts:
- Object-oriented JavaScript design
- HTML5 Canvas rendering
- Game loop and state management
- Physics and collision detection
- UI/UX design principles

Feel free to extend and modify the code for learning purposes!

## 📜 License

This project is open source and available for educational use. Built with vanilla JavaScript for maximum compatibility and learning value.

---

**Enjoy defending your base!** 🛡️

For questions or suggestions, check the code comments in each JavaScript file for detailed implementation notes.