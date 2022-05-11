import { ethers } from "ethers"
import { ClaimManagerERC721__factory, ClaimVerifier__factory } from "./types"

const factories = {
    "0x50b13bBD3BA1763A15DE9401E4e91b4846383b2f": ClaimVerifier__factory,
    "0x51FF0944cE18d2F82fEA4942CE06b038e8Ac8451": ClaimManagerERC721__factory
}

export const getContract = (address: string, signer: ethers.Signer) => {
    const factory = factories[address]
    const contract = new factory(signer).attach(address)
    return contract
}