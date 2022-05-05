import Phaser from "phaser";
import { scenes, anims, globals, tiles, sprites } from "../lib/utils/keys";
import { ClientChannel } from "@geckos.io/client";
import { SnapshotInterpolation, Vault } from "@geckos.io/snapshot-interpolation";
import { getContract } from "../lib/eth/contracts";
import { ethers } from "ethers";
import { ClaimManagerERC721 } from "../lib/eth/types";
import { addresses, contracts } from "../../commons/contracts.mjs"
import Player from "../lib/plugins/entities/characters/Player";

export class DungeonScene extends Phaser.Scene {
    player?: Player
    coin?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
    cursors?: Phaser.Types.Input.Keyboard.CursorKeys
    wasd?: any
    lastDirectionIsLeft = false
    channel?: ClientChannel
    SI?: SnapshotInterpolation
    playerVault?: Vault
    initialPos?: Array<number>
    tick = 0
    balance?: ethers.BigNumber
    signer?: ethers.providers.JsonRpcSigner

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
        this.load.image(tiles.DUNGEON_SET, '/tiles/dungeon.png')
        this.load.tilemapTiledJSON(tiles.DUNGEON_MAP, '/tiles/dungeon.json')
        this.load.spritesheet(sprites.COIN, '/spritesheets/coin.png', { frameWidth: 6, frameHeight: 7 })
        
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

        //star sprite
        this.coin = this.physics.add.sprite(240, 70, sprites.COIN)

        //player sprite
        // this.player = this.physics.add.sprite(this.initialPos![0], this.initialPos![1], sprites.KNIGHT)
        this.player = new Player({
            scene: this,
            x: this.initialPos![0],
            y: this.initialPos![1],
            key: sprites.KNIGHT,
            speed: 80,
            id: this.channel!.id!.toString()
        })

        //camera
        const camera = this.cameras.main
        camera.zoom = 3
        camera.startFollow(this.player)

        //z-index
        floor.setDepth(0)
        walls.setDepth(10)
        this.player.setDepth(20)
        overhead.setDepth(30)

        //collision
        walls.setCollisionByProperty({ collides: true })
        this.physics.add.collider(this.player, walls)

        //overlap
        this.physics.add.overlap(this.player, this.coin, () => this.collectCoin())

        //start anims
        this.coin.anims.play(anims.COIN_SPIN, true)

        //server update handler
        this.channel?.on('update', (data: any) => {
            this.SI?.snapshot.add(data)
        })

        //claim handler
        this.channel?.on('claim', sig => {
            this.scene.get(scenes.CLAIM_SCENE).data.set('sig', sig)
            console.log("packet signature: ", sig)
        })

        // pause physics when disconnected
        this.channel?.onDisconnect(() => {
            this.physics.pause()
        })

        this.getBalance()
    }

    update() {
        this.tick++

        //emit input to server
        const movement = [
            this.cursors?.up.isDown || this.wasd.W.isDown,
            this.cursors?.down.isDown || this.wasd.S.isDown,
            this.cursors?.left.isDown || this.wasd.A.isDown,
            this.cursors?.right.isDown || this.wasd.D.isDown
        ]
        this.channel?.emit('move', movement)
        
        //update movements
        this.player!.update(movement)

        //client prediction
        this.clientPrediction()

        //server reconciliation
        this.serverReconciliation(movement)
    }

    clientPrediction() {
        //add player vault snapshot
        this.playerVault?.add(
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
            const playerSnapshot = this.playerVault?.get(serverSnapshot.time, true)

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

    collectCoin() {
        setTimeout(() => {
            this.channel?.close()
        }, 30000)
        this.coin?.disableBody(true, true)
        this.scene.launch(scenes.CLAIM_SCENE, { contract: addresses.DUNGEON, balance: this.balance })
        this.scene.sendToBack(this)
    }

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
            key: anims.COIN_SPIN,
            frameRate: 10,
            frames: this.anims.generateFrameNumbers(sprites.COIN, {
                start: 0,
                end: 3,
            }),
            repeat: -1
        })
    }
}