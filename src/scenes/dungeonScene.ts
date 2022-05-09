import Phaser from "phaser";
import { scenes, anims, globals, tiles, sprites, images } from "../lib/utils/keys";
import { ClientChannel } from "@geckos.io/client";
import { SnapshotInterpolation, Vault } from "@geckos.io/snapshot-interpolation";
import { getContract } from "../lib/eth/contracts";
import { ethers } from "ethers";
import { ClaimManagerERC721 } from "../lib/eth/types";
import { contracts } from "../../commons/contracts.mjs"
import Player from "../lib/plugins/entities/characters/Player";
import Reticle from "../lib/plugins/ui/Reticle";
import Sword from "../lib/plugins/entities/weapons/Sword";
import Chort from "../lib/plugins/entities/characters/Chort";

export class DungeonScene extends Phaser.Scene {
    enemies!: Phaser.Physics.Arcade.Sprite[]    
    player!: Player
    coin!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
    cursors!: Phaser.Types.Input.Keyboard.CursorKeys
    wasd!: any
    lastDirectionIsLeft = false
    channel!: ClientChannel
    SI!: SnapshotInterpolation
    playerVault!: Vault
    initialPos!: Array<number>
    tick = 0
    balance!: ethers.BigNumber
    signer!: ethers.providers.JsonRpcSigner
    reticle!: Reticle

    constructor() {
        super(scenes.DUNGEON_SCENE)
    }

    init({ channel, initialPos }: { channel: ClientChannel, initialPos: Array<number> }) {
        this.channel = channel
        this.initialPos = initialPos
    }

    preload() {
        //assets
        this.load.spritesheet(sprites.KNIGHT, '/spritesheets/knight.png', { frameWidth: 15, frameHeight: 22 })
        this.load.spritesheet(sprites.SWORD, '/spritesheets/sword.png', { frameWidth: 16, frameHeight: 22 })
        this.load.spritesheet(sprites.CHORT, '/spritesheets/chort.png', { frameWidth: 16, frameHeight: 24 })
        this.load.tilemapTiledJSON(tiles.DUNGEON_MAP, '/tiles/dungeon.json')
        this.load.image(tiles.DUNGEON_SET, '/tiles/dungeon.png')
        this.load.image(sprites.RETICLE, '/spritesheets/reticle.png')
        this.load.image(images.HEALTH_CONTAINER, '/ui/health-container.png')
        this.load.image(images.HEALTH_BAR, '/ui/health-bar.png')
        
        //inputs
        this.cursors = this.input.keyboard.createCursorKeys()
        this.wasd = this.input.keyboard.addKeys('W,S,A,D')

        //signer
        this.signer = this.registry.get(globals.SIGNER)
    }

    create() {
        //set bg color
        this.cameras.main.setBackgroundColor('0x171717')

        //anims
        this.createAnims()

        //snapshot interpolation
        this.SI = new SnapshotInterpolation(60)
        this.playerVault = new Vault()

        //tilemap and tileset
        const map = this.make.tilemap({ key: tiles.DUNGEON_MAP })
        const tileset = map.addTilesetImage('dungeon-tileset', tiles.DUNGEON_SET)

        //tilemap layers
        const floor = map.createLayer('floor', tileset, 0, 0)
        const walls = map.createLayer('walls', tileset, 0, 0)
        const overhead = map.createLayer('overhead', tileset, 0, 0)

        //init enemies
        this.enemies = []

        //player sprite
        this.player = new Player({
            scene: this,
            x: this.initialPos![0],
            y: this.initialPos![1],
            key: sprites.KNIGHT,
            speed: 80,
            id: this.channel!.id!.toString(),
            hp: 100
        })

        //add chort
        const chort = new Chort({
            scene: this,
            x: 240,
            y: 100,
            key: sprites.CHORT,
            speed: 20,
            id: 'chort',
            hp: 50
        }, this.player)
        this.enemies.push(chort)

        //start game ui
        this.scene.run(scenes.GAMEUI_SCENE, {maxHp: this.player.maxHp, player: this.player})

        //add mouseclick event listener
        this.input.on('pointerdown', () => {
            if (!this.input.mousePointer.locked || !this.player.equippedWeapon) return

            this.player.equippedWeapon.attack(this.enemies)
        })

        //camera
        const camera = this.cameras.main
        camera.zoom = 3
        camera.centerOn(this.player.x, this.player.y)

        //reticle
        this.reticle = new Reticle({
            scene: this,
            x: this.player.x,
            y: this.player.y,
            key: sprites.RETICLE,
            player: this.player,
            camera: this.cameras.main,
            maxRadius: 150
        })

        //set equipped weapon
        this.player.setEquippedWeapon(
            new Sword({
                scene: this,
                key: sprites.SWORD,
                player: this.player,
                reticle: this.reticle
            })
        )

        //z-index
        floor.setDepth(0)
        walls.setDepth(10)
        this.player.setDepth(20)
        this.player.equippedWeapon?.setDepth(21)
        this.enemies.forEach(e => e.setDepth(22))
        overhead.setDepth(30)
        this.reticle.setDepth(100)

        //collision
        walls.setCollisionByProperty({ collides: true })
        this.physics.add.collider(this.player, walls)
        this.physics.add.collider(this.enemies, walls)

        //server update handler
        this.channel.on('update', (data: any) => {
            this.SI.snapshot.add(data)
        })

        //claim handler
        this.channel.on('claim', sig => {
            this.scene.get(scenes.CLAIM_SCENE).data.set('sig', sig)
            console.log("packet signature: ", sig)
        })

        // pause physics when disconnected
        this.channel.onDisconnect(() => {
            this.physics.pause()
        })

        //get nft balance
        this.getBalance()
    }

