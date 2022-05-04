import { ethers } from "ethers"
import { images, scenes, globals, fonts, events } from "../lib/utils/keys"
import connectWallet from "../lib/eth/connectWallet.js"
import signTypedAuth from "../lib/eth/signTypedAuth.js"
import eventsCenter from "../lib/utils/eventsCenter"
import { Button } from "../lib/plugins/ui/Button"

export class StartScene extends Phaser.Scene {
    button?: Button
    text?: Phaser.GameObjects.BitmapText
    container?: Phaser.GameObjects.Container
    signer?: ethers.providers.JsonRpcSigner
    chainId = 31337

    constructor() {
        super(scenes.LANDING_SCENE)
    }

    preload() {
        this.load.bitmapFont(fonts.UPHEAVAL, '/fonts/upheaval.png', '/fonts/upheaval.xml')
        this.load.image(images.BTN_GREY, '/ui/btn-grey.png')
    }

    create() {
        //set bg color
        this.cameras.main.setBackgroundColor('0x171717')

        //get screen height and width
        const { width, height } = this.scale

        //add components
        // this.button = this.add.nineslice(0, 0, 100, 18, images.BTN_GREY, [3, 3, 5, 3]).setOrigin(0.5, 0.5).setScale(3, 3).setInteractive()
        // this.text = this.add.bitmapText(0, 0, fonts.UPHEAVAL, 'connect wallet', 32).setOrigin(0.5, 0.5)
        // this.container = this.add.container(width * 0.5, height * 0.5, [this.button, this.text])

        this.button = new Button({
            scene: this,
            text: 'connect wallet',
            x: width * 0.5,
            y: height * 0.5,
            width: 300,
            height: 54,
            key: images.BTN_GREY
        })
        this.button.onClick(() => this.handleClick())

        //add event listeners
        // this.scale.on('resize', () => this.resize())
        // this.button.on('pointerover', () => {
        //     this.button?.setTint(0x44fff9)
        // })
        // this.button.on('pointerout', () => {
        //     this.button?.clearTint()
        // })
        // this.button.on('pointerdown', () => {
        //     this.button?.setTint(0x2aa19d)
        // })
        // this.button.on('pointerup', async () => {
        //     this.button?.clearTint()

        //     this.handleClick()
        // })
        eventsCenter.on(events.ACCOUNTS_CHANGED, () => {this.reset()})
    }

    resize() {
        //recenter on resize
        const { width, height } = this.scale
        this.container?.setPosition(width * 0.5, height * 0.5)
    }

    async handleClick() {
        //authenticate
        if (this.signer) {
            try {
                const { sig, address } = await signTypedAuth(this.signer)
                this.scene.start(scenes.CONNECT_SCENE, { sig, address })
            } catch (e) {
                console.error(e)
            }
            return
        }

        //connect wallet
        try {
            const signer = await connectWallet()

            this.signer = signer
            this.registry.set(globals.SIGNER, this.signer)
            this.button!.text.setText('login')
            return
        } catch (e: any) {
            if (e.message !== 'wrong chain') {
                console.error(e)
                return
            }
            this.button!.text.setText('wrong chain')
        }
    }

    reset() {
        this.signer = undefined
        this.registry.remove(globals.SIGNER)
        this.scene.restart()
    }
}