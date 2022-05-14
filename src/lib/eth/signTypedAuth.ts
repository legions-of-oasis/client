import { JsonRpcSigner } from "@ethersproject/providers"
import generateTypedAuth from "../../commons/auth.js"

const signTypedAuth = async (signer: JsonRpcSigner): Promise<{ sig: string, address: string }> => {

    const address = await signer.getAddress()

    const host = import.meta.env.VITE_HOST ? import.meta.env.VITE_HOST : "http://localhost:9208"

    //get challenge
    let res = await fetch(host + "/challenge", {
        method: "POST",
        body: address,
    })

    if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}`)
    }

    const challenge = await res.text()
    const { domain, types, value } = generateTypedAuth(challenge)

    //generate signature
    const sig = await signer._signTypedData(domain, types, value)

    //generate jwt token
    res = await fetch(
        host + "/generateToken", {
            method: "POST",
            body: `${address} ${sig}`
        }
    )

    if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}`)
    }

    const token = await res.json()

    document.cookie = `token=${token}`

    return {
        sig,
        address
    }
}

export default signTypedAuth