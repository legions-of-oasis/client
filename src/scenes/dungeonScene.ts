import Phaser from "phaser";
import { scenes, anims, globals, tiles, sprites, images } from "../lib/utils/keys";
import { ClientChannel } from "@geckos.io/client";
import { SnapshotInterpolation, Vault } from "@geckos.io/snapshot-interpolation";
import { getContract } from "../lib/eth/contracts";
import { ethers } from "ethers";
import Player from "../lib/plugins/entities/characters/Player";
import Reticle from "../lib/plugins/ui/Reticle";
import Sword from "../lib/plugins/entities/weapons/Sword";
import Chort from "../lib/plugins/entities/characters/Chort";
import { addresses } from "../commons/contracts";
import { Entity } from "@geckos.io/snapshot-interpolation/lib/types";
import BaseEntity from "../lib/plugins/entities/characters/BaseEntity";
import { states } from "../commons/states";

export class DungeonScene extends Phaser.Scene {
    enemies!: Map<string, BaseEntity>
    players!: Map<string, Player>
    player!: Player
    coin!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
    cursors!: Phaser.Types.Input.Keyboard.CursorKeys
    wasd!: any
    lastDirectionIsLeft = false
    channel!: ClientChannel
    SI!: SnapshotInterpolation
    playerVault!: Vault
    initialData!: any
    tick = 0
    balance!: ethers.BigNumber
    signer!: ethers.providers.JsonRpcSigner
    reticle!: Reticle
    address!: string

    constructor() {
        super(scenes.DUNGEON_SCENE)
    }

    init({ channel, initialData }: { channel: ClientChannel, initialData: any }) {
        this.channel = channel
        this.initialData = initialData
        this.address = this.channel.userData['address']
    }

    preload() {
        //assets
        this.load.spritesheet(sprites.KNIGHT, '/spritesheets/knight.png', { frameWidth: 15, frameHeight: 22 })
        this.load.spritesheet(sprites.SWORD, '/spritesheets/sword.png', { frameWidth: 16, frameHeight: 22 })
        this.load.spritesheet(sprites.CHORT, '/spritesheets/chort.png', { frameWidth: 16, frameHeight: 24 })
        this.load.tilemapTiledJSON(tiles.DUNGEON_MAP, '/tiles/dungeon-tilemap.json')
        this.load.image(tiles.DUNGEON_SET, '/tiles/dungeon-tileset.png')
        this.load.image(sprites.RETICLE, '/spritesheets/reticle.png')
        this.load.image(images.HEALTH_CONTAINER, '/ui/health-container.png')
        this.load.image(images.HEALTH_BAR, '/ui/health-bar.png')

        //inputs
        this.cursors = this.input.keyboard.createCursorKeys()
        this.wasd = this.input.keyboard.addKeys('W,S,A,D,SHIFT')

        //signer
        this.signer = this.registry.get(globals.SIGNER)
    }

