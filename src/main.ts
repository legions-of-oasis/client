import './style.css'
import Phaser from 'phaser'
import { DungeonScene } from './scenes/dungeonScene'
import { StartScene } from './scenes/landingScene'
import { ConnectScene } from './scenes/connectScene'
import ClaimScene from './scenes/claimScene'
import GameUIScene from './scenes/gameUIScene'

new Phaser.Game({
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.RESIZE,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
    }
  },
  pixelArt: true,
  scene: [StartScene, ConnectScene, GameUIScene, DungeonScene, ClaimScene]
})