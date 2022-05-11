import { ethers } from 'ethers'
import Phaser from 'phaser'
import { ClaimVerifier } from '../lib/eth/types'
import { getContract } from '../lib/eth/contracts'
import { images, scenes, globals } from '../lib/utils/keys'
import { addresses } from '../commons/contracts.js'
import { Button } from '../lib/plugins/ui/Button'

export default class ClaimScene extends Phaser.Scene {
    button?: Button
    signer?: ethers.providers.JsonRpcSigner
    sig?: string = undefined
    contract?: string
    claimed = false
    balance?: ethers.BigNumber

    constructor() {
        super(scenes.CLAIM_SCENE)
    }

    init({ contract, balance }: { contract: string, balance: ethers.BigNumber }) {
        this.contract = contract
        this.balance = balance
    }

    preload() {
        this.signer = this.registry.get(globals.SIGNER)
    }

    create() {
        //set bg
        this.cameras.main.setBackgroundColor('rgba(20, 20, 20, 0.5)')

        //get screen height and width
        const { width, height } = this.scale

        //check if already claimed
        let text = 'waiting for server...'
        if (this.balance?.gt(0)) {
            text = 'already claimed!'
            this.claimed = true
        }

        //add components
        this.button = new Button({
            scene: this,
            x: width * 0.5,
            y: height * 0.5,
            key: images.BTN_LIGHTBROWN,
            width: 300,
            height: 54,
            text
        })
        this.button.onClick(() => {
            if (this.claimed) return
            this.claim()
        })

        //resize listener
        this.scale.on('resize', () => this.resize())
    }

    update() {
        //check if server already sent signature
        if (this.sig) return
        const sig = this.data.get('sig')
        if (!sig) return
        this.sig = sig
        this.button!.setText('claim nft')
    }

    resize() {
        //recenter on resize
        const { width, height } = this.scale
        this.button!.setPosition(width * 0.5, height * 0.5)
    }

    async claim() {
        if (!this.sig) return
        
        const claimVerifier = getContract(addresses.CLAIM_VERIFIER, this.signer!) as ClaimVerifier
        const address = await this.signer!.getAddress()
        const request = addresses.DUNGEON
        const deadline = ethers.constants.MaxUint256
        const receiver = address
        const { v, r, s } = ethers.utils.splitSignature(this.sig)
        
        try {
            const tx = await claimVerifier.claim(
                request,
                {
                    v,
                    r,
                    s,
                    request,
                    deadline,
                    receiver
                }
            )
            await tx.wait()
            this.claimed = true
            this.button!.setText('claimed!')
        } catch (error: any) {
            console.error(error)
        }
    }
}
