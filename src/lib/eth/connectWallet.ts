import { JsonRpcSigner, Web3Provider } from "@ethersproject/providers"
import WalletConnectProvider from "@walletconnect/web3-provider"
import { ethers } from "ethers"
import Web3Modal, { getProviderInfo } from "web3modal"
import eventsCenter from "../eventsCenter"

const targetChainId = '0xa4b'

const connectWallet = async (): Promise<JsonRpcSigner> => {
    const providerOptions = {
        walletconnect: {
            package: WalletConnectProvider,
            options: {
                infuraId: "0e7fcc143f894d179aa51dbdc44d8ac5"
            }
        },
    }

    const web3Modal = new Web3Modal({
        providerOptions,
        cacheProvider: true
    })

    const instance = await web3Modal.connect()

    const provider = new ethers.providers.Web3Provider(instance)

    registerEIP1193(provider)

    const chainId = await provider.send('eth_chainId', [])
    if (chainId !== targetChainId) {
        throw new Error('wrong chain')
    }

    const signer = provider.getSigner()
    return signer
}

const registerEIP1193 = (provider: Web3Provider) => {
    const { type } = getProviderInfo(provider)

    if (type === 'injected' && window.ethereum) {
        const { ethereum } = window

        ethereum.on('accountsChanged', (accounts: string[]) => {
            eventsCenter.emit('accountsChanged', accounts)
        })
        ethereum.on('connect', (info: { chainId: number }) => {
            eventsCenter.emit('connect', info)
        })
        ethereum.on('disconnect', (error: { code: number, message: string }) => {
            eventsCenter.emit('disconnect', error)
        })
        ethereum.on('chainChanged', (chainId: number) => {
            eventsCenter.emit('chainChanged', chainId)
        })
        return
    }

    provider.on('accountsChanged', (accounts: string[]) => {
        eventsCenter.emit('accountsChanged', accounts)
    })
    provider.on('connect', (info: { chainId: number }) => {
        eventsCenter.emit('connect', info)
    })
    provider.on('disconnect', (error: { code: number, message: string }) => {
        eventsCenter.emit('disconnect', error)
    })
    provider.on('chainChanged', (chainId: number) => {
        eventsCenter.emit('chainChanged', chainId)
    })
}

export default connectWallet