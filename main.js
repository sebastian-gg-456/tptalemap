import GameScene from './scenes/Game.js';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  scene: [GameScene],
  parent: 'game-container'
};

// Create a new Phaser game instance
window.game = new Phaser.Game(config);



