import { geckos } from '@geckos.io/client'
import { Scene } from 'phaser'
import { roomModes } from '../commons/roomModes'
import { scenes } from '../lib/utils/keys'

export class ConnectScene extends Scene {
	address!: string
	roomMode!: roomModes
	roomId!: string

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

		const { width, height } = this.scale
		const text = this.add.text(width * 0.5, height * 0.5, 'logging in to server...').setOrigin(0.5, 0.5)

		const host = import.meta.env.VITE_HOST ? import.meta.env.VITE_HOST : "http://localhost"

		let token = document.cookie
			.split('; ')
			.find(row => row.startsWith('token='))
		if(!token) {
			console.error("no token cookie")
			return
		}
		token = token.split('=')[1]

		const channel = geckos({
			url: host,
			port: 9208,
			authorization: `${this.address} ${token} ${this.roomMode} ${this.roomId}`,
		})

		channel.onConnect(error => {
			if (error) {
				if (error.status == 401) {
					this.scene.start(scenes.LANDING_SCENE)
					document.cookie = 'token=; Max-Age=0; path=/; domain=' + location.hostname
					return
				}
				console.error(error.message)
				text.setText(`error ${error.status}: ${error.statusText}. ${error.message}`)
			}

			channel.on('roomId', (roomId) => {
				text.setText("room ID: " + roomId)
			})

			// channel.emit('start')

			channel.on('ready', (initialData) => {
				// text.setText('connected!')
				console.log(initialData)
				// setTimeout(() => {
				// 	this.scene.start(scenes.DUNGEON_SCENE, { channel, initialData })
				// }, 500)
			})
		})
	}
}