    create() {
        //set bg color
        this.cameras.main.setBackgroundColor('0x171717')

        //anims
        this.createAnims()

        //snapshot interpolation
        this.SI = new SnapshotInterpolation(30)
        this.playerVault = new Vault()

        //tilemap and tileset
        const map = this.make.tilemap({ key: tiles.DUNGEON_MAP })
        const tileset = map.addTilesetImage('dungeon-tileset', tiles.DUNGEON_SET)

        //tilemap layers
        const floor = map.createLayer('floor', tileset, 0, 0)
        const walls = map.createLayer('walls', tileset, 0, 0)
        const overhead = map.createLayer('overhead', tileset, 0, 0)

        this.players = new Map()

        //players sprite
        this.initialData.players.forEach(player => {
            const player_ = new Player({
                scene: this,
                x: player.x,
                y: player.y,
                key: sprites.KNIGHT,
                speed: 80,
                id: player.id,
                hp: 100
            })
            player_.equippedWeapon = new Sword({
                scene: this,
                key: sprites.SWORD,
                player: player_,
            })
            this.players.set(player.id, player_)
        })

        this.player = this.players.get(this.address)!

        //init enemies
        this.enemies = new Map()

        //add chort
        for (let i = 0; i < this.initialData.enemies.length; i++) {
            const id = this.initialData.enemies[i].id
            const chort = new Chort({
                scene: this,
                x: this.initialData.enemies[i].x,
                y: this.initialData.enemies[i].y,
                key: sprites.CHORT,
                speed: 20,
                id,
                hp: 50
            }, this.player)
            this.enemies.set(id, chort)
        }

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

        //start game ui
        this.scene.run(scenes.GAMEUI_SCENE, { maxHp: this.player.maxHp, player: this.player })

        const enemies = Array.from(this.enemies.values())

        //add mouseclick event listener
        this.input.on('pointerdown', () => {
            if (!this.input.mousePointer.locked) return

            this.player.attack(this.channel, this.SI.serverTime)
        })

        //z-index
        floor.setDepth(0)
        walls.setDepth(10)
        this.player.setDepth(20)
        this.enemies.forEach(e => e.setDepth(21))
        this.player.equippedWeapon?.setDepth(22)
        overhead.setDepth(30)
        this.reticle.setDepth(100)

        //collision
        walls.setCollisionByProperty({ collide: true })
        this.physics.add.collider(this.player, walls)
        this.physics.add.collider(enemies, walls)
        this.physics.add.collider(enemies, enemies)

        //server update handler
        this.channel.on('update', (data: any) => {
            this.SI.snapshot.add(data)
        })

        //state update handler
        this.channel.on('stateUpdate', ({ id, state }: { id: string, state: states }) => {
            const entity = this.players.get(id) ?? this.enemies.get(id)

            if (!entity) {
                console.log('stateUpdate: entity ', id, ' not found')
                return
            }

            entity.setState(state)
        })

        this.channel.on('hpUpdatePlayer', ({ id, hp }: { id: string, hp: number }) => {
            const player = this.players.get(id)

            if (!player) {
                console.log('hpUpdatePlayer: player ', id, ' not found')
                return
            }

            player.setData('hp', hp)
        })

        this.channel.on('hpUpdateEnemy', ({ id, hp }: { id: string, hp: number }) => {
            const enemy = this.enemies.get(id)

            if (!enemy) {
                console.log('hpUpdateEnemy: enemy ', id, ' not found')
                return
            }

            enemy.setData('hp', hp)
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

        //add keyboard listeners
        this.input.keyboard.on('keydown-SHIFT', () => {
            this.channel.emit('dash')
            this.player.dash()
        })

        //get nft balance
        // this.getBalance()
    }

    update() {
        //emit input to server
        const movement = [
            this.cursors.up.isDown || this.wasd.W.isDown,
            this.cursors.down.isDown || this.wasd.S.isDown,
            this.cursors.left.isDown || this.wasd.A.isDown,
            this.cursors.right.isDown || this.wasd.D.isDown
        ]
        // const aimAngle = Phaser.Math.RadToDeg(Phaser.Math.Angle.Between(this.player.x, this.player.y, this.reticle.x, this.reticle.y))
        if (this.input.mousePointer.locked) this.channel.emit('input', [...movement, this.player.aimAngle])

        //update movements
        this.players.forEach(p => {
            if (p.name === this.player.name){
                p.update(movement)
                return
            }
            p.update()
        })

        //update reticle
        this.reticle.update()

        //update enemies
        this.enemies.forEach(o => o.update())

        //snapshot interpolation
        this.snapshotInterpolation()

        //client prediction
        this.clientPrediction()

        //server reconciliation
        this.serverReconciliation(movement)
    }

    snapshotInterpolation() {
        const playerPositionSI = this.SI.calcInterpolation('x y angle(deg)', 'players')

        if (playerPositionSI) {
            const { state } = playerPositionSI

            state.forEach(p => {
                const { id, x, y, angle } = p
                if (id === this.player.name) return

                const player = this.players.get(id)

                if (player) {
                    player.lastDirectionIsLeft = x < player.x
                    player.setX(x)
                    player.setY(y)
                    player.aimAngle = angle
                } else {
                    const newPlayer = new Player({
                        hp: 100,
                        id,
                        key: sprites.KNIGHT,
                        scene: this,
                        speed: 80,
                        x,
                        y
                    })
                    newPlayer.aimAngle = angle
                    this.players.set(id, newPlayer)
                }
            })
        }

        const enemyPosition = this.SI.calcInterpolation('x y', 'enemies')

        if (enemyPosition) {
            const { state } = enemyPosition

            state.forEach(e => {
                const { id, x, y } = e

                const enemy = this.enemies.get(id)

                if (enemy) {
                    enemy.lastDirectionIsLeft = x < enemy.x
                    enemy.setX(x)
                    enemy.setY(y)
                } else {
                    const newEnemy = new Chort({
                        hp: 50,
                        id,
                        key: sprites.CHORT,
                        scene: this,
                        speed: 20,
                        x,
                        y,
                    }, this.player)
                    this.enemies.set(id, newEnemy)
                }
            })
        }
    }

    clientPrediction() {
        //add player vault snapshot
        const snapshot = this.SI.snapshot.create(
            [{
                id: this.channel.userData.address,
                x: this.player.x,
                y: this.player.y
            }]
        )
        this.playerVault.add(snapshot)
    }

    serverReconciliation(movement: Array<boolean>) {
        this.tick++
        const [up, down, left, right] = movement

        const serverSnapshot = this.SI.vault.get()
        if (!serverSnapshot) return

        const playerSnapshot = this.playerVault.get(serverSnapshot.time, true)
        if (!playerSnapshot) return

        const serverPos = (serverSnapshot.state.players as {id, x, y}[]).find((p) => p.id === this.player.name)
        if (!serverPos) return


        const playerPos = (playerSnapshot.state as Entity[])[0] as any

        const offsetX = playerPos.x - serverPos.x
        const offsetY = playerPos.y - serverPos.y

        const isMoving = up || down || left || right

        const correction = isMoving ? 60 : 180

        this.player.setX(this.player.x - (offsetX / correction))
        this.player.setY(this.player.y - (offsetY / correction))
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
        const manager = getContract(addresses.DUNGEON, this.signer!);
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