    update() {
        //emit input to server
        const movement = [
            this.cursors.up.isDown || this.wasd.W.isDown,
            this.cursors.down.isDown || this.wasd.S.isDown,
            this.cursors.left.isDown || this.wasd.A.isDown,
            this.cursors.right.isDown || this.wasd.D.isDown
        ]
        this.channel.emit('move', movement)
        
        //update movements
        this.player!.update(movement)

        //update reticle
        this.reticle!.update()

        //update updatables
        this.enemies.forEach(o => o.update())

        //client prediction
        // this.clientPrediction()

        //server reconciliation
        // this.serverReconciliation(movement)
    }

    clientPrediction() {
        //add player vault snapshot
        this.playerVault.add(
            this.SI!.snapshot.create(
                [{
                    id: this.channel!.id!,
                    x: this.player!.x,
                    y: this.player!.y
                }]
            )
        )
    }

    serverReconciliation(movement: Array<boolean>) {
        const [up, down, left, right] = movement

        if (this.player) {
            const serverSnapshot = this.SI!.vault.get()
            if (!serverSnapshot) return
            const playerSnapshot = this.playerVault.get(serverSnapshot.time, true)

            if (serverSnapshot && playerSnapshot) {
                const serverPos = (serverSnapshot.state as any)[0]
                const playerPos = (playerSnapshot.state as any)[0]

                const offsetX = playerPos.x - serverPos.x
                const offsetY = playerPos.y - serverPos.y

                const isMoving = up || down || left || right

                const correction = isMoving ? 60 : 180

                this.player.setX(this.player.x - (offsetX / correction))
                this.player.setY(this.player.y - (offsetY / correction))
            }
        }
    }

    // collectCoin() {
    //     setTimeout(() => {
    //         this.channel.close()
    //     }, 30000)
    //     this.coin.disableBody(true, true)
    //     this.scene.launch(scenes.CLAIM_SCENE, { contract: addresses.DUNGEON, balance: this.balance })
    //     this.scene.sendToBack(this)
    // }

    async getBalance() {
        //get nft balance
        const manager = getContract(contracts.DUNGEON, this.signer!) as ClaimManagerERC721;
        const balance = await manager.balanceOf(await this.signer!.getAddress())
        this.balance = balance
        console.log(balance)
    }
    
    createAnims() {
        //anims
        this.anims.create({
            key: sprites.KNIGHT + '-' + anims.IDLE,
            frameRate: 10,
            frames: this.anims.generateFrameNumbers(sprites.KNIGHT, {
                start: 0,
                end: 3
            })
        })
        this.anims.create({
            key: sprites.KNIGHT + '-' + anims.MOVE,
            frameRate: 10,
            frames: this.anims.generateFrameNumbers(sprites.KNIGHT, {
                start: 4,
                end: 7
            })
        })
        this.anims.create({
            key: sprites.CHORT + '-' + anims.MOVE,
            frameRate: 10,
            frames: this.anims.generateFrameNumbers(sprites.CHORT, {
                start: 0,
                end: 3
            })
        })
        this.anims.create({
            key: sprites.CHORT + '-' + anims.IDLE,
            frameRate: 10,
            frames: this.anims.generateFrameNumbers(sprites.CHORT, {
                start: 4,
                end: 7
            })
        })
        this.anims.create({
            key: anims.COIN_SPIN,
            frameRate: 10,
            frames: this.anims.generateFrameNumbers(sprites.COIN, {
                start: 0,
                end: 3,
            }),
            repeat: -1
        })
        this.anims.create({
            key: sprites.SWORD + '-' + anims.ATTACK,
            frameRate: 15,
            frames: this.anims.generateFrameNumbers(sprites.SWORD, {
                start: 0,
                end: 4,
            })
        })
    }
}