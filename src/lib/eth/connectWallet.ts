import { JsonRpcSigner } from "@ethersproject/providers"
import WalletConnectProvider from "@walletconnect/web3-provider"
import { ethers } from "ethers"
import Web3Modal from "web3modal"

const connectWallet = async ({
    onAccountsChanged,
    onChainChanged,
    onConnect,
    onDisconnect
}: {
    onAccountsChanged: (accounts: string[]) => void,
    onChainChanged: (chainId: number) => void,
    onConnect: (chainId: number) => void,
    onDisconnect: (code: number, message: string) => void,
}
): Promise<JsonRpcSigner> => {
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

    provider.on('accountsChanged', (accounts: string[]) => {
        onAccountsChanged(accounts)
    })

    provider.on('chainChanged', chainId => {
        onChainChanged(chainId)
    })

    provider.on('connect', ({ chainId }) => {
        onConnect(chainId)
    })

    provider.on('disconnect', ({ code, message }) => {
        onDisconnect(code, message)
    })

    const signer = provider.getSigner()
    return signer
}

export default connectWallet