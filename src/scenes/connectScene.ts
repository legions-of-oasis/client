import { geckos } from '@geckos.io/client'
import { Scene } from 'phaser'
import { scenes } from '../lib/keys'

export class ConnectScene extends Scene {
	sig?: string
	address?: string

	constructor() {
		super(scenes.CONNECT_SCENE)
	}

	init({ sig, address }: { sig: string, address: string }) {
		this.sig = sig
		this.address = address
	}

	create() {
        //set bg color
        this.cameras.main.setBackgroundColor('0x171717')

		const { width, height } = this.scale
		const text = this.add.text(width * 0.5, height * 0.5, 'logging in to server...').setOrigin(0.5, 0.5)

		const host = import.meta.env.VITE_HOST ? import.meta.env.VITE_HOST : "http://localhost"

		const channel = geckos({
			url: host,
			port: 443,
			authorization: `${this.address} ${this.sig}`,
		})
		
		channel.onConnect(error => {
			if (error) {
				console.error(error.message)
				text.setText(`error ${error.status}: ${error.statusText}. ${error.message}`)
			}

			channel.on('ready', (initialPos) => {
				text.setText('connected!')
				setTimeout(() => {
					this.scene.start(scenes.DUNGEON_SCENE, { channel, initialPos })
				}, 500)
			})
		})
	}
}