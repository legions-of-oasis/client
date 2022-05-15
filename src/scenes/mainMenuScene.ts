import { ethers } from 'ethers'
import Phaser from 'phaser'
import { roomModes } from '../commons/roomModes'
import { Button } from '../lib/plugins/ui/Button'
import { globals, images, scenes } from '../lib/utils/keys'
import BBCodeTextPlugin from 'phaser3-rex-plugins/plugins/bbcodetext-plugin.js'

export default class MainMenuScene extends Phaser.Scene {
    address!: string
    height!: number
    width!: number
    roomId?: string

    //main buttons
    mainContainer!: Phaser.GameObjects.Container
    playSinglePlayerButton!: Button
    playMultiPlayerButton!: Button

    //back to main menu button

    //multiplayer menu buttons
    multiPlayerContainer?: Phaser.GameObjects.Container
    createRoomButton!: Button
    joinRoomButton!: Button
    backToMainButton!: Button

    //join room components
    joinRoomContainer?: Phaser.GameObjects.Container
    roomIdInput!: BBCodeTextPlugin
    joinRoomWithRoomIdButton!: Button
    backToMultiplayerButton!: Button

    constructor() {
        super(scenes.MAINMENU_SCENE)
    }
    
	preload() {
		this.load.image(images.BTN_GREY, '/ui/btn-grey.png')
	}

    create() {
		//set bg color
		this.cameras.main.setBackgroundColor('0x171717')

		//get width and height of screen
		const { width, height } = this.scale
        this.width = width
        this.height = height

        //get address and add welcome text
        const signer: ethers.providers.JsonRpcSigner = this.registry.get(globals.SIGNER)
        if (signer) {
            signer.getAddress().then(address => {
                this.address = address
                this.add.text(width * 0.5, height - 50, `welcome, ${this.address}`)
                    .setOrigin(0.5, 0.5)
                    .setAlpha(0.5)
            })
        } else {
            this.address = 'anon'
            this.add.text(width * 0.5, height - 50, `welcome, ${this.address}`)
                .setOrigin(0.5,0.5)
                .setAlpha(0.5)
        }

        //set main menu
        this.mainContainer = this.add.container(width * 0.5, height * 0.5)

        this.playSinglePlayerButton = new Button({
            scene: this,
            height: 54,
            width: 500,
            x: 0,
            y: -30,
            key: images.BTN_GREY,
            text: 'Play Singleplayer'
        })
        this.playSinglePlayerButton.onClick(() => {
            this.playSinglePlayer()
        })

        this.playMultiPlayerButton = new Button({
            scene: this,
            height: 54,
            width: 500,
            x: 0,
            y: 30,
            key: images.BTN_GREY,
            text: 'Play Multiplayer'
        })
        this.playMultiPlayerButton.onClick(() => {
            this.playMultiPlayer()
        })

        this.mainContainer.add([
            this.playSinglePlayerButton,
            this.playMultiPlayerButton
        ])
    }

    playSinglePlayer() {
        this.scene.start(scenes.CONNECT_SCENE, { 
            address: this.address,
            roomMode: roomModes.SINGLEPLAYER,
            roomId: ''    
        })
    }

    playMultiPlayer() {
        this.mainContainer.setVisible(false)

        if (this.multiPlayerContainer) {
            this.multiPlayerContainer.setVisible(true)
            return
        }

        this.multiPlayerContainer = this.add.container(this.width * 0.5, this.height * 0.5)

        this.createRoomButton = new Button({
            scene: this,
            height: 54,
            width: 500,
            x: 0,
            y: -60,
            key: images.BTN_GREY,
            text: 'Create New Room'
        })
        this.createRoomButton.onClick(() => {
            this.scene.start(scenes.CONNECT_SCENE, { 
                address: this.address,
                roomMode: roomModes.PRIVATE_CREATE,
                roomId: ''
            })
        })

        this.joinRoomButton = new Button({
            scene: this,
            height: 54,
            width: 500,
            x: 0,
            y: 0,
            key: images.BTN_GREY,
            text: 'Join Existing Room'
        })
        this.joinRoomButton.onClick(() => {
            this.joinRoom()
        })

        this.backToMainButton = new Button({
            scene: this,
            height: 44,
            width: 200,
            x: 0,
            y: 80,
            key: images.BTN_GREY,
            text: 'Back'
        })
        this.backToMainButton.onClick(() => {
            this.multiPlayerContainer!.setVisible(false)
            this.mainContainer.setVisible(true)
        })

        this.multiPlayerContainer.add([
            this.createRoomButton,
            this.joinRoomButton,
            this.backToMainButton
        ])
    }

    joinRoom() {
        this.multiPlayerContainer!.setVisible(false)

        if (this.joinRoomContainer) {
            this.joinRoomContainer.setVisible(true)
            this.roomIdInput.setVisible(true)
            return
        }

        this.joinRoomContainer = this.add.container(this.width * 0.5, this.height * 0.5)

        this.roomIdInput = (this.add as any).rexBBCodeText(this.width * 0.5, (this.height * 0.5) - 80, 'room ID', {
            color: 'black',
            fontSize: '24px',
            fixedWidth: 200,
            fixedHeight: 50,
            backgroundColor: '#BBB',
            valign: 'center',
            halign: 'center',
        })
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown', () => {
                (this.plugins.get('rexTextEdit') as any).edit(this.roomIdInput, {
                    onTextChanged: (textObject, roomId) => {
                        textObject.text = roomId
                        this.roomId = roomId
                    },
                    maxLength: 5,
                    selectAll: true,
                    backgroundColor: '#BBB'
                })
            }, this)
        
        this.joinRoomWithRoomIdButton = new Button({
            scene: this,
            height: 54,
            width: 500,
            x: 0,
            y: 0,
            key: images.BTN_GREY,
            text: 'Join Room'
        })
        this.joinRoomWithRoomIdButton.onClick(() => {
            if (!this.roomId) {
                console.log('enter room ID')
                return
            }

            const roomId = this.roomId.replaceAll(' ', '').toUpperCase()

            if (roomId.length !== 5) {
                console.log('bad id length')
                return
            }

            this.scene.start(scenes.CONNECT_SCENE, {
                address: this.address,
                roomMode: roomModes.PRIVATE_JOIN,
                roomId
            })
        })

        this.backToMultiplayerButton = new Button({
            scene: this,
            height: 44,
            width: 400,
            x: 0,
            y: 80,
            key: images.BTN_GREY,
            text: 'Back To Multiplayer'
        })
        this.backToMultiplayerButton.onClick(() => {
            this.joinRoomContainer!.setVisible(false)
            this.multiPlayerContainer!.setVisible(true)
            this.roomIdInput.setVisible(false)
        })

        this.joinRoomContainer!.add([
            this.joinRoomWithRoomIdButton,
            this.backToMultiplayerButton
        ])
    }
}