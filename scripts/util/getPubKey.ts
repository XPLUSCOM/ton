import {relayer} from "../../contest/demoWallet";
import {getRelayerPublicKey} from "../Inventroy.DEPOLY";

const main = async ()=>{
    const publicKey = await getRelayerPublicKey(relayer.mnemonics.split(' '))
    console.log(publicKey)
}

main()
