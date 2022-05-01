import { ethers } from "ethers"
import { BTN_GREY, CONNECT_SCENE, LANDING_SCENE, SIGNER, UPHEAVAL } from "../lib/keys"
import connectWallet from "../lib/eth/connectWallet.js"
import signTypedAuth from "../lib/eth/signTypedAuth.js"

export class StartScene extends Phaser.Scene {
    button?: Phaser.GameObjects.RenderTexture
    text?: Phaser.GameObjects.BitmapText
    container?: Phaser.GameObjects.Container
    signer?: ethers.providers.JsonRpcSigner

    constructor() {
        super(LANDING_SCENE)
    }

    preload() {
        this.load.bitmapFont(UPHEAVAL, '/fonts/upheaval.png', '/fonts/upheaval.xml')
        this.load.image(BTN_GREY, '/ui/btn-grey.png')
    }

    create() {
        //set bg color
        this.cameras.main.setBackgroundColor('0x171717')

        //get screen height and width
        const { width, height } = this.scale

        //add components
        this.button = this.add.nineslice(0, 0, 100, 18, BTN_GREY, [3, 3, 5, 3]).setOrigin(0.5, 0.5).setScale(3, 3).setInteractive()
        this.text = this.add.bitmapText(0, 0, UPHEAVAL, 'connect wallet', 32).setOrigin(0.5, 0.5)
        this.container = this.add.container(width * 0.5, height * 0.5, [this.button, this.text])

        //add event listeners
        this.scale.on('resize', () => this.resize())
        this.button.on('pointerover', () => {
            this.button?.setTint(0x44fff9)
        })
        this.button.on('pointerout', () => {
            this.button?.clearTint()
        })
        this.button.on('pointerdown', () => {
            this.button?.setTint(0x2aa19d)
        })
        this.button.on('pointerup', async () => {
            this.button?.clearTint()

            //login
            if (this.signer) {
                signTypedAuth(this.signer)
                    .then(res => {
                        this.scene.start(CONNECT_SCENE, { sig: res.sig, address: res.address })
                    })
                    .catch(e => console.error(e))
                
                return
            }

            try {
                this.signer = await connectWallet(
                    {
                        onAccountsChanged: () => {},
                        onChainChanged: () => {},
                        onConnect: () => {},
                        onDisconnect: () => {}
                    }
                )

                if (this.signer) {
                    this.registry.set(SIGNER, this.signer)
                    this.text?.setText('login')
                } else {
                    throw new Error('no provider')
                }
                return
            } catch (e) {
                console.error(e)
            }
        })
    }

    resize() {
        //recenter on resize
        const { width, height } = this.scale
        this.container?.setPosition(width * 0.5, height * 0.5)
    }
}