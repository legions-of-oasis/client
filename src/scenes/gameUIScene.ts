import Phaser from "phaser";
import { images, scenes } from "../lib/utils/keys";
import NinePatch from "phaser3-rex-plugins/plugins/ninepatch2";
import Player from "../lib/plugins/entities/characters/Player";

export default class GameUIScene extends Phaser.Scene {
    maxHp!: number
    healthBar!: NinePatch
    player!: Player
    currentHp!: number

    constructor() {
        super(scenes.GAMEUI_SCENE)
    }

    init({ maxHp, player }: {maxHp: number, player: Player}) {
        this.maxHp = maxHp
        this.player = player
    }

    create() {
        const container = new NinePatch(this, {
            x: 50,
            y: 50,
            width: this.maxHp + 3,
            height: 7,
            key: images.HEALTH_CONTAINER,
            columns: [1, undefined, 4],
            rows: [2, undefined, 2]
        })
        container.setScale(3).setOrigin(0, 0)
        this.add.existing(container)

        this.healthBar = new NinePatch(this, {
            x: 53,
            y: 56,
            width: this.maxHp,
            height: 3,
            key: images.HEALTH_BAR,
            columns: [0, undefined, 2],
            rows: [0, undefined, 1]
        })
        this.healthBar.setScale(3).setOrigin(0,0)
        this.add.existing(this.healthBar)
        
        this.scene.bringToTop()

        this.player.data.events.on('changedata-hp', (_object, _key, value) => {
            this.updateHp(value)
        })
    }

    updateHp(hp: number) {
        this.currentHp = hp
        this.healthBar.resize(this.currentHp, 3)
    }
}