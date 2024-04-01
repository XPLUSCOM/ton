import {NetworkProvider} from "@ton/blueprint";
import {Address, toNano} from "@ton/core";
import {nftCollectionContract} from "../contest/contractConifg";
import {getSeqNo, waitSeqNoChange} from "./util/getHashBySeqno";
import {NftCollection} from "../build/XplusAtTonNFT/tact_NftCollection";

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();
    const _address = Address.parse(nftCollectionContract.testnet);
    if (!(await provider.isContractDeployed(_address))) {
        ui.write(`Error: Contract at address ${_address} is not deployed!`);
        return;
    }

    const nftCollection = provider.open(NftCollection.fromAddress(_address));
    const collectionDataBefore = await nftCollection.getGetCollectionData()
    console.log("Last Index",Number(collectionDataBefore.next_item_index)-1)
    const index = await ui.input('index')
    const lastNFTAddress = await nftCollection.getGetNftAddressByIndex(BigInt(+index))
    console.log({lastNFTAddress})
    ui.clearActionPrompt();
}
