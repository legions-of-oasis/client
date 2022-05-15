import { ClientChannel, geckos } from '@geckos.io/client'
import { Scene } from 'phaser'
import { roomModes } from '../commons/roomModes'
import { Button } from '../lib/plugins/ui/Button'
import { images, scenes } from '../lib/utils/keys'

export class ConnectScene extends Scene {
	address!: string
	roomMode!: roomModes
	roomId!: string
	channel!: ClientChannel

	constructor() {
		super(scenes.CONNECT_SCENE)
	}

	init({ address, roomMode, roomId }: { address: string, roomMode: roomModes, roomId: string }) {
		this.address = address
		this.roomMode = roomMode
		this.roomId = roomId
	}

	create() {
		//set bg color
		this.cameras.main.setBackgroundColor('0x171717')

		//get width and height of screen
		const { width, height } = this.scale

		//add text
		const text = this.add.text(width * 0.5, height * 0.5, 'logging in to server...').setOrigin(0.5, 0.5)

		//add start button
		if (this.roomMode === roomModes.PRIVATE_CREATE || this.roomMode === roomModes.PUBLIC_CREATE || this.roomMode === roomModes.SINGLEPLAYER) {
			const button = new Button({
				scene: this,
				height: 54,
				key: images.BTN_GREY,
				text: 'START GAME',
				width: 250,
				x: width * 0.5,
				y: height * 0.58
			})
			button.onClick(() => {
				this.channel.emit('start')
			})
		} else {
			this.add.text(width * 0.5, height * 0.55, 'waiting for host to start...').setOrigin(0.5)
		}
		//server hostname
		const host = import.meta.env.VITE_HOST ? import.meta.env.VITE_HOST : "http://localhost:9208"

		//jwt token
		let token = document.cookie
			.split('; ')
			.find(row => row.startsWith('token='))
		if(!token) {
			console.error("no token cookie")
			return
		}
		token = token.split('=')[1]

		//make webrtc connection
		this.channel = geckos({
			url: host,
			port: null as any,
			authorization: `${this.address} ${token} ${this.roomMode} ${this.roomId}`,
		})

		//on connect
		this.channel.onConnect(error => {
			if (error) {
				if (error.status == 401 || error.status == 403) {
					this.scene.start(scenes.LANDING_SCENE)
					document.cookie = 'token=; Max-Age=0; path=/; domain=' + location.hostname
					return
				}
				console.error(error.message)
				text.setText(`error ${error.status}: ${error.statusText}. ${error.message}`)
			}

			this.channel.on('roomId', (roomId) => {
				text.setText("room ID: " + roomId)
			})

			this.channel.on('ready', (initialData) => {
				text.setText('connected!')
				console.log(initialData)
				setTimeout(() => {
					this.scene.start(scenes.DUNGEON_SCENE, { channel: this.channel, initialData })
				}, 500)
			})
		})

		// button.onClick(() => {
		// 	this.channel.emit('start')
		// })
	}
}