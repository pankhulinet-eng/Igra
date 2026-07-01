// BlockWorld - Minecraft-style Arcade Game

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Game constants
        this.BLOCK_SIZE = 40;
        this.WORLD_WIDTH = Math.floor(this.canvas.width / this.BLOCK_SIZE);
        this.WORLD_HEIGHT = Math.floor(this.canvas.height / this.BLOCK_SIZE) - 3;
        this.GROUND_LEVEL = this.WORLD_HEIGHT - 5;
        
        // Player
        this.player = {
            x: Math.floor(this.WORLD_WIDTH / 2),
            y: this.GROUND_LEVEL - 2,
            width: 1,
            height: 2,
            velocityY: 0,
            jumping: false,
            health: 10,
            maxHealth: 10,
            inventory: {}
        };
        
        // Blocks
        this.blocks = [];
        this.generateTerrain();
        
        // Game state
        this.gameRunning = true;
        this.blocksDestroyed = 0;
        this.selectedBlock = 'dirt';
        
        // Controls
        this.keys = {};
        this.setupControls();
        
        // Game loop
        this.lastTime = Date.now();
        this.gameLoop();
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight - 140; // Leave space for controls
    }
    
    generateTerrain() {
        // Create ground
        for (let x = 0; x < this.WORLD_WIDTH; x++) {
            for (let y = this.GROUND_LEVEL; y < this.WORLD_HEIGHT; y++) {
                const blockType = Math.random() > 0.7 ? 'stone' : 'dirt';
                this.blocks.push({
                    x: x,
                    y: y,
                    type: blockType,
                    health: blockType === 'stone' ? 5 : 3
                });
            }
        }
        
        // Add trees
        for (let i = 0; i < 5; i++) {
            const x = Math.floor(Math.random() * (this.WORLD_WIDTH - 2)) + 1;
            const y = this.GROUND_LEVEL - 1;
            
            // Tree trunk
            for (let j = 0; j < 4; j++) {
                this.blocks.push({
                    x: x,
                    y: y - j,
                    type: 'wood',
                    health: 4
                });
            }
            
            // Leaves
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 2; dy++) {
                    if (Math.abs(dx) === 1 && Math.abs(dy) === 1) continue; // Skip corners
                    this.blocks.push({
                        x: x + dx,
                        y: y - 3 - dy,
                        type: 'leaves',
                        health: 2
                    });
                }
            }
        }
        
        // Add stone patches
        for (let i = 0; i < 3; i++) {
            const centerX = Math.floor(Math.random() * (this.WORLD_WIDTH - 4)) + 2;
            const centerY = Math.floor(Math.random() * (this.GROUND_LEVEL - 3)) + 3;
            
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const block = this.blocks.find(b => b.x === centerX + dx && b.y === centerY + dy);
                    if (block && Math.random() > 0.3) {
                        block.type = 'stone';
                        block.health = 5;
                    }
                }
            }
        }
    }
    
    setupControls() {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key === ' ') { this.player.jumping = true; e.preventDefault(); }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // Mobile buttons
        document.getElementById('btn-up').addEventListener('touchstart', () => this.keys['up'] = true);
        document.getElementById('btn-up').addEventListener('touchend', () => this.keys['up'] = false);
        document.getElementById('btn-down').addEventListener('touchstart', () => this.keys['down'] = true);
        document.getElementById('btn-down').addEventListener('touchend', () => this.keys['down'] = false);
        document.getElementById('btn-left').addEventListener('touchstart', () => this.keys['left'] = true);
        document.getElementById('btn-left').addEventListener('touchend', () => this.keys['left'] = false);
        document.getElementById('btn-right').addEventListener('touchstart', () => this.keys['right'] = true);
        document.getElementById('btn-right').addEventListener('touchend', () => this.keys['right'] = false);
        
        document.getElementById('btn-mine').addEventListener('click', () => this.mineBlock());
        document.getElementById('btn-build').addEventListener('click', () => this.buildBlock());
        document.getElementById('btn-jump').addEventListener('click', () => this.player.jumping = true);
    }
    
    updatePlayer() {
        const speed = 0.15;
        const gravity = 0.3;
        const jumpPower = 0.8;
        
        // Horizontal movement
        if (this.keys['arrowleft'] || this.keys['a'] || this.keys['left']) {
            this.player.x -= speed;
        }
        if (this.keys['arrowright'] || this.keys['d'] || this.keys['right']) {
            this.player.x += speed;
        }
        if (this.keys['arrowup'] || this.keys['w'] || this.keys['up']) {
            // Climbing
            if (this.canClimb()) {
                this.player.y -= speed;
                this.player.jumping = false;
            }
        }
        
        // Jumping
        if (this.player.jumping && this.isOnGround()) {
            this.player.velocityY = -jumpPower;
            this.player.jumping = false;
        }
        
        // Gravity
        this.player.velocityY += gravity;
        this.player.y += this.player.velocityY;
        
        // Collision with ground
        if (this.player.y + this.player.height >= this.WORLD_HEIGHT) {
            this.player.y = this.WORLD_HEIGHT - this.player.height;
            this.player.velocityY = 0;
        }
        
        // World boundaries
        if (this.player.x < 0) this.player.x = 0;
        if (this.player.x + this.player.width > this.WORLD_WIDTH) {
            this.player.x = this.WORLD_WIDTH - this.player.width;
        }
        
        // Damage from falling
        if (this.player.velocityY > 0.8) {
            const damage = Math.floor((this.player.velocityY - 0.8) * 2);
            this.damagePlayer(damage);
        }
    }
    
    isOnGround() {
        return this.player.y + this.player.height >= this.WORLD_HEIGHT - 0.1;
    }
    
    canClimb() {
        const x = Math.floor(this.player.x + this.player.width / 2);
        const y = Math.floor(this.player.y);
        return this.blocks.some(b => b.x === x && b.y === y);
    }
    
    mineBlock() {
        const x = Math.floor(this.player.x + this.player.width / 2);
        const y = Math.floor(this.player.y + this.player.height);
        
        const block = this.blocks.find(b => b.x === x && b.y === y);
        if (block) {
            block.health--;
            if (block.health <= 0) {
                this.blocks = this.blocks.filter(b => b !== block);
                this.addInventory(block.type);
                this.blocksDestroyed++;
                this.updateScore();
            }
        }
    }
    
    buildBlock() {
        if (!this.hasInventory(this.selectedBlock)) return;
        
        const x = Math.floor(this.player.x + this.player.width / 2);
        const y = Math.floor(this.player.y + this.player.height) + 1;
        
        if (!this.blocks.some(b => b.x === x && b.y === y) && y < this.WORLD_HEIGHT) {
            this.blocks.push({
                x: x,
                y: y,
                type: this.selectedBlock,
                health: this.getBlockHealth(this.selectedBlock)
            });
            this.removeInventory(this.selectedBlock);
            this.updateInventoryUI();
        }
    }
    
    getBlockHealth(type) {
        const health = { dirt: 3, stone: 5, wood: 4, leaves: 2 };
        return health[type] || 3;
    }
    
    addInventory(type) {
        this.player.inventory[type] = (this.player.inventory[type] || 0) + 1;
        this.updateInventoryUI();
    }
    
    removeInventory(type) {
        if (this.player.inventory[type]) {
            this.player.inventory[type]--;
        }
    }
    
    hasInventory(type) {
        return (this.player.inventory[type] || 0) > 0;
    }
    
    damagePlayer(amount) {
        this.player.health = Math.max(0, this.player.health - amount);
        this.updateHealthUI();
        
        if (this.player.health <= 0) {
            this.gameOver();
        }
    }
    
    updateHealthUI() {
        const healthPercent = (this.player.health / this.player.maxHealth) * 100;
        document.getElementById('health').style.width = healthPercent + '%';
        document.getElementById('health-text').textContent = `❤️ ${this.player.health}/${this.player.maxHealth}`;
    }
    
    updateScore() {
        document.getElementById('score-text').textContent = `Блоков: ${this.blocksDestroyed}`;
    }
    
    updateInventoryUI() {
        const container = document.getElementById('inventory-items');
        container.innerHTML = '';
        
        for (const [type, count] of Object.entries(this.player.inventory)) {
            if (count > 0) {
                const item = document.createElement('div');
                item.className = 'inventory-item';
                if (type === this.selectedBlock) item.classList.add('selected');
                
                const emoji = { dirt: '🟫', stone: '⬜', wood: '🟪', leaves: '🟩' }[type] || '📦';
                item.textContent = emoji;
                item.title = `${type}: ${count}`;
                
                item.addEventListener('click', () => {
                    this.selectedBlock = type;
                    this.updateInventoryUI();
                });
                
                container.appendChild(item);
            }
        }
    }
    
    gameOver() {
        this.gameRunning = false;
        document.getElementById('final-score').textContent = `Блоков собрано: ${this.blocksDestroyed}`;
        document.getElementById('game-over').style.display = 'flex';
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#E0F6FF');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Save context
        this.ctx.save();
        
        // Draw ground
        this.ctx.fillStyle = '#90EE90';
        this.ctx.fillRect(0, this.GROUND_LEVEL * this.BLOCK_SIZE, this.canvas.width, this.canvas.height);
        
        // Draw blocks
        this.blocks.forEach(block => {
            this.drawBlock(block);
        });
        
        // Draw player
        this.drawPlayer();
        
        this.ctx.restore();
    }
    
    drawBlock(block) {
        const x = block.x * this.BLOCK_SIZE;
        const y = block.y * this.BLOCK_SIZE;
        const size = this.BLOCK_SIZE - 2;
        
        const colors = {
            dirt: '#8B4513',
            stone: '#808080',
            wood: '#654321',
            leaves: '#228B22'
        };
        
        this.ctx.fillStyle = colors[block.type] || '#999';
        this.ctx.fillRect(x + 1, y + 1, size, size);
        
        // Border
        this.ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x + 1, y + 1, size, size);
        
        // Health indicator for damaged blocks
        if (block.health < this.getBlockHealth(block.type)) {
            const healthPercent = block.health / this.getBlockHealth(block.type);
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            this.ctx.fillRect(x + 1, y + 1, size * (1 - healthPercent), size * 0.1);
        }
    }
    
    drawPlayer() {
        const x = this.player.x * this.BLOCK_SIZE;
        const y = this.player.y * this.BLOCK_SIZE;
        const width = this.player.width * this.BLOCK_SIZE;
        const height = this.player.height * this.BLOCK_SIZE;
        
        // Body
        this.ctx.fillStyle = '#FF6B6B';
        this.ctx.fillRect(x + 2, y + 2, width - 4, height - 4);
        
        // Eyes
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(x + 5, y + 5, 4, 4);
        this.ctx.fillRect(x + width - 9, y + 5, 4, 4);
        
        // Pupils
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(x + 6, y + 6, 2, 2);
        this.ctx.fillRect(x + width - 8, y + 6, 2, 2);
        
        // Border
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x + 2, y + 2, width - 4, height - 4);
    }
    
    gameLoop() {
        if (!this.gameRunning) {
            return;
        }
        
        this.updatePlayer();
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start game
window.addEventListener('load', () => {
    new Game();
});