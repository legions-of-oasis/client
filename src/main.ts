import './style.css'
import Phaser from 'phaser'
import { MainScene } from './scenes/mainScene'
import { StartScene } from './scenes/landingScene'
// import NinePatch2Plugin from 'phaser3-rex-plugins/plugins/ninepatch2-plugin.js'
import { ConnectScene } from './scenes/connectScene'
import ClaimScene from './scenes/claimScene'
// import { ButtonPlugin } from './lib/plugins/ui/Button'

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
  scene: [StartScene, ConnectScene, MainScene, ClaimScene]
})