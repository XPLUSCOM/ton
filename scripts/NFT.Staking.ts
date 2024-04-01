import {NetworkProvider} from "@ton/blueprint";
import {Address, toNano} from "@ton/core";
import {nftCollectionContract} from "../contest/contractConifg";
import {getSeqNo, waitSeqNoChange} from "./util/getHashBySeqno";
import {NftCollection} from "../build/XplusAtTonNFT/tact_NftCollection";
import {NftItem} from "../wrappers/NFTItem";

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();
    const nftAddress = await ui.input('NFT Address, If you dont know, Plx use NFT.GET.NftAddressByIndex.')
    const _address = Address.parse(nftAddress);
    if (!(await provider.isContractDeployed(_address))) {
        ui.write(`Error: Contract at address ${_address} is not deployed!`);
        return;
    }
    const seqno = await getSeqNo(provider, provider.sender().address!);
    console.log({seqno})
    const nftItem = provider.open(NftItem.fromAddress(_address));

    await nftItem.send(
        provider.sender(),
        {
            value: toNano('0.1'),
        },
        "Staking"
    )

    if (await waitSeqNoChange(provider, provider.sender().address!, seqno)) {
        console.log("Msg Sent.")
    }
    ui.clearActionPrompt();
}
