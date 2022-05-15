import './style.css'
import Phaser from 'phaser'
import { DungeonScene } from './scenes/dungeonScene'
import { StartScene } from './scenes/landingScene'
import { ConnectScene } from './scenes/connectScene'
import ClaimScene from './scenes/claimScene'
import GameUIScene from './scenes/gameUIScene'
import TextEditPlugin from 'phaser3-rex-plugins/plugins/textedit-plugin.js'
import BBCodeTextPlugin from 'phaser3-rex-plugins/plugins/bbcodetext-plugin.js'
import MainMenuScene from './scenes/mainMenuScene'

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  dom: {
    createContainer: true
  },
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
  scene: [StartScene, MainMenuScene, ConnectScene, GameUIScene, DungeonScene, ClaimScene],
  plugins: {
    global: [
      { key: 'rexTextEdit', plugin: TextEditPlugin, start: true },
      { key: 'rexBBCodeText', plugin: BBCodeTextPlugin, start: true }
    ]
  }
})