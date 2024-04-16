import {NetworkProvider} from "@ton/blueprint";
import {Address, fromNano, TupleItem, TupleReader} from "@ton/core";
import {nftCollectionContract} from "../contest/contractConifg";
import {NftCollection} from "../build/XplusAtTonNFT/tact_NftCollection";
import {convertDateFromContract} from "./util/dateTimeTools";

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();
    const _address = Address.parse(nftCollectionContract[provider.network()]);
    if (!(await provider.isContractDeployed(_address))) {
        ui.write(`Error: Contract at address ${_address} is not deployed!`);
        return;
    }

    const nftCollection = provider.open(NftCollection.fromAddress(_address));
    const data = await nftCollection.getGetCollectionData()
    const item: TupleItem = {
        type: 'slice',
        cell: data.collection_content,
    };
    const source_url = new TupleReader([item]);

    console.log({
       url:source_url.readString()
    })
    ui.clearActionPrompt();
}
