import { ethers } from "ethers"
import { images, scenes, globals, fonts, events } from "../lib/utils/keys"
import connectWallet from "../lib/eth/connectWallet.js"
import signTypedAuth from "../lib/eth/signTypedAuth.js"
import eventsCenter from "../lib/utils/eventsCenter"
import { Button } from "../lib/plugins/ui/Button"

export class StartScene extends Phaser.Scene {
    button?: Button
    signer?: ethers.providers.JsonRpcSigner
    bg?: Phaser.GameObjects.Image

    constructor() {
        super(scenes.LANDING_SCENE)
    }

    preload() {
        this.load.bitmapFont(fonts.UPHEAVAL, '/fonts/upheaval.png', '/fonts/upheaval.xml')
        this.load.image(images.BTN_LIGHTBROWN, '/ui/btn-lightbrown.png')
        this.load.image(images.BTN_LIGHTBROWN_PRESSED, '/ui/btn-lightbrown-pressed.png')
        this.load.image(images.BTN_GREY_PRESSED, '/ui/btn-grey-pressed.png')
        this.load.image(images.SPLASH_SCREEN, '/ui/splash-screen.png')
    }

    create() {
        //set bg color
        this.cameras.main.setBackgroundColor('0x171717')

        //get screen height and width
        const { width, height } = this.scale

        //add components
        this.bg = this.add.image(width * 0.5, height * 0.5, images.SPLASH_SCREEN)
        this.fitBg(width, height)

        this.button = new Button({
            scene: this,
            text: 'connect wallet',
            x: width * 0.33,
            y: height * 0.6,
            width: 300,
            height: 54,
            key: images.BTN_LIGHTBROWN
        })
        this.button.onClick(() => this.handleClick())

        //resize listener
        this.scale.on('resize', () => this.resize())
        
        //add wallet listeners
        eventsCenter.on(events.ACCOUNTS_CHANGED, () => {this.reset()})
        eventsCenter.on(events.CHAIN_CHANGED, () => {this.reset()})
    }

    resize() {
        //recenter on resize
        const { width, height } = this.scale
        this.button!.setPosition(width * 0.33, height * 0.6)
        this.bg!.setPosition(width * 0.5, height * 0.5)
        this.fitBg(width, height)
    }

    fitBg(width: number, height: number) {
        const widthRatio = width / this.bg!.width
        const heightRatio = height / this.bg!.height
        const larger = widthRatio > heightRatio ? widthRatio : heightRatio
        this.bg!.setScale(larger)
    }

    async handleClick() {
        //authenticate
        if (this.signer) {

            //jwt token stored
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('token='))
            if (token) {
                this.scene.start(scenes.MAINMENU_SCENE)
                return
            }
            
            //fresh sign in
            try {
                await signTypedAuth(this.signer)
                this.scene.start(scenes.MAINMENU_SCENE)
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
            this.button!.setText('login')
            return
        } catch (e: any) {
            if (e.message !== 'wrong chain') {
                console.error(e)
                return
            }
            this.button!.setText('switch network')
            this.button!.setEnable(false)
        }
    }

    reset() {
        //reset scene
        this.signer = undefined
        this.registry.remove(globals.SIGNER)
        this.scene.restart()
    }
}